import axios from 'axios';
import logger from '../../../config/logger';
import redis from '../../../config/redis';
import { getCachedOrFetch } from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// ODDS-API provider via RapidAPI  (odds-api1.p.rapidapi.com)
// Primary odds source. Auth via x-rapidapi-key / x-rapidapi-host headers.
//
// Endpoints:
//   GET /fixtures?sportId=X&from=DATE&to=DATE   → list fixtures (with scores, status)
//   GET /fixtures/odds?fixtureId=X&marketIds=101 → odds for one fixture
//   GET /markets?sportId=X                       → available markets for a sport
//   GET /sports                                  → list all sports
//
// Market IDs: 101 = 1X2 (Full Time Result), 104 = BTTS, 106 = O/U 0.5, etc.
// Outcome IDs for 1X2: 101 = Home (1), 102 = Draw (X), 103 = Away (2)
// ---------------------------------------------------------------------------

const PROVIDER = 'odds-api';
const BASE_URL = 'https://odds-api1.p.rapidapi.com';
const RAPIDAPI_HOST = 'odds-api1.p.rapidapi.com';

// Cache TTLs — extended to conserve quota
const FIXTURES_TTL = 10 * 60;      // 10 minutes for fixtures list
const ODDS_TTL = 30 * 60;          // 30 minutes for fixture odds
const SPORT_ODDS_TTL = 60 * 60;    // 60 minutes for aggregated sport odds
const BACKUP_TTL = 24 * 60 * 60;   // 24 hours for backup cache

// Quota exhaustion tracking
const QUOTA_EXHAUSTED_KEY = 'odds-api:quota-exhausted';
const QUOTA_EXHAUSTED_TTL = 60 * 60; // 1 hour cooldown

// Sport IDs
const SPORT_IDS = {
  soccer: 10,
  basketball: 11,
  tennis: 12,
  baseball: 13,
  'ice-hockey': 15,
  cricket: 27,
} as const;

export type OddsPapiSport = keyof typeof SPORT_IDS;

// Market 101 = 1X2 (Full Time Result) — the primary market for match result
const PRIMARY_MARKET_ID = 101;

// Outcome IDs for market 101
const OUTCOME_NAMES: Record<number, string> = {
  101: '1',   // Home
  102: 'X',   // Draw
  103: '2',   // Away
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FixtureStatus {
  live: boolean;
  statusId: number;
  statusName: string;
}

interface FixtureParticipants {
  participant1Id: number;
  participant1Name: string;
  participant2Id: number;
  participant2Name: string;
}

interface FixtureScore {
  period: string;
  participant1Score: number;
  participant2Score: number;
}

export interface OddsApiFixture {
  fixtureId: string;
  status: FixtureStatus;
  sport: { sportId: number; sportName: string };
  tournament: { tournamentId: number; tournamentName: string; categoryName: string };
  startTime: number;       // Unix timestamp
  participants: FixtureParticipants;
  scores: Record<string, FixtureScore>;
}

interface OddsEntry {
  bookmaker: string;
  outcomeId: number;
  active: boolean;
  price: number;
  marketId: number;
}

interface FixtureOddsResponse extends OddsApiFixture {
  odds: Record<string, Record<string, OddsEntry>>;
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

function getRapidApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    logger.warn(`${PROVIDER}: RAPIDAPI_KEY is not set`);
    return '';
  }
  return key;
}

async function isQuotaExhausted(): Promise<boolean> {
  try {
    const flag = await redis.get(QUOTA_EXHAUSTED_KEY);
    return flag === '1';
  } catch { return false; }
}

async function markQuotaExhausted(): Promise<void> {
  try {
    await redis.setex(QUOTA_EXHAUSTED_KEY, QUOTA_EXHAUSTED_TTL, '1');
    logger.warn(`${PROVIDER}: quota exhausted — skipping odds calls for ${QUOTA_EXHAUSTED_TTL / 60}min`);
  } catch { /* non-fatal */ }
}

async function fetchFromApi<T>(endpoint: string, params?: Record<string, string | number>): Promise<T | null> {
  const apiKey = getRapidApiKey();
  if (!apiKey) return null;

  // Skip if quota is exhausted
  if (await isQuotaExhausted()) return null;

  try {
    const response = await axios.get<T>(`${BASE_URL}${endpoint}`, {
      params,
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
      },
      timeout: 15_000,
    });

    return response.data;
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status;
    const message = (err as Error).message || '';

    // Detect quota exhaustion (429 or message about quota/exceeded)
    if (status === 429 || message.toLowerCase().includes('exceeded') || message.toLowerCase().includes('quota')) {
      await markQuotaExhausted();
    }

    throw err;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function todayTomorrowRange(): { from: string; to: string } {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    from: today.toISOString().slice(0, 10),
    to: tomorrow.toISOString().slice(0, 10),
  };
}

/**
 * Extract best odds from the V5 odds structure for market 101 (1X2).
 * The odds object is keyed by bookmaker slug, each containing entries keyed
 * by a composite ID with outcomeId, price, marketId, active.
 *
 * We collect all active prices per outcome across bookmakers and average them.
 */
