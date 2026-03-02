import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { loggerMiddleware } from './middleware/logger.middleware';
import { sanitizeMiddleware } from './middleware/sanitize.middleware';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';

import authRoutes from './modules/auth/auth.routes';
import adminRoutes from './modules/admin/admin.routes';
import agentsRoutes from './modules/agents/agents.routes';
import creditsRoutes from './modules/credits/credits.routes';
import sportsRoutes from './modules/sports/sports.routes';
import betsRoutes from './modules/bets/bets.routes';
import logsRoutes from './modules/logs/logs.routes';
import gamingRoutes from './modules/gaming/gaming.routes';
import resultsRoutes from './modules/results/results.routes';

const app = express();

app.use(helmet());
const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loggerMiddleware);
app.use(apiRateLimiter);
app.use(sanitizeMiddleware);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: null, message: 'API is running', error: null });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/gaming', gamingRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/admin/logs', logsRoutes);
app.use('/api/results', resultsRoutes);

app.use(errorHandler);

export default app;
