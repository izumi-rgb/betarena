import axios from 'axios';
import logger from '../../../config/logger';
import {
  getCachedOrFetch,
  incrementDailyCounter,
  getDailyCount,
  CACHE_TTL,
} from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// API-Football provider  (v3.football.api-sports.io)
// Live football scores, fixtures, and standings.
// Daily limit: 100 requests. Warn at 80, soft-cap at 90 (serve cache only).
// ---------------------------------------------------------------------------

const PROVIDER = 'api-football';
const BASE_URL = 'https://v3.football.api-sports.io';
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

/**
 * Budget-guarded fetch: checks daily request count before making a live call.
 * Returns `null` if the soft cap has been reached (callers should fall back to cache).
 */
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
 * Fetch currently live fixtures. Cache: 60 s.
 */
export async function getLiveFixtures(): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:live-fixtures`,
    CACHE_TTL.PRE_MATCH_ODDS,
    async () => {
      const data = await guardedFetch<{ response: unknown[] }>('/fixtures', { live: 'all' });
      return data?.response ?? [];
    },
  );
}

/**
 * Fetch all fixtures scheduled for today. Cache: 30 min.
 */
export async function getTodayFixtures(): Promise<unknown> {
  const today = new Date().toISOString().slice(0, 10);
  return getCachedOrFetch(
    `${PROVIDER}:today-fixtures:${today}`,
    CACHE_TTL.FIXTURES,
    async () => {
      const data = await guardedFetch<{ response: unknown[] }>('/fixtures', { date: today });
      return data?.response ?? [];
    },
  );
}

/**
 * Fetch a single fixture by ID. Cache: 15 s (treated as live data).
 */
export async function getFixture(id: number | string): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:fixture:${id}`,
    CACHE_TTL.LIVE_SCORE,
    async () => {
      const data = await guardedFetch<{ response: unknown[] }>('/fixtures', { id: Number(id) });
      return data?.response?.[0] ?? null;
    },
  );
}

/**
 * Fetch league standings. Cache: 2 h.
 */
export async function getStandings(leagueId: number | string, season: number | string): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:standings:${leagueId}:${season}`,
    CACHE_TTL.STANDINGS,
    async () => {
      const data = await guardedFetch<{ response: unknown[] }>('/standings', {
        league: Number(leagueId),
        season: Number(season),
      });
      return data?.response?.[0] ?? null;
    },
  );
}
