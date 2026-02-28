import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch, CACHE_TTL } from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// OddsPapi provider  (api.oddspapi.io)
// Primary odds source. Free forever tier.
// Auth via query parameter `apiKey`.
// ---------------------------------------------------------------------------

const PROVIDER = 'oddspapi';
const BASE_URL = 'https://api.oddspapi.io/v4';

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
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the list of available sports. Cache: 60 s (pre-match cadence).
 */
export async function getSports(): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:sports`,
    CACHE_TTL.PRE_MATCH_ODDS,
    async () => {
      const data = await fetchFromApi<unknown[]>('/sports');
      return data ?? [];
    },
  );
}

/**
 * Fetch pre-match odds for a given sport. Cache: 60 s.
 */
export async function getPreMatchOdds(sportId: string): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:prematch:${sportId}`,
    CACHE_TTL.PRE_MATCH_ODDS,
    async () => {
      const data = await fetchFromApi<unknown[]>(`/sports/${encodeURIComponent(sportId)}/odds`);
      return data ?? [];
    },
  );
}

/**
 * Fetch live in-play odds for a given sport. Cache: 15 s.
 */
export async function getLiveOdds(sportId: string): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:live:${sportId}`,
    CACHE_TTL.LIVE_ODDS,
    async () => {
      const data = await fetchFromApi<unknown[]>(`/sports/${encodeURIComponent(sportId)}/odds-live`);
      return data ?? [];
    },
  );
}

/**
 * Fetch odds for a single event. Cache: 15 s.
 */
export async function getEventOdds(eventId: string): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:event:${eventId}`,
    CACHE_TTL.LIVE_ODDS,
    async () => {
      const data = await fetchFromApi<unknown>(`/events/${encodeURIComponent(eventId)}/odds`);
      return data ?? null;
    },
  );
}
