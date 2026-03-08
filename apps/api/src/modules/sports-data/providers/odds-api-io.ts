import axios from 'axios';
import logger from '../../../config/logger';
import redis from '../../../config/redis';
import { getCachedOrFetch } from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// odds-api.io provider  (api.odds-api.io/v3)
// High-coverage odds source. 100 requests/hour, 5000/hour on paid plans.
// Auth via `apiKey` query parameter.
//
// Endpoints:
//   GET /events/live                         → all live events across sports
//   GET /events?sport={slug}                 → events for a sport
//   GET /odds?eventId={id}&bookmakers={list} → odds for one event
//   GET /odds/multi?eventIds={ids}&bookmakers={list} → odds for up to 10 events
//
// Markets returned: ML (1X2), Spread (Asian Handicap), Totals (Over/Under)
// Bookmakers: limited to 2 on free plan (Bet365 + 1xbet configured)
// ---------------------------------------------------------------------------

const PROVIDER = 'odds-api-io';
const BASE_URL = 'https://api.odds-api.io/v3';

// Cache TTLs — budget-conscious (100 req/hour)
const LIVE_EVENTS_TTL = 3 * 60;     // 3 minutes for live event list
const ODDS_BATCH_TTL = 10 * 60;     // 10 minutes for batch odds
const BACKUP_TTL = 24 * 60 * 60;    // 24 hours backup

// Quota tracking
const HOURLY_COUNTER_KEY = `${PROVIDER}:hourly-count`;
const HOURLY_LIMIT = 90; // leave 10 buffer from 100/hour
const QUOTA_PAUSE_KEY = `${PROVIDER}:quota-pause`;
const QUOTA_PAUSE_TTL = 10 * 60; // 10 min pause when approaching limit

// Bookmakers to request (free plan: max 2)
const BOOKMAKERS = 'Bet365,1xbet';

// Multi endpoint batch size
const MULTI_BATCH_SIZE = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OddsApiIoEvent {
  id: number;
  home: string;
  away: string;
  homeId?: number;
  awayId?: number;
  date: string;
  status: string; // 'live' | 'pending' | 'settled' | 'cancelled'
  sport: { name: string; slug: string };
  league: { name: string; slug: string };
  scores?: { home: number; away: number };
}

interface OddsApiIoMlOdds {
  home: string;
  draw?: string;
  away: string;
}

interface OddsApiIoSpreadOdds {
  hdp: number;
  over: string;
  under: string;
}

interface OddsApiIoTotalsOdds {
  hdp: number;
  over: string;
  under: string;
}

interface OddsApiIoMarket {
  name: string; // 'ML' | 'Spread' | 'Totals'
  updatedAt: string;
  odds: (OddsApiIoMlOdds | OddsApiIoSpreadOdds | OddsApiIoTotalsOdds)[];
}

export interface OddsApiIoOddsResponse extends OddsApiIoEvent {
  urls: Record<string, string>;
  bookmakers: Record<string, OddsApiIoMarket[]>;
}

// Normalized output compatible with our Market/Selection types
export interface NormalizedOddsResult {
  home_team: string;
  away_team: string;
  bookmakers: { key: string; markets: { key: string; outcomes: { name: string; price: number }[] }[] }[];
}

// ---------------------------------------------------------------------------
// HTTP client with quota tracking
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.ODDS_API_IO_KEY;
  if (!key) {
    logger.debug(`${PROVIDER}: ODDS_API_IO_KEY is not set`);
    return '';
  }
  return key;
}

async function isQuotaPaused(): Promise<boolean> {
  try {
    const flag = await redis.get(QUOTA_PAUSE_KEY);
    return flag === '1';
  } catch { return false; }
}

async function incrementHourlyCounter(): Promise<number> {
  try {
    const now = new Date();
    const hourKey = `${HOURLY_COUNTER_KEY}:${now.toISOString().slice(0, 13)}`;
    const count = await redis.incr(hourKey);
    if (count === 1) {
      await redis.expire(hourKey, 3700); // slightly over 1 hour
    }
    return count;
  } catch { return 0; }
}

