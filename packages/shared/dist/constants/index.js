"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEB_PORT = exports.API_PORT = exports.BET_SETTLEMENT_INTERVAL_MS = exports.PREMATCH_SYNC_INTERVAL_MS = exports.LIVE_SYNC_INTERVAL_MS = exports.ODDS_CACHE_TTL_SECONDS = exports.RATE_LIMITS = exports.REFRESH_TOKEN_EXPIRY_SECONDS = exports.REFRESH_TOKEN_EXPIRY_DAYS = exports.JWT_EXPIRY = exports.CREDIT_TRANSACTION_TYPES = exports.EVENT_STATUSES = exports.BET_STATUSES = exports.ROLES = void 0;
exports.ROLES = {
    ADMIN: 'admin',
    AGENT: 'agent',
    SUB_AGENT: 'sub_agent',
    MEMBER: 'member',
};
exports.BET_STATUSES = {
    OPEN: 'open',
    WON: 'won',
    LOST: 'lost',
    VOID: 'void',
    CASHOUT: 'cashout',
};
exports.EVENT_STATUSES = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished',
};
exports.CREDIT_TRANSACTION_TYPES = {
    CREATE: 'create',
    TRANSFER: 'transfer',
    DEDUCT: 'deduct',
};
exports.JWT_EXPIRY = '2h';
exports.REFRESH_TOKEN_EXPIRY_DAYS = 7;
exports.REFRESH_TOKEN_EXPIRY_SECONDS = exports.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
exports.RATE_LIMITS = {
    LOGIN_MAX_ATTEMPTS: 5,
    LOGIN_WINDOW_MINUTES: 15,
    API_MAX_REQUESTS: 100,
    API_WINDOW_MINUTES: 1,
};
exports.ODDS_CACHE_TTL_SECONDS = 10;
exports.LIVE_SYNC_INTERVAL_MS = 5000;
exports.PREMATCH_SYNC_INTERVAL_MS = 60000;
exports.BET_SETTLEMENT_INTERVAL_MS = 60000;
exports.API_PORT = 4000;
exports.WEB_PORT = 3000;
//# sourceMappingURL=index.js.map