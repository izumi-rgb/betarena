import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { SendCommandFn } from 'rate-limit-redis';
import redis from '../config/redis';
import { RATE_LIMITS } from '../config/constants';

const sendCommand: SendCommandFn = async (...args: string[]) => {
  // ioredis .call() accepts (command, ...args) which maps to the raw command interface
  const [command, ...rest] = args;
  return redis.call(command, ...rest) as ReturnType<SendCommandFn>;
};

export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMITS.LOGIN_MAX_ATTEMPTS,
  message: {
    success: false,
    data: null,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
  store: new RedisStore({ sendCommand, prefix: 'rl:login:' }),
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
  store: new RedisStore({ sendCommand, prefix: 'rl:api:' }),
});
