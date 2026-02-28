import http from 'http';
import app from './app';
import { env } from './config/env';
import { initSocket } from './socket';
import { setSocketIO } from './jobs/oddsSync';
import { startScheduler } from './jobs/scheduler';
import logger from './config/logger';

const server = http.createServer(app);

const io = initSocket(server);
setSocketIO(io);

startScheduler();

const PORT = env.PORT;

server.listen(PORT, () => {
  logger.info(`BetArena API server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});
