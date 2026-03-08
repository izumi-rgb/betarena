import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch } from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// OddsPapi provider  (api.oddspapi.io)
// Secondary odds source. Free tier: 200 requests/month.
// Auth via query parameter `apiKey`.
//
// API is fixture-based:
//   /v4/fixtures?sportId=X&from=DATE&to=DATE  → list fixtures
//   /v4/odds?fixtureId=FIXTURE_ID             → odds for one fixture
//
// Market IDs: 101 = 1X2 (Home/Draw/Away), 104 = Over/Under, 108 = BTTS
// ---------------------------------------------------------------------------

const PROVIDER = 'oddspapi';
const BASE_URL = 'https://api.oddspapi.io/v4';

// Cache for 6 hours — very aggressive to stay within 200 req/month
const FIXTURES_TTL = 6 * 60 * 60;
const ODDS_TTL = 60 * 60; // 1 hour for individual fixture odds

// Sport IDs in OddsPapi
const SPORT_IDS = {
  soccer: 10,
  basketball: 11,
  tennis: 12,
  baseball: 13,
  'ice-hockey': 15,
  cricket: 27,
} as const;

// OddsPapi market ID → human-readable key mapping
const MARKET_MAP: Record<string, { key: string; outcomes: Record<string, string> }> = {
  '101': { key: 'h2h', outcomes: { '101': 'Home', '102': 'Draw', '103': 'Away' } },
  '104': { key: 'totals', outcomes: { '104': 'Over', '105': 'Under' } },
};

export type OddsPapiSport = keyof typeof SPORT_IDS;

interface OddsPapiFixture {
  fixtureId: string;
  participant1Name: string;
  participant2Name: string;
  sportId: number;
  hasOdds: boolean;
  statusId: number;
  startTime: string;
  tournamentName?: string;
  categoryName?: string;
}

function getApiKey(): string {
  const key = process.env.ODDSPAPI_KEY;
  if (!key) {
    logger.warn(`${PROVIDER}: ODDSPAPI_KEY is not set`);
    return '';
  }
  return key;
}

async function fetchFromApi<T>(endpoint: string, params?: Record<string, string | number>): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const response = await axios.get<T>(`${BASE_URL}${endpoint}`, {
    params: { apiKey, ...params },
    timeout: 10_000,
  });

  return response.data;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function todayRange(): { from: string; to: string } {
  const d = new Date().toISOString().slice(0, 10);
  return { from: d, to: d };
}

/**
 * Convert OddsPapi's nested bookmakerOdds → The Odds API compatible format
 * so our normalizeOddsMarkets() can consume it unchanged.
 */
function transformOddsToStandard(
  fixture: OddsPapiFixture,
  oddsData: Record<string, unknown>,
): Record<string, unknown> | null {
  const bookmakerOdds = oddsData.bookmakerOdds as Record<string, unknown> | undefined;
  if (!bookmakerOdds || typeof bookmakerOdds !== 'object') return null;

  // Convert to The Odds API format: { home_team, away_team, bookmakers: [...] }
  const bookmakers: unknown[] = [];

  for (const [bmSlug, bmData] of Object.entries(bookmakerOdds)) {
    const bm = bmData as Record<string, unknown>;
    const bmMarkets = bm.markets as Record<string, unknown> | undefined;
    if (!bmMarkets || typeof bmMarkets !== 'object') continue;

    const markets: unknown[] = [];

    for (const [marketId, marketData] of Object.entries(bmMarkets)) {
      const mapping = MARKET_MAP[marketId];
      if (!mapping) continue; // skip unknown market types

      const mkt = marketData as Record<string, unknown>;
      const outcomeEntries = mkt.outcomes as Record<string, unknown> | undefined;
      if (!outcomeEntries) continue;

      const outcomes: unknown[] = [];
      for (const [outcomeId, outcomeData] of Object.entries(outcomeEntries)) {
        const od = outcomeData as Record<string, unknown>;
        const players = od.players as Record<string, unknown> | undefined;
        const player0 = players?.['0'] as Record<string, unknown> | undefined;
        if (!player0 || !player0.active) continue;

        const price = Number(player0.price);
        if (!price || price <= 0) continue;

        // Map outcome ID to name; fall back to fixture participant names for h2h
        let name = mapping.outcomes[outcomeId] || `Outcome ${outcomeId}`;
        if (mapping.key === 'h2h') {
          if (name === 'Home') name = fixture.participant1Name;
          else if (name === 'Away') name = fixture.participant2Name;
        }

        outcomes.push({ name, price });
      }

      if (outcomes.length > 0) {
        markets.push({ key: mapping.key, outcomes });
      }
    }

    if (markets.length > 0) {
      bookmakers.push({ key: bmSlug, markets });
    }
  }

  if (bookmakers.length === 0) return null;

  return {
    home_team: fixture.participant1Name,
    away_team: fixture.participant2Name,
    bookmakers,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch today's fixtures for a sport. Cache: 6 hours.
 */
export async function getFixtures(sport: OddsPapiSport): Promise<OddsPapiFixture[]> {
  const sportId = SPORT_IDS[sport];
  if (!sportId) return [];

  return getCachedOrFetch(
    `${PROVIDER}:fixtures:${sport}`,
    FIXTURES_TTL,
    async () => {
      const { from, to } = todayRange();
      const data = await fetchFromApi<OddsPapiFixture[]>('/fixtures', { sportId, from, to });
      return data ?? [];
    },
  ) as Promise<OddsPapiFixture[]>;
}

/**
 * Fetch odds for a single fixture. Cache: 1 hour.
 */
export async function getFixtureOdds(fixtureId: string): Promise<Record<string, unknown> | null> {
  return getCachedOrFetch(
    `${PROVIDER}:odds:${fixtureId}`,
    ODDS_TTL,
    async () => {
      const data = await fetchFromApi<Record<string, unknown>>('/odds', { fixtureId });
      return data ?? null;
    },
  ) as Promise<Record<string, unknown> | null>;
}

/**
 * Get odds for a sport in The Odds API compatible format.
 * Fetches today's fixtures → filters hasOdds → fetches odds → transforms.
 * Heavily cached to stay within 200 req/month limit.
 */
export async function getOddsForSport(sport: OddsPapiSport): Promise<Record<string, unknown>[]> {
  return getCachedOrFetch(
    `${PROVIDER}:sport-odds:${sport}`,
    FIXTURES_TTL, // cache as long as fixtures (6h)
    async () => {
      const fixtures = await getFixtures(sport);
      const withOdds = fixtures.filter(f => f.hasOdds);

      if (withOdds.length === 0) return [];

      // Fetch odds for each fixture (max 10 to conserve API calls)
      const results: Record<string, unknown>[] = [];
      const batch = withOdds.slice(0, 10);

      const oddsResults = await Promise.allSettled(
        batch.map(f => getFixtureOdds(f.fixtureId)),
      );

      for (let i = 0; i < batch.length; i++) {
        const result = oddsResults[i];
        if (result.status !== 'fulfilled' || !result.value) continue;

        const transformed = transformOddsToStandard(batch[i], result.value);
        if (transformed) results.push(transformed);
      }

      logger.info(`${PROVIDER}: ${sport} → ${results.length} events with odds (from ${fixtures.length} fixtures)`);
      return results;
    },
  ) as Promise<Record<string, unknown>[]>;
}
