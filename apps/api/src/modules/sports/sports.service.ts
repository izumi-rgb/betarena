import db from '../../config/database';
import redis from '../../config/redis';
import { ODDS_CACHE_TTL_SECONDS } from '../../config/constants';
import * as SportsDataService from '../sports-data/sports-data.service';
import logger from '../../config/logger';
import { parseScore as parseScoreShared } from '../../utils/parseScore';
import { toSlug } from '../../utils/slug';

/** Slug for URL/tabs: "American Football" -> "american-football" */
function sportToSlug(sport: string): string {
  return toSlug(sport);
}

/** bet365-style sport display order (slug order for tabs) */
const SPORT_ORDER: Record<string, number> = {
  football: 0,
  tennis: 1,
  basketball: 2,
  'ice-hockey': 3,
  cricket: 4,
  'american-football': 5,
  baseball: 6,
};

function parseScore(score: unknown): { homeScore: number; awayScore: number } {
  const parsed = parseScoreShared(score);
  return { homeScore: parsed?.home ?? 0, awayScore: parsed?.away ?? 0 };
}

const MARKET_META: Record<string, { name: string; type: string }> = {
  match_result: { name: 'Match Result', type: 'result' },
  btts: { name: 'Both Teams To Score', type: 'goals' },
  correct_score: { name: 'Correct Score', type: 'result' },
  over_under: { name: 'Over/Under', type: 'goals' },
  asian_handicap: { name: 'Asian Handicap', type: 'handicaps' },
  double_chance: { name: 'Double Chance', type: 'result' },
  draw_no_bet: { name: 'Draw No Bet', type: 'result' },
  team_total_home: { name: 'Home Team Total', type: 'goals' },
  team_total_away: { name: 'Away Team Total', type: 'goals' },
  corners_total: { name: 'Total Corners', type: 'corners' },
  corners_handicap: { name: 'Corners Handicap', type: 'corners' },
  cards_total: { name: 'Total Cards', type: 'cards' },
  player_shots_on_target: { name: 'Player Shots On Target', type: 'players' },
  player_to_score: { name: 'Player To Score', type: 'players' },
};

function mapEventRow(row: any, markets?: any[]) {
  const { homeScore, awayScore } = parseScore(row.score);
  const base = {
    id: row.id,
    homeTeam: { name: row.home_team },
    awayTeam: { name: row.away_team },
    league: row.league,
    sport: row.sport,
    startTime: row.starts_at,
    status: row.status,
    homeScore,
    awayScore,
  };
  if (markets) (base as any).markets = markets;
  return base;
}

function mapOddsRow(row: any) {
  const marketKey = String(row.market_type || '');
  const meta = MARKET_META[marketKey] || {
    name: marketKey.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
    type: 'other',
  };
  const selections = typeof row.selections === 'string' ? JSON.parse(row.selections) : (row.selections || []);
  return {
    id: marketKey,
    name: meta.name,
    type: meta.type,
    selections: selections.map((s: any, i: number) => ({
      id: s.name || s.id || `sel-${i}`,
      name: s.name || s.id || `Sel ${i + 1}`,
      odds: typeof s.odds === 'number' ? s.odds : parseFloat(s.odds) || 0,
      line: s.line || null,
      suspended: Boolean(s.suspended),
      suspended_reason: s.suspended_reason || null,
    })),
  };
}

export async function listSports(): Promise<{ name: string; slug: string; eventsCount: number }[]> {
  const rows = await db('events')
    .select('sport')
    .count('id as event_count')
    .groupBy('sport');
  const list = rows.map((r: any) => ({
    name: r.sport,
    slug: sportToSlug(r.sport),
    eventsCount: parseInt(r.event_count, 10) || 0,
  }));
  list.sort((a, b) => (SPORT_ORDER[a.slug] ?? 99) - (SPORT_ORDER[b.slug] ?? 99));
  return list;
}

export async function getSportCounts(): Promise<Record<string, number>> {
  const rows = await db('events')
    .select('sport')
    .whereIn('status', ['scheduled', 'live'])
    .count('id as count')
    .groupBy('sport');
  const counts: Record<string, number> = {};
  for (const r of rows as any[]) {
    counts[sportToSlug(r.sport)] = parseInt(r.count, 10) || 0;
  }
  return counts;
}

export async function listEventsBySport(sportOrSlug: string) {
  const slug = sportOrSlug.toLowerCase().replace(/\s+/g, '-');
  const distinct = await db('events').distinct('sport');
  const sportRow = distinct.find((r: any) => sportToSlug(r.sport) === slug);
  const sport = sportRow ? (sportRow as any).sport : sportOrSlug;
  const rows = await db('events')
    .where({ sport })
    .whereIn('status', ['scheduled', 'live'])
    .orderByRaw("CASE WHEN status = 'live' THEN 0 ELSE 1 END, starts_at ASC");
  if (rows.length === 0) return [];
  const eventIds = rows.map((r: any) => r.id);
  const oddsRows = await db('odds').whereIn('event_id', eventIds);
  const marketsByEvent: Record<number, any[]> = {};
  for (const o of oddsRows) {
    if (!marketsByEvent[o.event_id]) marketsByEvent[o.event_id] = [];
    marketsByEvent[o.event_id].push(mapOddsRow(o));
  }
  return rows.map((r: any) => mapEventRow(r, marketsByEvent[r.id] || []));
}

