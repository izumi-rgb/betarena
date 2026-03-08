import axios from 'axios';
import logger from '../../../config/logger';
import {
  getCachedOrFetch,
  incrementDailyCounter,
  getDailyCount,
  CACHE_TTL,
} from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// CricketData.org provider
// Live cricket scores, match info, series listings.
// Daily limit: 100 requests. Soft-cap at 90 (serve cache only).
// ---------------------------------------------------------------------------

const PROVIDER = 'cricketdata';
const BASE_URL = 'https://api.cricapi.com/v1';
const DAILY_LIMIT = 100;
const SOFT_CAP = 90;

function getApiKey(): string {
  const key = process.env.CRICKET_API_KEY;
  if (!key) {
    logger.warn(`${PROVIDER}: CRICKET_API_KEY is not set`);
    return '';
  }
  return key;
}

/**
 * Budget-guarded fetch: checks daily request count before making a live call.
 * Returns `null` if the soft cap has been reached.
 */
async function guardedFetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T | null> {
  const count = await getDailyCount(PROVIDER);

  if (count >= SOFT_CAP) {
    logger.info(`${PROVIDER}: soft cap reached (${count}/${DAILY_LIMIT}). Serving cache only.`);
    return null;
  }

  const apiKey = getApiKey();
  if (!apiKey) return null;

  const response = await axios.get<T>(`${BASE_URL}${endpoint}`, {
    params: { apikey: apiKey, ...params },
    timeout: 10_000,
  });

  await incrementDailyCounter(PROVIDER);

  return response.data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all currently live / recent matches. Cache: 5 min (conserves daily API budget).
 */
export async function getCurrentMatches(): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:current-matches`,
    CACHE_TTL.TODAY_GAMES,
    async () => {
      const data = await guardedFetch<{ data: unknown[] }>('/currentMatches');
      const matches = data?.data ?? [];
      // Filter out matches the API flags as ended (belt-and-suspenders with normalizer)
      return matches.filter((m: unknown) => {
        if (m && typeof m === 'object' && (m as Record<string, unknown>).matchEnded) return false;
        return true;
      });
    },
  );
}

/**
 * Fetch detailed info for a single match. Cache: 30 s.
 */
export async function getMatchInfo(matchId: string): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:match:${matchId}`,
    CACHE_TTL.LIVE_CRICKET,
    async () => {
      const data = await guardedFetch<{ data: unknown }>(`/match_info`, { id: matchId });
      return data?.data ?? null;
    },
  );
}

/**
 * Fetch available cricket series. Cache: 2 h.
 */
export async function getSeries(): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:series`,
    CACHE_TTL.COMPETITION,
    async () => {
      const data = await guardedFetch<{ data: unknown[] }>('/series');
      return data?.data ?? [];
    },
  );
}
