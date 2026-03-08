import redis from '../../../config/redis';
import logger from '../../../config/logger';

export const CACHE_TTL = {
  LIVE_SCORE: 15,
  LIVE_ODDS: 15,
  LIVE_CRICKET: 30,
  PRE_MATCH_ODDS: 60,
  TODAY_GAMES: 5 * 60,
  FIXTURES: 30 * 60,
  COMPETITION: 2 * 60 * 60,
  STANDINGS: 2 * 60 * 60,
  TEAM: 24 * 60 * 60,
  PLAYER: 24 * 60 * 60,
  RESULTS: 7 * 24 * 60 * 60,
} as const;

export async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  let cached: string | null = null;
  try {
    cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn('Redis cache read error', { key, error: (err as Error).message });
  }

  const fresh = await fetchFn();

  // Don't overwrite good cached data with empty results (e.g. when API budget exhausted)
  const isEmpty = fresh == null || (Array.isArray(fresh) && fresh.length === 0);
  if (isEmpty && cached) {
    logger.info('Returning stale cache instead of empty result', { key });
    return JSON.parse(cached);
  }

  try {
    if (!isEmpty) {
      await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
    }
  } catch (err) {
    logger.warn('Redis cache write error', { key, error: (err as Error).message });
  }

  return fresh;
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    logger.warn('Redis cache invalidation error', { pattern, error: (err as Error).message });
  }
}

export async function incrementDailyCounter(provider: string): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  const key = `${provider}:daily_count:${date}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expireat(key, Math.floor(Date.now() / 1000) + 86400);
  }
  return count;
}

export async function getDailyCount(provider: string): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  const key = `${provider}:daily_count:${date}`;
  const val = await redis.get(key);
  return val ? parseInt(val, 10) : 0;
}