// toSlug imported from ../../utils/slug

export async function listCompetitionEvents(sportOrSlug: string, competition: string) {
  const events = await listEventsBySport(sportOrSlug);
  const compSlug = toSlug(competition);

  const filtered = events.filter((e: any) => {
    const leagueSlug = toSlug(e.league || '');
    return leagueSlug === compSlug || String(e.id) === competition;
  });

  if (filtered.length > 0) return filtered;
  return events;
}

export async function getEventMarkets(eventId: string | number) {
  const idStr = String(eventId);
  const isNumeric = /^\d+$/.test(idStr);
  const cacheKey = `markets:${idStr}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Try real sports data providers first
  try {
    const markets = await SportsDataService.getMarkets(idStr);
    if (markets.length > 0) {
      // For numeric IDs, try DB for event info; for live API IDs, use aggregate cache
      let eventInfo: any = null;
      if (isNumeric) {
        const row = await db('events').where({ id: eventId }).first();
        eventInfo = row ? mapEventRow(row) : null;
      }
      if (!eventInfo) {
        // Try aggregate cache for live API events
        try {
          const aggregate = await SportsDataService.getLiveEvents();
          const allEvents = [...aggregate.live, ...aggregate.upcoming];
          const liveEvent = allEvents.find((e: any) => String(e.id) === idStr);
          if (liveEvent) {
            eventInfo = {
              id: liveEvent.id,
              sport: liveEvent.sport,
              home_team: liveEvent.homeTeam?.name ?? null,
              away_team: liveEvent.awayTeam?.name ?? null,
              score_home: liveEvent.score?.home ?? null,
              score_away: liveEvent.score?.away ?? null,
              status: liveEvent.status,
              competition: liveEvent.competition?.name ?? null,
              start_time: liveEvent.startTime ?? null,
            };
          }
        } catch {
          // aggregate cache miss is fine
        }
      }
      const result = { event: eventInfo, markets };
      await redis.setex(cacheKey, ODDS_CACHE_TTL_SECONDS, JSON.stringify(result));
      return result;
    }
  } catch (err) {
    logger.warn('SportsDataService.getMarkets failed, falling back to DB', {
      eventId: idStr,
      error: (err as Error).message,
    });
  }

  // DB fallback (only for numeric IDs)
  if (!isNumeric) throw new Error('EVENT_NOT_FOUND');

  const odds = await db('odds').where({ event_id: eventId });
  const event = await db('events').where({ id: eventId }).first();

  if (!event) throw new Error('EVENT_NOT_FOUND');

  const result = {
    event: mapEventRow(event),
    markets: odds.map((o: any) => mapOddsRow(o)),
  };
  await redis.setex(cacheKey, ODDS_CACHE_TTL_SECONDS, JSON.stringify(result));

  return result;
}

/** Fetch upcoming/scheduled events from DB for the home page. */
export async function getUpcomingEvents() {
  const rows = await db('events')
    .where({ status: 'scheduled' })
    .orderBy('starts_at', 'asc')
    .limit(100);
  if (rows.length === 0) return [];
  const eventIds = rows.map((r: any) => r.id);
  const oddsRows = await db('odds').whereIn('event_id', eventIds);
  const marketsByEvent: Record<number, any[]> = {};
  for (const o of oddsRows) {
    if (!marketsByEvent[o.event_id]) marketsByEvent[o.event_id] = [];
    marketsByEvent[o.event_id].push(mapOddsRow(o));
  }
  return rows.map((r: any) => mapEventRow(r, marketsByEvent[r.id] || []));
}

export async function getLiveEvents() {
  let live: any[] = [];
  let upcoming: any[] = [];
  try {
    const result = await SportsDataService.getLiveEvents();
    live = Array.isArray(result) ? result : (result?.live ?? []);
    // Use API's upcoming when present so API data is shown
    if (result && !Array.isArray(result) && Array.isArray(result.upcoming)) {
      upcoming = result.upcoming;
    }
  } catch (err) {
    logger.warn('SportsDataService.getLiveEvents failed', {
      error: (err as Error).message,
    });
    live = [];
  }

  // Real-only live policy: never backfill "live" from local DB/demo data.
  // If no upcoming from API, use DB fixtures so public pages still have browseable scheduled events.
  if (upcoming.length === 0) {
    try {
      upcoming = await getUpcomingEvents();
    } catch (_) {
      // non-fatal
    }
  }
  const liveIds = new Set(live.map((e: any) => String(e.id)));
  upcoming = upcoming.filter((e: any) => !liveIds.has(String(e.id)));
  return { live, upcoming };
}
