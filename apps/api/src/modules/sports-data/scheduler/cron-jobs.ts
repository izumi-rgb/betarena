import cron from 'node-cron';
import redis from '../../../config/redis';
import logger from '../../../config/logger';
import { getIO } from '../../../socket';
import { getDailyCount } from '../cache/redis-strategy';
import * as apiFootball from '../providers/api-football';
import * as espn from '../providers/espn-hidden';
import * as cricketData from '../providers/cricket-data';
import * as oddspapi from '../providers/oddspapi';
import * as fotmobLive from '../providers/fotmob-live';
import { normalizeApiFootball, normalizeESPN, normalizeCricket, normalizeFotmob, normalizeOddsMarkets } from '../normalizer/normalizer';

// ---------------------------------------------------------------------------
// Watcher helpers
// ---------------------------------------------------------------------------

/**
 * Returns IDs of events that currently have at least one connected watcher.
 * Redis keys follow the pattern `watchers:<eventId>`.
 */
async function getWatchedEventIds(): Promise<string[]> {
  const watched: string[] = [];
  let cursor = '0';

  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'watchers:*', 'COUNT', 100);
    cursor = nextCursor;
    for (const key of keys) {
      const count = await redis.get(key);
      if (count && parseInt(count, 10) > 0) {
        watched.push(key.replace('watchers:', ''));
      }
    }
  } while (cursor !== '0');

  return watched;
}

/**
 * SCAN-based alternative to redis.keys() — avoids blocking the Redis event loop.
 */
async function scanKeys(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== '0');
  return keys;
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

  // Cricket — budget-guarded (100 req/day soft-cap at 90)
  try {
    const cricketMatches = await cricketData.getCurrentMatches();
    const io = getIO();
    if (Array.isArray(cricketMatches)) {
      for (const raw of cricketMatches) {
        const event = normalizeCricket(raw);
        if (event && watched.includes(event.id)) {
          io.to(`event:${event.id}`).emit('live:update', event);
        }
      }
    }
  } catch (err) {
    logger.error('Cricket live scores refresh failed', { error: (err as Error).message });
  }

  // FotMob — free, no budget guard needed (scores-only, complements API-Football)
  try {
    const fotmobMatches = await fotmobLive.getLiveMatches();
    const io = getIO();
    for (const raw of fotmobMatches) {
      const event = normalizeFotmob(raw);
      if (event && watched.includes(event.id)) {
        io.to(`event:${event.id}`).emit('live:update', event);
      }
    }
  } catch (err) {
    logger.error('FotMob live scores refresh failed', { error: (err as Error).message });
  }
}

/**
 * Fetches live odds for each watched event and pushes updates.
 * Uses The Odds API since OddsPapi doesn't support lookup by our event IDs.
 */
async function refreshLiveOdds(): Promise<void> {
  const watched = await getWatchedEventIds();
  if (watched.length === 0) return;

  try {
    // Use sports-data service which handles odds lookup internally
    const { getMarkets } = await import('../sports-data.service');
    for (const eventId of watched) {
      const markets = await getMarkets(eventId);
      if (markets.length > 0) {
        getIO().to(`event:${eventId}`).emit('odds:update', { eventId, markets });
      }
    }
  } catch (err) {
    logger.error('Live odds refresh failed', { error: (err as Error).message });
  }
}

/**
 * Refreshes pre-match odds by warming the OddsPapi cache for top sports.
 */
async function refreshPreMatchOdds(): Promise<void> {
  try {
    const sports: import('../providers/oddspapi').OddsPapiSport[] = ['soccer', 'basketball', 'baseball'];
    for (const sport of sports) {
      await oddspapi.getOddsForSport(sport);
    }
  } catch (err) {
    logger.error('Pre-match odds refresh failed', { error: (err as Error).message });
  }
}

/**
 * Refreshes today's fixtures from all available sports providers into cache:
 *  - API-Football (football)
 *  - ESPN scoreboards (NBA, NFL, NHL, MLB, EPL, UCL)
 *  - CricketData (current cricket matches)
 */
async function refreshFixtures(): Promise<void> {
  // API-Football fixtures
  try {
    const footballFixtures = await apiFootball.getTodayFixtures();
    const footballCount = Array.isArray(footballFixtures) ? footballFixtures.length : 0;
    logger.info('Fixtures refresh: football', { count: footballCount });
  } catch (err) {
    logger.error('Fixtures refresh failed (football)', { error: (err as Error).message });
  }

  // ESPN scoreboards — covers NBA, NFL, NHL, MLB, EPL, UCL
  try {
    const espnData = await espn.getAllUSScoreboards();
    let espnEventCount = 0;
    for (const data of Object.values(espnData)) {
      if (!data || typeof data !== 'object') continue;
      const events = (data as Record<string, unknown>).events as unknown[] | undefined;
      if (Array.isArray(events)) espnEventCount += events.length;
    }
    logger.info('Fixtures refresh: ESPN scoreboards', { count: espnEventCount });
  } catch (err) {
    logger.error('Fixtures refresh failed (ESPN)', { error: (err as Error).message });
  }

  // Cricket — budget-guarded (100 req/day soft-cap at 90)
  try {
    const cricketFixtures = await cricketData.getCurrentMatches();
    const cricketCount = Array.isArray(cricketFixtures) ? cricketFixtures.length : 0;
    logger.info('Fixtures refresh: cricket', { count: cricketCount });
  } catch (err) {
    logger.error('Fixtures refresh failed (cricket)', { error: (err as Error).message });
  }
}

/**
 * Cleans up stale daily API counter keys from the previous day.
 */
async function resetDailyCounters(): Promise<void> {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const keys = await scanKeys(`*:daily_count:${yesterday}`);
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

  // Every 3 minutes: refresh aggregate live events cache
  cron.schedule('*/3 * * * *', () => {
    import('../sports-data.service').then(({ refreshAggregateCache }) => {
      refreshAggregateCache().catch((e) => logger.error('Cron: aggregate refresh error', { error: (e as Error).message }));
    });
  });

  // Warm the aggregate cache on startup
  import('../sports-data.service').then(({ refreshAggregateCache }) => {
    refreshAggregateCache().catch((e) => logger.error('Startup aggregate refresh failed', { error: (e as Error).message }));
  });

  logger.info('Sports data scheduler started');
}
