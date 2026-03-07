import db from '../../config/database';
import redis from '../../config/redis';
import { ODDS_CACHE_TTL_SECONDS } from '../../config/constants';
import * as SportsDataService from '../sports-data/sports-data.service';
import logger from '../../config/logger';

/** Slug for URL/tabs: "American Football" -> "american-football" */
function sportToSlug(sport: string): string {
  return (sport || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
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

function parseScore(score: any): { homeScore: number; awayScore: number } {
  if (!score) return { homeScore: 0, awayScore: 0 };
  const s = typeof score === 'string' ? JSON.parse(score) : score;
  return {
    homeScore: parseInt(s?.home, 10) || 0,
    awayScore: parseInt(s?.away, 10) || 0,
  };
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
    .whereIn('status', ['upcoming', 'live'])
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

function toSlug(val: string) {
  return (val || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

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

export async function getEventMarkets(eventId: number) {
  const cacheKey = `markets:${eventId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Try real sports data providers first
  try {
    const markets = await SportsDataService.getMarkets(String(eventId));
    if (markets.length > 0) {
      const event = await db('events').where({ id: eventId }).first();
      const result = {
        event: event ? mapEventRow(event) : null,
        markets,
      };
      await redis.setex(cacheKey, ODDS_CACHE_TTL_SECONDS, JSON.stringify(result));
      return result;
    }
  } catch (err) {
    logger.warn('SportsDataService.getMarkets failed, falling back to DB', {
      eventId,
      error: (err as Error).message,
    });
  }

  // Fallback: local DB query
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

export async function getLiveEvents() {
  try {
    const liveEvents = await SportsDataService.getLiveEvents();
    return liveEvents;
  } catch (err) {
    logger.warn('SportsDataService.getLiveEvents failed', {
      error: (err as Error).message,
    });
  }
  return [];
}
