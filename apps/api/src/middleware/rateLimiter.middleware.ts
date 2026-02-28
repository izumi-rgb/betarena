import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../config/constants';

export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMITS.LOGIN_MAX_ATTEMPTS,
  message: {
    success: false,
    data: null,
    message: 'Too many login attempts. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
});

export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.API_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMITS.API_MAX_REQUESTS,
  message: {
    success: false,
    data: null,
    message: 'Too many requests. Please slow down.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
});
