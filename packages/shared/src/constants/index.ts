export const ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent',
  SUB_AGENT: 'sub_agent',
  MEMBER: 'member',
} as const;

export const BET_STATUSES = {
  OPEN: 'open',
  WON: 'won',
  LOST: 'lost',
  VOID: 'void',
  CASHOUT: 'cashout',
} as const;

export const EVENT_STATUSES = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
} as const;

export const CREDIT_TRANSACTION_TYPES = {
  CREATE: 'create',
  TRANSFER: 'transfer',
  DEDUCT: 'deduct',
} as const;

export const JWT_EXPIRY = '2h';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const REFRESH_TOKEN_EXPIRY_SECONDS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;

export const RATE_LIMITS = {
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_WINDOW_MINUTES: 15,
  API_MAX_REQUESTS: 300,
  API_WINDOW_MINUTES: 1,
} as const;

export const ODDS_CACHE_TTL_SECONDS = 10;
export const LIVE_SYNC_INTERVAL_MS = 5000;
export const PREMATCH_SYNC_INTERVAL_MS = 60000;
export const BET_SETTLEMENT_INTERVAL_MS = 60000;

export const API_PORT = 4000;
export const WEB_PORT = 3000;
