import redis from '../config/redis';
import logger from '../config/logger';

export async function withRedisLock<T>(
  key: string,
  ttlSeconds: number,
  task: () => Promise<T>,
): Promise<T | null> {
  const lockValue = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const acquired = await redis.set(key, lockValue, 'EX', ttlSeconds, 'NX');

  if (acquired !== 'OK') {
    return null;
  }

  try {
    return await task();
  } finally {
    try {
      const currentValue = await redis.get(key);
      if (currentValue === lockValue) {
        await redis.del(key);
      }
    } catch (error) {
      logger.warn('Failed to release Redis lock', {
        key,
        error: (error as Error).message,
      });
    }
  }
}
