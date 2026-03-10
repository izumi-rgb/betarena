import axios from 'axios';
import logger from '../../../config/logger';
import {
  getCachedOrFetch,
  incrementDailyCounter,
  getDailyCount,
  CACHE_TTL,
} from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// Factory for API-Sports providers (basketball, hockey, baseball, etc.)
// All API-Sports providers share the same APISPORTS_KEY and identical
// request/cache/quota logic — only the base URL and sport name differ.
// ---------------------------------------------------------------------------

export interface ApiSportsConfig {
  /** Human-readable sport name used in logs (e.g. "api-basketball") */
  sport: string;
  /** Base URL for the sport API (e.g. "https://v1.basketball.api-sports.io") */
  baseUrl: string;
  /** Redis daily-counter key — defaults to `sport` */
  counterKey?: string;
  /** Absolute daily request limit */
  dailyLimit?: number;
  /** Log a warning when counter reaches this value */
  warnThreshold?: number;
  /** Stop making API calls when counter reaches this value */
  softCap?: number;
  /** API endpoint paths */
  endpoints: {
    /** Endpoint for today's games (e.g. "/games") */
    games: string;
  };
}

export interface ApiSportsProvider {
  getTodayGames(): Promise<unknown>;
  getGame(id: number | string): Promise<unknown>;
}

export function createApiSportsProvider(config: ApiSportsConfig): ApiSportsProvider {
  const {
    sport,
    baseUrl,
    counterKey = sport,
    dailyLimit = 100,
    warnThreshold = 80,
    softCap = 90,
    endpoints,
  } = config;

  function getApiKey(): string {
    const key = process.env.APISPORTS_KEY;
    if (!key) {
      logger.warn(`${sport}: APISPORTS_KEY is not set`);
      return '';
    }
    return key;
  }

  async function guardedFetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T | null> {
    const count = await getDailyCount(counterKey);

    if (count >= softCap) {
      logger.info(`${sport}: soft cap reached (${count}/${dailyLimit}). Serving cache only.`);
      return null;
    }

    if (count >= warnThreshold) {
      logger.warn(`${sport}: approaching daily limit (${count}/${dailyLimit})`);
    }

    const apiKey = getApiKey();
    if (!apiKey) return null;

    const response = await axios.get<T>(`${baseUrl}${endpoint}`, {
      headers: { 'x-apisports-key': apiKey },
      params,
      timeout: 10_000,
    });

    await incrementDailyCounter(counterKey);

    return response.data;
  }

  async function getTodayGames(): Promise<unknown> {
    const today = new Date().toISOString().slice(0, 10);
    return getCachedOrFetch(
      `${sport}:games:${today}`,
      CACHE_TTL.TODAY_GAMES,
      async () => {
        const data = await guardedFetch<{ response: unknown[] }>(endpoints.games, { date: today });
        return data?.response ?? [];
      },
    );
  }

  async function getGame(id: number | string): Promise<unknown> {
    return getCachedOrFetch(
      `${sport}:game:${id}`,
      CACHE_TTL.LIVE_SCORE,
      async () => {
        const data = await guardedFetch<{ response: unknown[] }>(endpoints.games, { id: Number(id) });
        return data?.response?.[0] ?? null;
      },
    );
  }

  return { getTodayGames, getGame };
}
