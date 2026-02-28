import cron from 'node-cron';
import { syncOdds } from './oddsSync';
import { settleBets } from './betSettlement';
import logger from '../config/logger';

export function startScheduler(): void {
  // Sync live odds every 5 seconds
  cron.schedule('*/5 * * * * *', async () => {
    await syncOdds();
  });

  // Sync pre-match odds every minute
  cron.schedule('* * * * *', async () => {
    await syncOdds();
  });

  // Settle bets every minute
  cron.schedule('* * * * *', async () => {
    await settleBets();
  });

  logger.info('Scheduler started: odds sync (5s/60s), bet settlement (60s)');
}
