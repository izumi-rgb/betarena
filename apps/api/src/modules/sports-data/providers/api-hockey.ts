import axios from 'axios';
import logger from '../../../config/logger';
import {
  getCachedOrFetch,
  incrementDailyCounter,
  getDailyCount,
  CACHE_TTL,
} from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// API-Hockey provider  (v1.hockey.api-sports.io)
// Live hockey scores, games, and standings.
// Same API key as API-Football (APISPORTS_KEY).
// Separate daily limit: 100 requests. Warn at 80, soft-cap at 90.
// ---------------------------------------------------------------------------

const PROVIDER = 'api-hockey';
const BASE_URL = 'https://v1.hockey.api-sports.io';
const DAILY_LIMIT = 100;
const WARN_THRESHOLD = 80;
const SOFT_CAP = 90;

function getApiKey(): string {
  const key = process.env.APISPORTS_KEY;
  if (!key) {
    logger.warn(`${PROVIDER}: APISPORTS_KEY is not set`);
    return '';
  }
  return key;
}

async function guardedFetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T | null> {
  const count = await getDailyCount(PROVIDER);

  if (count >= SOFT_CAP) {
    logger.info(`${PROVIDER}: soft cap reached (${count}/${DAILY_LIMIT}). Serving cache only.`);
    return null;
  }

  if (count >= WARN_THRESHOLD) {
    logger.warn(`${PROVIDER}: approaching daily limit (${count}/${DAILY_LIMIT})`);
  }

  const apiKey = getApiKey();
  if (!apiKey) return null;

  const response = await axios.get<T>(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': apiKey },
    params,
    timeout: 10_000,
  });

  await incrementDailyCounter(PROVIDER);

  return response.data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch today's hockey games (includes live, finished, and scheduled).
 * Cache: 5 min (conserves daily API budget).
 */
export async function getTodayGames(): Promise<unknown> {
  const today = new Date().toISOString().slice(0, 10);
  return getCachedOrFetch(
    `${PROVIDER}:games:${today}`,
    CACHE_TTL.TODAY_GAMES,
    async () => {
      const data = await guardedFetch<{ response: unknown[] }>('/games', { date: today });
      return data?.response ?? [];
    },
  );
}

/**
 * Fetch a single game by ID. Cache: 15 s.
 */
export async function getGame(id: number | string): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:game:${id}`,
    CACHE_TTL.LIVE_SCORE,
    async () => {
      const data = await guardedFetch<{ response: unknown[] }>('/games', { id: Number(id) });
      return data?.response?.[0] ?? null;
    },
  );
}
