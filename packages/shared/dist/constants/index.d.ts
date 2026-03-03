export declare const ROLES: {
    readonly ADMIN: "admin";
    readonly AGENT: "agent";
    readonly SUB_AGENT: "sub_agent";
    readonly MEMBER: "member";
};
export declare const BET_STATUSES: {
    readonly OPEN: "open";
    readonly WON: "won";
    readonly LOST: "lost";
    readonly VOID: "void";
    readonly CASHOUT: "cashout";
};
export declare const EVENT_STATUSES: {
    readonly SCHEDULED: "scheduled";
    readonly LIVE: "live";
    readonly FINISHED: "finished";
};
export declare const CREDIT_TRANSACTION_TYPES: {
    readonly CREATE: "create";
    readonly TRANSFER: "transfer";
    readonly DEDUCT: "deduct";
};
export declare const JWT_EXPIRY = "2h";
export declare const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export declare const REFRESH_TOKEN_EXPIRY_SECONDS: number;
export declare const RATE_LIMITS: {
    readonly LOGIN_MAX_ATTEMPTS: 5;
    readonly LOGIN_WINDOW_MINUTES: 15;
    readonly API_MAX_REQUESTS: 100;
    readonly API_WINDOW_MINUTES: 1;
};
export declare const ODDS_CACHE_TTL_SECONDS = 10;
export declare const LIVE_SYNC_INTERVAL_MS = 5000;
export declare const PREMATCH_SYNC_INTERVAL_MS = 60000;
export declare const BET_SETTLEMENT_INTERVAL_MS = 60000;
export declare const API_PORT = 4000;
export declare const WEB_PORT = 3000;
