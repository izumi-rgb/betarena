import cron from 'node-cron';
import { settleBets } from './betSettlement';
import logger from '../config/logger';
import { withRedisLock } from '../utils/distributedLock';

export function startScheduler(): void {
  // Settle bets every minute
  cron.schedule('* * * * *', async () => {
    const result = await withRedisLock('lock:jobs:settle-bets', 55, settleBets);
    if (result === null) {
      logger.debug('Skipped settlement tick because another worker holds the lock');
    }
  });

  logger.info('Scheduler started: bet settlement (60s)');
}
