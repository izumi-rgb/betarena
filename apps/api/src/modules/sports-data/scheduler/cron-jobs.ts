import cron from 'node-cron';
import redis from '../../../config/redis';
import logger from '../../../config/logger';
import { getIO } from '../../../socket';
import { getDailyCount } from '../cache/redis-strategy';
import * as apiFootball from '../providers/api-football';
import * as espn from '../providers/espn-hidden';
import * as oddspapi from '../providers/oddspapi';
import { normalizeApiFootball, normalizeESPN, normalizeOddsMarkets } from '../normalizer/normalizer';

// ---------------------------------------------------------------------------
// Watcher helpers
// ---------------------------------------------------------------------------

/**
 * Returns IDs of events that currently have at least one connected watcher.
 * Redis keys follow the pattern `watchers:<eventId>`.
 */
async function getWatchedEventIds(): Promise<string[]> {
  const keys = await redis.keys('watchers:*');
  const watched: string[] = [];
  for (const key of keys) {
    const count = await redis.get(key);
    if (count && parseInt(count, 10) > 0) {
      watched.push(key.replace('watchers:', ''));
    }
  }
  return watched;
}

// ---------------------------------------------------------------------------
// Refresh tasks
// ---------------------------------------------------------------------------

/**
 * Fetches live scores from API-Football + ESPN and pushes updates to
 * Socket.IO rooms for watched events only.
 */
async function refreshLiveScores(): Promise<void> {
  const watched = await getWatchedEventIds();
  if (watched.length === 0) return;

  // API-Football — only call when under the daily soft-cap
  const footballCount = await getDailyCount('api-football');
  if (footballCount < 90) {
    try {
      const fixtures = await apiFootball.getLiveFixtures();
      const io = getIO();
      for (const raw of fixtures as unknown[]) {
        const event = normalizeApiFootball(raw);
        if (event && watched.includes(event.id)) {
          io.to(`event:${event.id}`).emit('live:update', event);
        }
      }
    } catch (err) {
      logger.error('Live scores refresh failed', { error: (err as Error).message });
    }
  }

  // ESPN — free, no budget guard needed
  try {
    const espnData = await espn.getAllUSScoreboards();
    const io = getIO();
    for (const [sport, data] of Object.entries(espnData)) {
      if (!data || typeof data !== 'object') continue;
      const events = (data as Record<string, unknown>).events as unknown[] | undefined;
      if (!Array.isArray(events)) continue;
      for (const raw of events) {
        const event = normalizeESPN(raw, sport);
        if (event && watched.includes(event.id)) {
          io.to(`event:${event.id}`).emit('live:update', event);
        }
      }
    }
  } catch (err) {
    logger.error('ESPN refresh failed', { error: (err as Error).message });
  }
}

/**
 * Fetches live odds for each watched event and pushes updates.
 */
async function refreshLiveOdds(): Promise<void> {
  const watched = await getWatchedEventIds();
  if (watched.length === 0) return;

  try {
    for (const eventId of watched) {
      const raw = await oddspapi.getEventOdds(eventId);
      if (!raw) continue;
      const markets = normalizeOddsMarkets(raw, 'oddspapi');
      if (markets.length > 0) {
        getIO().to(`event:${eventId}`).emit('odds:update', { eventId, markets });
      }
    }
  } catch (err) {
    logger.error('Live odds refresh failed', { error: (err as Error).message });
  }
}

/**
 * Refreshes pre-match odds for the first 5 available sports.
 */
async function refreshPreMatchOdds(): Promise<void> {
  try {
    const sports = await oddspapi.getSports();
    if (Array.isArray(sports)) {
      for (const sport of sports.slice(0, 5)) {
        const s = sport as Record<string, unknown>;
        if (s.key) {
          await oddspapi.getPreMatchOdds(String(s.key));
        }
      }
    }
  } catch (err) {
    logger.error('Pre-match odds refresh failed', { error: (err as Error).message });
  }
}

/**
 * Refreshes today's football fixtures into cache.
 */
async function refreshFixtures(): Promise<void> {
  try {
    await apiFootball.getTodayFixtures();
  } catch (err) {
    logger.error('Fixtures refresh failed', { error: (err as Error).message });
  }
}

/**
 * Cleans up stale daily API counter keys from the previous day.
 */
async function resetDailyCounters(): Promise<void> {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const keys = await redis.keys(`*:daily_count:${yesterday}`);
  if (keys.length > 0) {
    await redis.del(...keys);
    logger.info('Daily API counters reset', { cleared: keys.length });
  }
}

// ---------------------------------------------------------------------------
// Public — start all cron schedules
// ---------------------------------------------------------------------------

export function startScheduler(): void {
  // Every 15 seconds: live scores + live odds (only for watched events)
  cron.schedule('*/15 * * * * *', () => {
    refreshLiveScores().catch((e) => logger.error('Cron: live scores error', { error: (e as Error).message }));
    refreshLiveOdds().catch((e) => logger.error('Cron: live odds error', { error: (e as Error).message }));
  });

  // Every 5 minutes: pre-match odds
  cron.schedule('*/5 * * * *', () => {
    refreshPreMatchOdds().catch((e) => logger.error('Cron: pre-match error', { error: (e as Error).message }));
  });

  // Every 30 minutes: fixtures
  cron.schedule('*/30 * * * *', () => {
    refreshFixtures().catch((e) => logger.error('Cron: fixtures error', { error: (e as Error).message }));
  });

  // Daily midnight: reset stale counters
  cron.schedule('0 0 * * *', () => {
    resetDailyCounters().catch((e) => logger.error('Cron: counter reset error', { error: (e as Error).message }));
  });

  logger.info('Sports data scheduler started');
}
