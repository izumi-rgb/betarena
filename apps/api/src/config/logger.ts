import winston from 'winston';
import { env } from './env';

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'betarena-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// File transport only when running on a persistent server (not serverless)
if (env.NODE_ENV === 'production' && process.env.ENABLE_FILE_LOGGING === 'true') {
  const fs = require('fs');
  const logDir = process.env.LOG_DIR || 'logs';
  fs.mkdirSync(logDir, { recursive: true });
  logger.add(new winston.transports.File({ filename: `${logDir}/error.log`, level: 'error' }));
  logger.add(new winston.transports.File({ filename: `${logDir}/combined.log` }));
}

export default logger;
