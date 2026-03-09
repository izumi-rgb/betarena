import logger from '../../config/logger';
import redis from '../../config/redis';
import * as apiFootball from './providers/api-football';
import * as apiBasketball from './providers/api-basketball';
import * as apiHockey from './providers/api-hockey';
import * as apiBaseball from './providers/api-baseball';
import * as apiRugby from './providers/api-rugby';
import * as apiHandball from './providers/api-handball';
import * as apiVolleyball from './providers/api-volleyball';
import * as espn from './providers/espn-hidden';
import * as oddspapi from './providers/oddspapi';
import * as oddsApiIo from './providers/odds-api-io';
import * as cricketData from './providers/cricket-data';
import * as cricbuzz from './providers/cricbuzz';
import * as fotmobLive from './providers/fotmob-live';
import * as theSportsDb from './providers/thesportsdb';
import {
  normalizeApiFootball,
  normalizeApiBasketball,
  normalizeApiHockey,
  normalizeApiBaseball,
  normalizeApiRugby,
  normalizeApiHandball,
  normalizeApiVolleyball,
  normalizeESPN,
  normalizeCricket,
  normalizeCricbuzz,
  normalizeFotmob,
  normalizeOddsApiIo,
  normalizeOddsMarkets,
} from './normalizer/normalizer';
import { generateOdds } from './odds-generator';
import type { LiveEvent, Market } from './types';

// ---------------------------------------------------------------------------
// Display filtering constants
// ---------------------------------------------------------------------------

const MIN_EVENTS_TO_SHOW = 8;
const MAX_EVENTS_TO_SHOW = 20;

const TIER_1_LEAGUES = new Set([
  'premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1',
  'champions league', 'europa league',
  'nba', 'nfl', 'nhl', 'mlb',
  'atp', 'wta', 'grand slam',
  'ipl', 'big bash', 'test cricket', 'world cup', 'sheffield shield',
  't20 world cup', 'odi',
]);

const TIER_2_LEAGUES = new Set([
  'mls', 'eredivisie', 'primeira liga', 'scottish premiership',
  'college basketball', 'college football',
  'ncaa', 'ahl', 'g league', 'world baseball classic',
  'euroleague', 'liga acb',
]);

// Major leagues for API-Sports basketball/hockey/baseball.
// Without this filter, we get 400+ minor-league games that drown out other sports.
const MAJOR_LEAGUES = new Set([
  // Basketball
  'nba', 'ncaa', 'ncaa women', 'euroleague', 'eurocup', 'liga acb',
  'bbl', 'nbl', 'nbl1', 'lnb', 'serie a', 'bsk', 'super league',
  'basketball bundesliga', 'turkish league', 'vtb united league',
  'nba - g league', 'chinese cba',
  // Hockey
  'nhl', 'khl', 'shl', 'liiga', 'nla', 'del', 'extraliga',
  'ahl', 'ohl', 'whl', 'qmjhl', 'allsvenskan',
  // Baseball
  'mlb', 'mlb - spring training', 'npb', 'kbo',
  'world baseball classic', 'liga mexicana',
  // Rugby
  'six nations', 'rugby championship', 'super rugby', 'premiership',
  'top 14', 'united rugby championship', 'pro14', 'champions cup',
  // Handball
  'bundesliga', 'liga asobal', 'starligue', 'ehf champions league',
  'nla', 'superliga', 'handbollsligan',
  // Volleyball
  'superliga', 'serie a', 'bundesliga', 'plusliga',
  'cev champions league', 'vnl', 'superlega',
]);

function isMajorLeague(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Record<string, unknown>;
  const league = r.league as Record<string, unknown> | undefined;
  const name = String(league?.name ?? '').toLowerCase();
  for (const major of MAJOR_LEAGUES) {
    if (name.includes(major)) return true;
  }
  return false;
}

function getLeagueTier(event: LiveEvent): 1 | 2 | 3 {
  const name = (event.competition?.name ?? '').toLowerCase();
  for (const t1 of TIER_1_LEAGUES) if (name.includes(t1)) return 1;
  for (const t2 of TIER_2_LEAGUES) if (name.includes(t2)) return 2;
  return 3;
}