async function fetchFromApi<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  if (await isQuotaPaused()) {
    logger.debug(`${PROVIDER}: quota paused, skipping API call`);
    return null;
  }

  const count = await incrementHourlyCounter();
  if (count > HOURLY_LIMIT) {
    try {
      await redis.setex(QUOTA_PAUSE_KEY, QUOTA_PAUSE_TTL, '1');
    } catch { /* non-fatal */ }
    logger.info(`${PROVIDER}: hourly limit reached (${count}/${HOURLY_LIMIT}), pausing for ${QUOTA_PAUSE_TTL / 60}min`);
    return null;
  }

  try {
    const response = await axios.get<T>(`${BASE_URL}${endpoint}`, {
      params: { apiKey, ...params },
      timeout: 15_000,
    });
    return response.data;
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 429) {
      try {
        await redis.setex(QUOTA_PAUSE_KEY, QUOTA_PAUSE_TTL, '1');
      } catch { /* non-fatal */ }
      logger.info(`${PROVIDER}: rate limited (429), pausing for ${QUOTA_PAUSE_TTL / 60}min`);
    } else {
      logger.debug(`${PROVIDER}: API error on ${endpoint}`, { error: (err as Error).message });
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Transform odds-api.io odds response into The Odds API compatible format
 * so normalizeOddsMarkets() can process them uniformly.
 */
function transformToCompatibleFormat(event: OddsApiIoOddsResponse): NormalizedOddsResult | null {
  const bookmakerEntries = Object.entries(event.bookmakers || {});
  if (bookmakerEntries.length === 0) return null;

  const compatBookmakers: NormalizedOddsResult['bookmakers'] = [];

  for (const [bmName, bmMarkets] of bookmakerEntries) {
    const compatMarkets: { key: string; outcomes: { name: string; price: number }[] }[] = [];

    for (const market of bmMarkets) {
      if (market.name === 'ML' && market.odds.length > 0) {
        // ML → h2h market
        const mlOdds = market.odds[0] as OddsApiIoMlOdds;
        const outcomes: { name: string; price: number }[] = [];

        if (mlOdds.home) outcomes.push({ name: event.home, price: parseFloat(mlOdds.home) });
        if (mlOdds.draw) outcomes.push({ name: 'Draw', price: parseFloat(mlOdds.draw) });
        if (mlOdds.away) outcomes.push({ name: event.away, price: parseFloat(mlOdds.away) });

        if (outcomes.length > 0) {
          compatMarkets.push({ key: 'h2h', outcomes });
        }
      } else if (market.name === 'Totals' && market.odds.length > 0) {
        // Totals → totals market (use first line)
        const totalsOdds = market.odds[0] as OddsApiIoTotalsOdds;
        const outcomes: { name: string; price: number }[] = [];

        if (totalsOdds.over) outcomes.push({ name: `Over ${totalsOdds.hdp}`, price: parseFloat(totalsOdds.over) });
        if (totalsOdds.under) outcomes.push({ name: `Under ${totalsOdds.hdp}`, price: parseFloat(totalsOdds.under) });

        if (outcomes.length > 0) {
          compatMarkets.push({ key: 'totals', outcomes });
        }
      }
      // Skip Spread for now — Asian Handicap is complex to display
    }

    if (compatMarkets.length > 0) {
      compatBookmakers.push({ key: bmName.toLowerCase(), markets: compatMarkets });
    }
  }

  if (compatBookmakers.length === 0) return null;

  return {
    home_team: event.home,
    away_team: event.away,
    bookmakers: compatBookmakers,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all currently live events. Cached 3 minutes. Costs 1 API call.
 * Falls back to 24h backup cache when quota is paused.
 */
export async function getLiveEvents(): Promise<OddsApiIoEvent[]> {
  const backupKey = `${PROVIDER}:backup:live-events`;

  // If quota paused, serve from backup instead of hitting getCachedOrFetch
  // (which would return [] and overwrite stale cache)
  if (await isQuotaPaused()) {
    try {
      const backup = await redis.get(backupKey);
      if (backup) {
        const parsed = JSON.parse(backup) as OddsApiIoEvent[];
        logger.debug(`${PROVIDER}: serving ${parsed.length} live events from backup (quota paused)`);
        return parsed;
      }
    } catch { /* fall through */ }
    // Also try the primary cache (may still be valid)
    try {
      const cached = await redis.get(`${PROVIDER}:live-events`);
      if (cached) {
        return JSON.parse(cached) as OddsApiIoEvent[];
      }
    } catch { /* fall through */ }
    return [];
  }

  const events = await getCachedOrFetch(
    `${PROVIDER}:live-events`,
    LIVE_EVENTS_TTL,
    async () => {
      const data = await fetchFromApi<OddsApiIoEvent[]>('/events/live');
      if (!data || !Array.isArray(data)) return [];
      logger.info(`${PROVIDER}: ${data.length} live events`);
      return data;
    },
  ) as OddsApiIoEvent[];

  // Store backup for quota-pause fallback
  if (events.length > 0) {
    try {
      await redis.setex(backupKey, BACKUP_TTL, JSON.stringify(events));
    } catch { /* non-fatal */ }
  }

  return events;
}

/**
 * Fetch odds for a batch of event IDs (up to 10). Cached 10 minutes.
 * Returns transformed results compatible with normalizeOddsMarkets().
 */
async function getOddsBatch(eventIds: number[]): Promise<NormalizedOddsResult[]> {
  const ids = eventIds.slice(0, MULTI_BATCH_SIZE);
  const cacheKey = `${PROVIDER}:odds-batch:${ids.sort().join(',')}`;

  return getCachedOrFetch(
    cacheKey,
    ODDS_BATCH_TTL,
    async () => {
      const data = await fetchFromApi<OddsApiIoOddsResponse[]>(
        '/odds/multi',
        { eventIds: ids.join(','), bookmakers: BOOKMAKERS },
      );

      if (!data || !Array.isArray(data)) return [];

      const results: NormalizedOddsResult[] = [];
      for (const event of data) {
        const transformed = transformToCompatibleFormat(event);
        if (transformed) results.push(transformed);
      }
      return results;
    },
  ) as Promise<NormalizedOddsResult[]>;
}

/**
 * Fetch odds for all live events of specified sports.
 * Batches into groups of 10 for efficient API usage.
 * Cached 10 minutes per batch.
 *
 * Budget: ~15 API calls per refresh (1 live-events + 14 odds batches)
 * With 10-min odds cache, ~6 live-event calls/hour + ~14 odds calls on first call = ~20 calls/hour
 */
export async function getAllLiveOdds(
  sportFilter?: Set<string>,
): Promise<NormalizedOddsResult[]> {
  const backupKey = `${PROVIDER}:backup:all-live-odds`;

  // If quota paused, serve from backup
  if (await isQuotaPaused()) {
    try {
      const backup = await redis.get(backupKey);
      if (backup) {
        const parsed = JSON.parse(backup) as NormalizedOddsResult[];
        logger.debug(`${PROVIDER}: serving ${parsed.length} from backup (quota paused)`);
        return parsed;
      }
    } catch { /* fall through */ }
    return [];
  }

  const events = await getLiveEvents();
  if (events.length === 0) return [];

  // Filter to requested sports
  let filtered = events;
  if (sportFilter && sportFilter.size > 0) {
    filtered = events.filter(e => sportFilter.has(e.sport.slug));
  }

  // Only fetch odds for events that are live or pending
  const relevant = filtered.filter(e => e.status === 'live' || e.status === 'pending');
  if (relevant.length === 0) return [];

  // Batch into groups of 10
  const batches: number[][] = [];
  for (let i = 0; i < relevant.length; i += MULTI_BATCH_SIZE) {
    batches.push(relevant.slice(i, i + MULTI_BATCH_SIZE).map(e => e.id));
  }

  // Fetch all batches in parallel
  const batchResults = await Promise.allSettled(
    batches.map(batch => getOddsBatch(batch)),
  );

  const allResults: NormalizedOddsResult[] = [];
  for (const result of batchResults) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allResults.push(...result.value);
    }
  }

  logger.info(`${PROVIDER}: ${allResults.length} events with odds (from ${relevant.length} live/pending, ${batches.length} batches)`);

  // Store backup for quota-pause fallback
  if (allResults.length > 0) {
    try {
      await redis.setex(backupKey, BACKUP_TTL, JSON.stringify(allResults));
    } catch { /* non-fatal */ }
  }

  return allResults;
}