function extract1X2Odds(
  fixture: OddsApiFixture,
  oddsData: Record<string, Record<string, OddsEntry>>,
): Record<string, unknown> | null {
  // Collect prices per outcomeId for market 101
  const pricesByOutcome = new Map<number, number[]>();

  for (const entries of Object.values(oddsData)) {
    for (const entry of Object.values(entries)) {
      if (entry.marketId !== PRIMARY_MARKET_ID) continue;
      if (!entry.active || entry.price <= 0) continue;

      if (!pricesByOutcome.has(entry.outcomeId)) {
        pricesByOutcome.set(entry.outcomeId, []);
      }
      pricesByOutcome.get(entry.outcomeId)!.push(entry.price);
    }
  }

  if (pricesByOutcome.size === 0) return null;

  // Build outcomes array in the format normalizeOddsMarkets expects
  const outcomes: { name: string; price: number }[] = [];

  for (const [outcomeId, prices] of pricesByOutcome) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const rounded = Math.round(avg * 100) / 100;

    // For h2h market, use team names as outcome names
    let name: string;
    if (outcomeId === 101) name = fixture.participants.participant1Name;
    else if (outcomeId === 103) name = fixture.participants.participant2Name;
    else if (outcomeId === 102) name = 'Draw';
    else name = OUTCOME_NAMES[outcomeId] || `Outcome ${outcomeId}`;

    outcomes.push({ name, price: rounded });
  }

  if (outcomes.length === 0) return null;

  // Return in The Odds API compatible format for normalizeOddsMarkets
  return {
    home_team: fixture.participants.participant1Name,
    away_team: fixture.participants.participant2Name,
    bookmakers: [{
      key: 'odds-api-avg',
      markets: [{ key: 'h2h', outcomes }],
    }],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch today+tomorrow fixtures for a sport. Cached 5 min.
 */
export async function getFixtures(sport: OddsPapiSport): Promise<OddsApiFixture[]> {
  const sportId = SPORT_IDS[sport];
  if (!sportId) return [];

  return getCachedOrFetch(
    `${PROVIDER}:fixtures:${sport}`,
    FIXTURES_TTL,
    async () => {
      const { from, to } = todayTomorrowRange();
      const data = await fetchFromApi<OddsApiFixture[]>('/fixtures', { sportId, from, to });
      return data ?? [];
    },
  ) as Promise<OddsApiFixture[]>;
}

/**
 * Fetch odds for a single fixture (market 101 = 1X2). Cached 3 min.
 */
export async function getFixtureOdds(fixtureId: string): Promise<FixtureOddsResponse | null> {
  return getCachedOrFetch(
    `${PROVIDER}:odds:${fixtureId}`,
    ODDS_TTL,
    async () => {
      const data = await fetchFromApi<FixtureOddsResponse>(
        '/fixtures/odds',
        { fixtureId, marketIds: String(PRIMARY_MARKET_ID) },
      );
      return data ?? null;
    },
  ) as Promise<FixtureOddsResponse | null>;
}

/**
 * Get odds for a sport in The Odds API compatible format.
 * Fetches fixtures → filters live+upcoming with bookmakers → fetches odds → transforms.
 * Cached 5 minutes per sport.
 */
export async function getOddsForSport(sport: OddsPapiSport): Promise<Record<string, unknown>[]> {
  const cacheKey = `${PROVIDER}:sport-odds:${sport}`;
  const backupKey = `${PROVIDER}:backup:sport-odds:${sport}`;

  // If quota exhausted, try backup cache directly
  if (await isQuotaExhausted()) {
    try {
      const backup = await redis.get(backupKey);
      if (backup) {
        const parsed = JSON.parse(backup) as Record<string, unknown>[];
        logger.debug(`${PROVIDER}: ${sport} → serving ${parsed.length} from backup cache (quota exhausted)`);
        return parsed;
      }
    } catch { /* fall through */ }
    return [];
  }

  return getCachedOrFetch(
    cacheKey,
    SPORT_ODDS_TTL,
    async () => {
      const fixtures = await getFixtures(sport);

      // Only get odds for live + upcoming fixtures (statusId 1 = live/upcoming)
      const relevant = fixtures.filter(f =>
        f.status.live || f.status.statusId === 1
      );

      if (relevant.length === 0) {
        logger.debug(`${PROVIDER}: ${sport} → 0 live/upcoming fixtures`);
        return [];
      }

      // Fetch odds for up to 20 fixtures in parallel
      const batch = relevant.slice(0, 20);
      const oddsResults = await Promise.allSettled(
        batch.map(f => getFixtureOdds(f.fixtureId)),
      );

      const results: Record<string, unknown>[] = [];

      for (let i = 0; i < batch.length; i++) {
        const result = oddsResults[i];
        if (result.status !== 'fulfilled' || !result.value) continue;

        const oddsResponse = result.value;
        if (!oddsResponse.odds || typeof oddsResponse.odds !== 'object') continue;

        const transformed = extract1X2Odds(batch[i], oddsResponse.odds);
        if (transformed) results.push(transformed);
      }

      logger.info(`${PROVIDER}: ${sport} → ${results.length} events with odds (from ${relevant.length} live/upcoming)`);

      // Store backup copy with long TTL for quota-exhaustion fallback
      if (results.length > 0) {
        try {
          await redis.setex(backupKey, BACKUP_TTL, JSON.stringify(results));
        } catch { /* non-fatal */ }
      }

      return results;
    },
  ) as Promise<Record<string, unknown>[]>;
}

/**
 * Get live + upcoming fixtures for a sport with their status info.
 * Used by the aggregate cache to merge with other provider data.
 */
export async function getLiveAndUpcomingFixtures(sport: OddsPapiSport): Promise<OddsApiFixture[]> {
  const fixtures = await getFixtures(sport);
  return fixtures.filter(f => f.status.live || f.status.statusId === 1);
}