export function filterAndSortEvents(events: LiveEvent[]): LiveEvent[] {
  // Ensure sport diversity: reserve up to 3 slots per sport, then fill remainder by tier
  const bySport = new Map<string, LiveEvent[]>();
  for (const e of events) {
    const sport = e.sport || 'other';
    if (!bySport.has(sport)) bySport.set(sport, []);
    bySport.get(sport)!.push(e);
  }

  // Sort each sport's events: odds first, then by tier
  for (const [, sportEvents] of bySport) {
    sportEvents.sort((a, b) => {
      const aHasOdds = a.markets.length > 0 ? 0 : 1;
      const bHasOdds = b.markets.length > 0 ? 0 : 1;
      if (aHasOdds !== bHasOdds) return aHasOdds - bHasOdds;
      return getLeagueTier(a) - getLeagueTier(b);
    });
  }

  // Phase 1: take up to 3 best events per sport (guarantees diversity)
  const reserved: LiveEvent[] = [];
  const reservedIds = new Set<string>();
  for (const [, sportEvents] of bySport) {
    for (const e of sportEvents.slice(0, 3)) {
      reserved.push(e);
      reservedIds.add(e.id);
    }
  }

  // Phase 2: fill remaining slots from all events sorted by odds+tier
  const remaining = events
    .filter((e) => !reservedIds.has(e.id))
    .sort((a, b) => {
      const aHasOdds = a.markets.length > 0 ? 0 : 1;
      const bHasOdds = b.markets.length > 0 ? 0 : 1;
      if (aHasOdds !== bHasOdds) return aHasOdds - bHasOdds;
      return getLeagueTier(a) - getLeagueTier(b);
    });

  const result = [...reserved, ...remaining];
  return result.slice(0, MAX_EVENTS_TO_SHOW);
}

const DISPLAY_LIST_KEY = 'display:live:events';
const DISPLAY_LIST_TTL = 60; // seconds — longer than raw provider TTL (15s)

