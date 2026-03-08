import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch, CACHE_TTL } from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// The Odds API provider  (api.the-odds-api.com)
// Backup odds source. 500 credits/month.
// Auth via query parameter `apiKey`.
// Tracks remaining credits from the `x-requests-remaining` response header.
// Every call is logged with remaining credits.
// ---------------------------------------------------------------------------

const PROVIDER = 'the-odds-api';
const BASE_URL = 'https://api.the-odds-api.com/v4';

/** In-memory credit tracker, updated after every API call. */
let remainingCredits: number | null = null;

function getApiKey(): string {
  const key = process.env.ODDS_API_KEY;
  if (!key) {
    logger.debug(`${PROVIDER}: ODDS_API_KEY is not set`);
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

  // Track credits from response header
  const creditsHeader = response.headers['x-requests-remaining'];
  if (creditsHeader != null) {
    remainingCredits = parseInt(String(creditsHeader), 10);
  }

  logger.info(`${PROVIDER}: API call to ${endpoint}`, {
    remainingCredits,
    status: response.status,
  });

  return response.data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the last known remaining API credits (from the most recent response header).
 * Returns `null` if no calls have been made yet this session.
 */
export function getRemainingCredits(): number | null {
  return remainingCredits;
}

/**
 * Fetch odds for a specific sport. Cache: 15 s (live) / 60 s (pre-match).
 * Uses the same TTLs as the primary oddspapi provider.
 */
export async function getOddsForSport(sport: string): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:odds:${sport}`,
    CACHE_TTL.LIVE_ODDS,
    async () => {
      const data = await fetchFromApi<unknown[]>(`/sports/${encodeURIComponent(sport)}/odds`, {
        regions: 'us,uk,eu',
        markets: 'h2h,spreads,totals',
      });
      return data ?? [];
    },
  );
}

/**
 * Fetch upcoming odds across ALL sports in a single call.
 * h2h only to minimise credit burn.  Cached for 30 min.
 */
export async function getUpcomingOdds(): Promise<unknown[]> {
  return getCachedOrFetch(
    `${PROVIDER}:upcoming-odds`,
    30 * 60,
    async () => {
      const data = await fetchFromApi<unknown[]>('/sports/upcoming/odds', {
        regions: 'eu,uk,us',
        markets: 'h2h',
      });
      return data ?? [];
    },
  ) as Promise<unknown[]>;
}