async function mergeWithDisplayList(fresh: LiveEvent[]): Promise<LiveEvent[]> {
  let existing: LiveEvent[] = [];

  try {
    const cached = await redis.get(DISPLAY_LIST_KEY);
    if (cached) {
      existing = JSON.parse(cached) as LiveEvent[];
      // Restore Date objects serialised as strings by JSON
      for (const e of existing) {
        e.startTime = new Date(e.startTime);
        e.lastUpdated = new Date(e.lastUpdated);
      }
    }
  } catch (err) {
    logger.warn('mergeWithDisplayList: Redis read failed (non-fatal)', {
      error: (err as Error).message,
    });
  }

  const now = Date.now();
  const STALE_MS = 5 * 60 * 1000; // 5 minutes
  const MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3 hours — hard cap for stale events (e.g. cricket)
  const freshById = new Map<string, LiveEvent>(
    fresh.map((e) => [e.id, { ...e, lastSeenInFeed: now }])
  );

  // 1. Update-in-place for events already in the display list
  const merged: LiveEvent[] = [];
  for (const old of existing) {
    if (old.status === 'ft' || old.status === 'ht') continue; // remove finished/paused events
    if (now - new Date(old.lastUpdated).getTime() > MAX_AGE_MS) continue; // force-evict stale events
    const updated = freshById.get(old.id);
    if (!updated && old.lastSeenInFeed && now - old.lastSeenInFeed > STALE_MS) continue; // drop ghost events
    merged.push(updated ?? old); // keep position; use fresh data if available
  }

  // 2. Append genuinely new events (not in the existing list)
  const existingIds = new Set(existing.map((e) => e.id));
  const newEvents = fresh.filter((e) => !existingIds.has(e.id)).map((e) => ({ ...e, lastSeenInFeed: now }));
  newEvents.sort((a, b) => getLeagueTier(a) - getLeagueTier(b));
  merged.push(...newEvents);

  const result = merged.slice(0, MAX_EVENTS_TO_SHOW);

  try {
    await redis.setex(DISPLAY_LIST_KEY, DISPLAY_LIST_TTL, JSON.stringify(result));
  } catch (err) {
    logger.warn('mergeWithDisplayList: Redis write failed (non-fatal)', {
      error: (err as Error).message,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Team-name matching for odds enrichment
// ---------------------------------------------------------------------------

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(fc|sc|cf|afc|ac|as|us|ss|rc|rcd|cd|ud|sd|fk|sk|bk|if|bv|sv|tsv|vfb|vfl)\b/g, '')
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function teamNamesMatch(a: string, b: string): boolean {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  if (na === nb) return true;
  if (na.length > 2 && nb.length > 2 && (na.includes(nb) || nb.includes(na))) return true;

  const wordsA = na.split(' ').filter(w => w.length > 2);
  const wordsB = nb.split(' ').filter(w => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const shared = wordsA.filter(w => wordsB.some(wb => wb.includes(w) || w.includes(wb)));
  const threshold = Math.min(wordsA.length, wordsB.length);
  return shared.length >= 1 && shared.length >= Math.max(threshold * 0.3, 1);
}

// ODDS-API sport slugs for fixture-based odds fetching
const ODDSPAPI_SPORTS: import('./providers/oddspapi').OddsPapiSport[] = [
  'soccer', 'basketball', 'tennis', 'baseball', 'cricket', 'ice-hockey',
];

function addToLookup(lookup: Map<string, Market[]>, items: unknown[]): void {
  for (const item of items) {
    const r = item as Record<string, unknown>;
    const home = String(r.home_team || '');
    const away = String(r.away_team || '');
    if (!home || !away) continue;

    const markets = normalizeOddsMarkets(r, 'the-odds-api');
    if (markets.length === 0) continue;

    const key = `${normalizeTeamName(home)}||${normalizeTeamName(away)}`;
    if (!lookup.has(key)) lookup.set(key, markets);
  }
}

/**
 * Build a lookup of odds keyed by normalized team-name pairs.
 * Uses ODDS-API (RapidAPI) as the sole odds source.
 */
async function buildOddsLookup(): Promise<Map<string, Market[]>> {
  const lookup = new Map<string, Market[]>();

  // Primary: odds-api.io (100 req/hour, ML + Totals markets, 200+ live events)
  try {
    const sportsFilter = new Set(['football', 'basketball', 'tennis', 'baseball', 'ice-hockey', 'cricket', 'handball', 'volleyball', 'rugby']);
    const ioResults = await oddsApiIo.getAllLiveOdds(sportsFilter);
    if (Array.isArray(ioResults)) {
      addToLookup(lookup, ioResults);
    }
    if (ioResults.length > 0) {
      logger.info(`odds-api.io: ${ioResults.length} events with odds added to lookup`);
    }
  } catch (err) {
    logger.info('odds-api.io odds fetch failed', { error: (err as Error).message });
  }

  // Secondary: ODDS-API via RapidAPI (fills gaps for sports not covered above)
  try {
    const results = await Promise.allSettled(
      ODDSPAPI_SPORTS.map(sport => oddspapi.getOddsForSport(sport))
    );
    let added = 0;
    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        const beforeSize = lookup.size;
        addToLookup(lookup, result.value);
        added += lookup.size - beforeSize;
      }
    }
    if (added > 0) {
      logger.info(`ODDS-API (RapidAPI): added ${added} additional events to lookup`);
    }
  } catch (err) {
    logger.info('ODDS-API odds fetch failed', { error: (err as Error).message });
  }

  logger.info(`Odds lookup built: ${lookup.size} events with odds`);
  return lookup;
}

function findOddsForEvent(event: LiveEvent, lookup: Map<string, Market[]>): Market[] {
  const homeNorm = normalizeTeamName(event.homeTeam.name);
  const awayNorm = normalizeTeamName(event.awayTeam.name);
  const directKey = `${homeNorm}||${awayNorm}`;
  if (lookup.has(directKey)) return lookup.get(directKey)!;

  for (const [key, markets] of lookup) {
    const [h, a] = key.split('||');
    if (teamNamesMatch(event.homeTeam.name, h) && teamNamesMatch(event.awayTeam.name, a)) {
      return markets;
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Main aggregation
// ---------------------------------------------------------------------------

const AGGREGATE_CACHE_KEY = 'aggregate:live-events';
const AGGREGATE_CACHE_TTL = 180; // 3 minutes

/**
 * Fetches live events from all providers, enriches with odds, and stores
 * the result in Redis under `aggregate:live-events` with a 3-minute TTL.
 * Called by the sports-data cron every 3 minutes and as a fallback from getLiveEvents().
 */
export async function refreshAggregateCache(): Promise<{ live: LiveEvent[]; upcoming: LiveEvent[] }> {
  const events: LiveEvent[] = [];
  const footballIds = new Set<string>();

  // FotMob Live — FREE, no daily limit. Primary football source for live scores.
  try {
    const fotmobMatches = await fotmobLive.getLiveMatches();
    if (Array.isArray(fotmobMatches)) {
      for (const raw of fotmobMatches) {
        const event = normalizeFotmob(raw);
        if (event) {
          events.push(event);
          // Track home+away names to deduplicate with API-Football
          footballIds.add(`${event.homeTeam.name.toLowerCase()}||${event.awayTeam.name.toLowerCase()}`);
        }
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch FotMob live data', { error: (err as Error).message });
  }

  // Also fetch today's upcoming matches from FotMob (pre-match)
  try {
    const fotmobToday = await fotmobLive.getTodayMatches();
    if (Array.isArray(fotmobToday)) {
      for (const raw of fotmobToday) {
        const event = normalizeFotmob(raw);
        if (event && !footballIds.has(`${event.homeTeam.name.toLowerCase()}||${event.awayTeam.name.toLowerCase()}`)) {
          events.push(event);
          footballIds.add(`${event.homeTeam.name.toLowerCase()}||${event.awayTeam.name.toLowerCase()}`);
        }
      }
    }
  } catch (err) {
    logger.debug('Failed to fetch FotMob today matches', { error: (err as Error).message });
  }

  // API-Football — richer data (logos, period scores) but 100/day limit.
  // Only add matches not already covered by FotMob.
  try {
    const footballFixtures = await apiFootball.getLiveFixtures();
    if (Array.isArray(footballFixtures)) {
      for (const raw of footballFixtures) {
        const event = normalizeApiFootball(raw);
        if (event) {
          const key = `${event.homeTeam.name.toLowerCase()}||${event.awayTeam.name.toLowerCase()}`;
          if (!footballIds.has(key)) {
            events.push(event);
            footballIds.add(key);
          }
        }
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch live football', { error: (err as Error).message });
  }

  // API-Basketball (same APISPORTS_KEY, separate 100/day limit)
  // Filter to major leagues to avoid 400+ minor league games drowning other sports
  try {
    const basketballGames = await apiBasketball.getTodayGames();
    if (Array.isArray(basketballGames)) {
      for (const raw of basketballGames) {
        if (!isMajorLeague(raw)) continue;
        const event = normalizeApiBasketball(raw);
        if (event) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch basketball', { error: (err as Error).message });
  }

  // API-Hockey (same APISPORTS_KEY, separate 100/day limit)
  try {
    const hockeyGames = await apiHockey.getTodayGames();
    if (Array.isArray(hockeyGames)) {
      for (const raw of hockeyGames) {
        if (!isMajorLeague(raw)) continue;
        const event = normalizeApiHockey(raw);
        if (event) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch hockey', { error: (err as Error).message });
  }

  // API-Baseball (same APISPORTS_KEY, separate 100/day limit)
  try {
    const baseballGames = await apiBaseball.getTodayGames();
    if (Array.isArray(baseballGames)) {
      for (const raw of baseballGames) {
        if (!isMajorLeague(raw)) continue;
        const event = normalizeApiBaseball(raw);
        if (event) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch baseball', { error: (err as Error).message });
  }

  // API-Rugby (same APISPORTS_KEY, separate 100/day limit)
  try {
    const rugbyGames = await apiRugby.getTodayGames();
    if (Array.isArray(rugbyGames)) {
      for (const raw of rugbyGames) {
        if (!isMajorLeague(raw)) continue;
        const event = normalizeApiRugby(raw);
        if (event) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch rugby', { error: (err as Error).message });
  }

  // API-Handball (same APISPORTS_KEY, separate 100/day limit)
  try {
    const handballGames = await apiHandball.getTodayGames();
    if (Array.isArray(handballGames)) {
      for (const raw of handballGames) {
        if (!isMajorLeague(raw)) continue;
        const event = normalizeApiHandball(raw);
        if (event) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch handball', { error: (err as Error).message });
  }

  // API-Volleyball (same APISPORTS_KEY, separate 100/day limit)
  try {
    const volleyballGames = await apiVolleyball.getTodayGames();
    if (Array.isArray(volleyballGames)) {
      for (const raw of volleyballGames) {
        if (!isMajorLeague(raw)) continue;
        const event = normalizeApiVolleyball(raw);
        if (event) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch volleyball', { error: (err as Error).message });
  }

  // ESPN — only fetch sports NOT already covered by API-Sports providers.
  // API-Sports gives richer data (logos, proper statuses, period scores).
  // ESPN is still useful for EPL/UCL soccer fallback if API-Football quota runs out.
  const espnSkipSports = new Set(['nba', 'nhl', 'mlb']); // covered by API-Sports above
  try {
    const espnData = await espn.getAllUSScoreboards();
    for (const [sport, data] of Object.entries(espnData)) {
      if (espnSkipSports.has(sport)) continue; // already have richer data
      if (!data || typeof data !== 'object') continue;
      const espnEvents = (data as Record<string, unknown>).events as unknown[] | undefined;
      if (!Array.isArray(espnEvents)) continue;
      for (const raw of espnEvents) {
        const event = normalizeESPN(raw, sport);
        if (event) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch ESPN data', { error: (err as Error).message });
  }

  // Cricket: try Cricbuzz first (richer data, no daily limit), fall back to CricketData
  const cricketIds = new Set<string>();
  try {
    const cbMatches = await cricbuzz.getAllLiveMatches();
    if (Array.isArray(cbMatches)) {
      for (const raw of cbMatches) {
        const event = normalizeCricbuzz(raw);
        if (event) {
          events.push(event);
          cricketIds.add(event.id);
        }
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch Cricbuzz data', { error: (err as Error).message });
  }

  // CricketData fallback — only add matches not already covered by Cricbuzz
  try {
    const cricketMatches = await cricketData.getCurrentMatches();
    if (Array.isArray(cricketMatches)) {
      for (const raw of cricketMatches) {
        const event = normalizeCricket(raw);
        if (event && !cricketIds.has(event.id)) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch cricket data', { error: (err as Error).message });
  }

  // odds-api.io — fills gaps for ALL sports when API-Sports providers are capped.
  // Has 200+ live events across football, basketball, tennis, hockey, handball, etc.
  // No extra API call — reuses the live events already fetched for odds enrichment.
  // Dedup by normalized team name pairs to avoid duplicates with existing providers.
  try {
    const existingKeys = new Set<string>();
    for (const e of events) {
      const key = `${e.homeTeam.name.toLowerCase()}||${e.awayTeam.name.toLowerCase()}`;
      existingKeys.add(key);
    }

    const ioEvents = await oddsApiIo.getLiveEvents();
    let ioAdded = 0;
    if (Array.isArray(ioEvents)) {
      for (const raw of ioEvents) {
        const event = normalizeOddsApiIo(raw);
        if (!event) continue;
        const key = `${event.homeTeam.name.toLowerCase()}||${event.awayTeam.name.toLowerCase()}`;
        if (existingKeys.has(key)) continue;
        events.push(event);
        existingKeys.add(key);
        ioAdded++;
      }
    }
    if (ioAdded > 0) {
      logger.info(`odds-api.io: added ${ioAdded} events not covered by other providers`);
    }
  } catch (err) {
    logger.warn('Failed to fetch odds-api.io events', { error: (err as Error).message });
  }

  // Enrich events with real odds from The Odds API
  try {
    const oddsLookup = await buildOddsLookup();
    let enriched = 0;
    for (const event of events) {
      const markets = findOddsForEvent(event, oddsLookup);
      if (markets.length > 0) {
        event.markets = markets;
        enriched++;
      }
    }
    if (enriched > 0) {
      logger.info(`Enriched ${enriched}/${events.length} events with odds`);
    }
  } catch (err) {
    logger.warn('Odds enrichment failed (non-fatal)', { error: (err as Error).message });
  }

  // Generate synthetic house odds for events still without markets
  let synthetic = 0;
  for (const event of events) {
    if (event.markets.length === 0 && event.status !== 'ft') {
      event.markets = generateOdds(event);
      synthetic++;
    }
  }
  if (synthetic > 0) {
    logger.info(`Generated synthetic odds for ${synthetic} events`);
  }

  // Store finished event results in Redis for bet settlement (24h TTL).
  // Live API events aren't in the DB, so settlement needs this cache.
  for (const e of events) {
    if (e.status === 'ft') {
      try {
        await redis.setex(`result:${e.id}`, 86400, JSON.stringify({
          id: e.id,
          sport: e.sport,
          score: e.score,
          status: e.status,
          homeTeam: e.homeTeam.name,
          awayTeam: e.awayTeam.name,
        }));
      } catch { /* non-fatal */ }
    }
  }

  // Split by status: show all live events from known providers.
  // Events without odds still show — frontend renders "Odds unavailable" gracefully.
  // Only filter out events missing team names.
  const liveOnly = events.filter(e => {
    if (e.status !== 'live') return false;
    // Must have valid team names
    if (!e.homeTeam.name || !e.awayTeam.name) return false;
    if (e.homeTeam.name === 'Home' && e.awayTeam.name === 'Away') return false;
    return true;
  });
  const upcoming = events.filter(e => e.status === 'pre');

  const filteredLive = filterAndSortEvents(liveOnly);
  const stableLive = await mergeWithDisplayList(filteredLive);

  upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const cappedUpcoming = upcoming.slice(0, MAX_EVENTS_TO_SHOW);

  const statusCounts: Record<string, number> = {};
  for (const e of events) statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  logger.info(`refreshAggregateCache: ${events.length} raw → ${stableLive.length} live + ${cappedUpcoming.length} upcoming`, { statusCounts });

  const result = { live: stableLive, upcoming: cappedUpcoming };

  // Store in Redis aggregate cache — but don't overwrite good data with empty results
  try {
    if (stableLive.length > 0 || cappedUpcoming.length > 0) {
      await redis.setex(AGGREGATE_CACHE_KEY, AGGREGATE_CACHE_TTL, JSON.stringify(result));
    } else {
      // All providers rate-limited — preserve existing cache instead of writing empty
      const existing = await redis.get(AGGREGATE_CACHE_KEY);
      if (existing) {
        const existingResult = JSON.parse(existing);
        const existingLive = existingResult?.live?.length || 0;
        if (existingLive > 0) {
          logger.info('refreshAggregateCache: preserving existing cache (all providers rate-limited)');
          // Extend TTL to keep serving stale data
          await redis.expire(AGGREGATE_CACHE_KEY, AGGREGATE_CACHE_TTL);
          return existingResult;
        }
      }
      await redis.setex(AGGREGATE_CACHE_KEY, AGGREGATE_CACHE_TTL, JSON.stringify(result));
    }
  } catch (err) {
    logger.warn('Failed to write aggregate cache', { error: (err as Error).message });
  }

  return result;
}

export async function getLiveEvents(): Promise<{ live: LiveEvent[]; upcoming: LiveEvent[] }> {
  // Try aggregate cache first
  try {
    const cached = await redis.get(AGGREGATE_CACHE_KEY);
    if (cached) {
      logger.info('getLiveEvents: aggregate cache HIT');
      const parsed = JSON.parse(cached) as { live: LiveEvent[]; upcoming: LiveEvent[] };
      // Restore Date objects serialised as strings by JSON
      for (const e of [...parsed.live, ...parsed.upcoming]) {
        e.startTime = new Date(e.startTime);
        e.lastUpdated = new Date(e.lastUpdated);
      }
      return parsed;
    }
  } catch (err) {
    logger.warn('getLiveEvents: aggregate cache read failed', { error: (err as Error).message });
  }

  // Cache miss — fall back to full refresh
  logger.info('getLiveEvents: aggregate cache MISS, refreshing');
  return refreshAggregateCache();
}

export async function getEvent(eventId: string): Promise<LiveEvent | null> {
  try {
    const raw = await apiFootball.getFixture(eventId);
    if (raw) {
      const event = normalizeApiFootball(raw);
      if (event) {
        // Enrich with odds
        const markets = await getMarkets(eventId);
        return { ...event, markets };
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch event from API-Football', { eventId, error: (err as Error).message });
  }
  return null;
}

export async function getMarkets(eventId: string): Promise<Market[]> {
  // Try to find odds from the aggregate cache first (no API call)
  try {
    const cached = await redis.get(AGGREGATE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as { live: LiveEvent[]; upcoming: LiveEvent[] };
      const allEvents = [...(parsed.live || []), ...(parsed.upcoming || [])];
      const match = allEvents.find(e => String(e.id) === eventId);
      if (match?.markets && match.markets.length > 0) {
        return match.markets;
      }
    }
  } catch (err) {
    logger.debug('Markets cache lookup failed', { eventId, error: (err as Error).message });
  }

  // Fall back to building fresh odds lookup
  try {
    const oddsLookup = await buildOddsLookup();
    // Try to match by iterating the lookup (keyed by team names)
    for (const markets of oddsLookup.values()) {
      if (markets.length > 0) {
        // The lookup doesn't store event IDs, so we can't match directly.
        // Return empty — the event detail page gets odds from the live feed.
      }
    }
  } catch (err) {
    logger.debug('Markets fetch failed', { eventId, error: (err as Error).message });
  }

  return [];
}

export async function getTeamInfo(teamName: string) {
  return theSportsDb.searchTeam(teamName);
}

export async function getCompetitionInfo(leagueId: string) {
  return theSportsDb.getLeague(leagueId);
}

export async function getResults(leagueId: string) {
  return theSportsDb.getPastResults(leagueId);
}
