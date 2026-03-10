# BetArena — Architecture and Flows

**Document purpose:** Single reference for monorepo layout, tech stack, key flows, execution paths, and data flow. Use for onboarding and implementation planning.

**Analysis date:** 2025-03-06  

**Related:** [BETARENA_APPLICATION_DOCUMENTATION.md](./BETARENA_APPLICATION_DOCUMENTATION.md) — feature list, API integrations, UX notes.

---

## Contents

1. [Architecture](#1-architecture) — monorepo, deployment, API ↔ Web, server/client, middleware  
2. [Technical stack](#2-technical-stack) — frameworks, DB, Redis, auth, real-time, frontend state  
3. [Flows](#3-flows) — auth, API request, credit/betting, real-time, frontend routing  
4. [Key execution paths](#4-key-execution-paths) — HTTP → response, login → dashboard, bet slip → placement  
5. [Data flow](#5-data-flow) — DB schema, Redis keys, API response shape  
6. [Environment variables](#6-environment-variables-reference)  
7. [API route index](#7-api-route-index-full) — full route table  
8. [Frontend route map by role](#8-frontend-route-map-by-role)  
9. [Sports data and odds flow](#9-sports-data-and-odds-flow)  
10. [Two UI systems](#10-two-ui-systems-variant-vs-next-native)  
11. [Background jobs](#11-background-jobs-cron)  
12. [Flow diagrams](#12-flow-diagrams-mermaid) — auth, bet placement, credit transfer  

---

## 1. Architecture

### 1.1 Monorepo structure

- **Root:** npm workspaces `apps/*`, `packages/*` (see root `package.json`).
- **apps/api:** Express API, port 4000. Entry: `apps/api/src/index.ts` → creates HTTP server, mounts `app` from `apps/api/src/app.ts`, initializes Socket.IO on same server, starts cron jobs (odds sync, bet settlement, sports-data).
- **apps/web:** Next.js 14 app, port 3000. App Router under `apps/web/src/app/`. Public home at `/`, login at `/login`; member area under `(member)/`, admin under `admin/`, agent under `agent/`.
- **packages/shared:** Shared types and constants. Built to `dist/`; consumed by API as `@betarena/shared`. Exports: `packages/shared/src/index.ts` → `types`, `constants`.

### 1.2 Deployment

- **Docker (local/full stack):** `docker-compose.yml` at repo root. Services: `postgres` (PostgreSQL 15, host port 5433), `redis` (Redis 7, host port 6380), `api` (build `apps/api/Dockerfile`, port 4000), `web` (build `apps/web/Dockerfile`, port 3000). API env: `DB_HOST=postgres`, `REDIS_HOST=redis`; web env: `NEXT_PUBLIC_API_URL=http://api:4000`, `NEXT_PUBLIC_WS_URL=http://api:4000`.
- **Railway:** Each app is a separate service. API: root `railway.toml` or `apps/api/railway.toml` — `dockerfilePath = "apps/api/Dockerfile"`, `startCommand` runs Knex migrations then `node apps/api/dist/index.js`, healthcheck `GET /api/health`. Web: `apps/web/railway.toml` — `dockerfilePath = "apps/web/Dockerfile"`, healthcheck `/`. Env: `DATABASE_URL` / `REDIS_URL` (or individual DB/Redis vars), `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` pointing at the deployed API URL.

### 1.3 API ↔ Web communication

- **HTTP:** Web uses Axios in `apps/web/src/lib/api.ts`: `baseURL = process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:4000`), `withCredentials: true`. All JSON API calls go to `/api/*` on that origin. Standard response shape: `{ success, data, message, error }`.
- **WebSocket:** Socket.IO on the same HTTP server as the API. Web client: `apps/web/src/lib/socket.ts` — connects to `process.env.NEXT_PUBLIC_WS_URL` (same host as API), sends JWT via `auth: { token }`. Used for real-time balance updates and event-room joins.

### 1.4 Server vs client boundaries (web)

- **Server:** Next.js server components and middleware. `apps/web/src/middleware.ts` runs on the server: reads `access_token` cookie, decodes JWT for `role`, redirects by role (e.g. `/admin` → admin only, `/agent/*` → agent/sub_agent only, member routes allow unauthenticated browsing except where guarded).
- **Client:** Components under `'use client'` (e.g. `AuthGuard`, `AuthBootstrap`, `SocketBootstrap`, `CreditsProvider`, stores). Auth state and token live in Zustand (`authStore`) and localStorage (`accessToken`); cookies are set by API on login/refresh and sent automatically with `withCredentials`.

### 1.5 Middleware (API)

Order in `apps/api/src/app.ts`:

1. `helmet`, `cors` (origin from `env.CORS_ORIGIN`), `express.json`, `cookieParser`, `loggerMiddleware`, `apiRateLimiter`, `sanitizeMiddleware`.
2. Routes mounted under `/api/*`.
3. `errorHandler` last.

Route-level: `authMiddleware` (JWT from `Authorization: Bearer` or `access_token` cookie) and `requireRole(...roles)` from `apps/api/src/middleware/rbac.middleware.ts` applied per router (e.g. admin routes use `requireRole('admin')`, bets POST uses `requireRole('member')`).

---

## 2. Technical stack

### 2.1 Frameworks and runtime

- **API:** Node, Express 4.x. Build: `tsc`; dev: `ts-node-dev` (see `apps/api/package.json`).
- **Web:** Next.js 14.2.x, React 18 (see `apps/web/package.json`).
- **Shared:** TypeScript only; build: `tsc` (see `packages/shared/package.json`).

### 2.2 Database and query

- **DB:** PostgreSQL 15 (Docker) or provider (e.g. Railway). Connection: `apps/api/src/config/database.ts` — Knex with `pg`; uses `env.DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- **Migrations:** Knex; directory `apps/api/migrations/` (configured in `apps/api/src/config/knexfile.ts`). Migrations run on API start in Railway; locally: `npm run migrate --workspace=apps/api`.

### 2.3 Redis

- **Client:** `ioredis` in `apps/api/src/config/redis.ts`. Connection: `env.REDIS_URL` or `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`.
- **Usage:** Refresh tokens (`refresh:<token>`), brute-force counters (`bf:<ip>`), user preferences (`prefs:<userId>`), odds/sports cache keys, event watcher counts (`watchers:<eventId>`). See “Data flow — Redis” below.

### 2.4 Auth

- **Mechanism:** JWT access token (2h, `JWT_EXPIRY` from shared constants), HTTP-only cookies `access_token` and `refresh_token` set by API; web also keeps access token in localStorage for Axios and Socket.IO. Refresh: opaque token stored in Redis; rotation on use.
- **Libraries:** `jsonwebtoken`, `bcryptjs` (passwords). Roles: `admin`, `agent`, `sub_agent`, `member` (see `packages/shared` and `apps/api/migrations/20240101000001_create_users.ts`).

### 2.5 Real-time

- **Socket.IO:** Server: `apps/api/src/socket.ts` (attach to same `http.Server` as Express). Client: `socket.io-client` in `apps/web/src/lib/socket.ts`. Auth: middleware in `socket.ts` verifies JWT from `socket.handshake.auth.token` or `Authorization` header; `socket.data.user` / `socket.data.role` set; user room `user:${userId}` for server-driven emits.

### 2.6 Frontend state and data

- **Auth:** Zustand `apps/web/src/stores/authStore.ts` — user, accessToken, isAuthenticated, isHydrating; actions: login, logout, refreshToken, fetchMe, hydrateSession. Token synced to localStorage and Socket.
- **Bet slip:** Zustand with persist `apps/web/src/stores/betSlipStore.ts` — picks, stake, open state (key `betarena-betslip-v2`).
- **Server state:** TanStack React Query (e.g. balance in `apps/web/src/hooks/useBalance.ts` with `BALANCE_QUERY_KEY`, invalidated on Socket `balance:updated`).

### 2.7 Key dependencies (summary)

| Area        | Package / tech |
|------------|-----------------|
| API        | express, knex, pg, ioredis, jsonwebtoken, bcryptjs, socket.io, cookie-parser, cors, helmet, express-rate-limit, winston, xss |
| Web        | next, react, @tanstack/react-query, zustand, axios, socket.io-client, tailwindcss, radix-ui, lucide-react |
| Shared     | (types/constants only) |

---

## 3. Flows

### 3.1 Authentication flow

1. **Login:**  
   - User submits credentials on `/login` (e.g. variant login component).  
   - Web: `authStore.login()` → `apiPost('/api/auth/login', { username, password })` with `withCredentials`.  
   - API: `apps/api/src/modules/auth/auth.routes.ts` POST `/login` → `loginRateLimiter` → `login()` in `apps/api/src/modules/auth/auth.service.ts`.  
   - Service: brute-force check via Redis `bf:<ip>`; lookup user; bcrypt compare; on success issue JWT, create refresh token (UUID) stored in Redis `refresh:<token>`; set cookies `access_token`, `refresh_token`; return `{ user, accessToken }`.  
   - Web: stores accessToken (localStorage + authStore), calls `connectSocket(accessToken)`, sets user and isAuthenticated.

2. **JWT refresh:**  
   - On 401, Axios interceptor in `apps/web/src/lib/api.ts` calls POST `/api/auth/refresh` with cookies; no body.  
   - API: reads `refresh_token` cookie; `refreshAccessToken()` in auth.service: get payload from Redis, delete old key, re-validate user, issue new access + refresh, set new cookies, return `accessToken`.  
   - Web: stores new token, retries failed request; optionally reconnects Socket with new token.

3. **Role-based access:**  
   - **API:** After `authMiddleware`, routes use `requireRole('admin')`, `requireRole('agent', 'sub_agent')`, or `requireRole('member')` (e.g. `apps/api/src/modules/admin/admin.routes.ts`, `agents.routes.ts`, `bets.routes.ts`).  
   - **Web:** `apps/web/src/middleware.ts` decodes JWT from cookie and redirects: `/admin` only for admin; `/agent/*` only for agent/sub_agent; member/sports routes allow guests; authenticated admin/agent redirected away from member sport pages to their dashboards.  
   - **Client guard:** `apps/web/src/components/AuthGuard.tsx` — optional `requireAuth` and `allowedRoles`; redirects to login or role-specific default (e.g. admin → `/admin/overview`, agent → `/agent/dashboard`, else `/sports`) when role does not match.

### 3.2 API request flow

1. Request hits Express → helmet, CORS, body parsing, cookie parser, logger, rate limiter, sanitize.
2. Route match (e.g. `/api/auth/*`, `/api/admin/*`, `/api/credits/*`, `/api/bets/*`, …).
3. Route-specific middleware: `authMiddleware` (JWT), then often `requireRole(...)`.
4. Handler calls service layer (e.g. `credits.service`, `bets.service`, `auth.service`); services use `db` (Knex) and optionally Redis, `writeSystemLog`, `emitToUser` for Socket.
5. Response: JSON `{ success, data, message, error }`. Errors: 4xx/5xx with same shape; unhandled errors go to `errorHandler.middleware.ts`.

### 3.3 Credit and betting flow

1. **Balance:**  
   - Member balance: `credit_accounts.balance` for `user_id`.  
   - GET `/api/credits/balance` → `getBalance(userId)` → returns `{ balance }`.  
   - Balance updates (after create/transfer/deduct/cashout) emitted via `emitToUser(userId, 'balance:updated', { reason, balance })` (see `apps/api/src/utils/socketEvents.ts`).

2. **Transfers:**  
   - Admin: POST `/api/credits/admin/create` (body `amount`) → `adminCreateCredits` → credit_accounts increment, credit_transactions insert type `create`, emit balance to admin.  
   - Agent→subordinate: POST `/api/credits/transfer` (body `to_user_id`, `amount`) → `transferCredits` enforces direct subordinate (parent_agent_id/created_by); within transaction: decrement sender, increment receiver, insert `transfer`; emit to both.

3. **Bet placement:**  
   - POST `/api/bets` (auth + `requireRole('member')`). Body: `type`, `stake`, `selections` (and optionally system_type, each_way params, handicap_line, total_line).  
   - `apps/api/src/modules/bets/bets.service.ts` `placeBet()`: validate; snapshot odds from `odds` table; compute potential_win/totalStake by type (single, accumulator, system, each_way, asian_handicap, over_under); in transaction: lock credit_accounts row, check balance ≥ totalStake, decrement balance, insert `bets`, insert credit_transactions type `deduct`; system log; emit `balance:updated`.  
   - Returns bet_uid, type, stake, potential_win, selections snapshot, status.

4. **Settlement:**  
   - Cron in `apps/api/src/jobs/betSettlement.ts` (and scheduler in `apps/api/src/jobs/scheduler.ts`): fetches open bets and event results, evaluates outcomes, updates bets (status, actual_win), credits account, inserts credit_transactions; emits `balance:updated` per user.

5. **Cashout:**  
   - POST `/api/bets/:betUid/cashout` or `.../cashout/partial` (body percent for partial). Service: lock bet, compute cashout amount, update bet (status cashout / reduce stake/potential for partial), increment balance, insert transaction; emit `balance:updated`.

### 3.4 Real-time flow (Socket.IO)

- **Connection:** Client calls `connectSocket(accessToken)` (e.g. from AuthBootstrap / after login). Server socket middleware verifies JWT, sets `socket.data.user`, `socket.data.role`; socket joins `user:${userId}`.
- **Events from server:** `emitToUser(userId, event, payload)` → `io.to('user:'+userId).emit(event, { userId, ...payload })`. Used for `balance:updated` (reason, balance).
- **Events from client:** `join:event`, `leave:event` — server joins/leaves room `event:${eventId}` and increments/decrements Redis `watchers:${eventId}` (used for live watcher counts / future use).

### 3.5 Frontend routing and role guards

- **Layouts:**  
  - Root: `apps/web/src/app/layout.tsx` — QueryProvider, AuthBootstrap, Toaster.  
  - Member: `apps/web/src/app/(member)/layout.tsx` — SocketBootstrap, CreditsProvider, AuthGuard (requireAuth only for `/my-bets`, `/account`), MemberGlobalChrome, optional AppShell by path.  
  - Admin: `apps/web/src/app/admin/layout.tsx` (admin UI).  
  - Agent: `apps/web/src/app/agent/layout.tsx` (agent UI).

- **Middleware:** Redirects unauthenticated users from `/admin` and `/agent/` to `/login`; redirects wrong-role from `/admin` or `/agent/` to dashboard or `/sports`; redirects admin/agent away from member sport/my-bets/account to their dashboards.

- **AuthGuard:** Used inside (member) layout; can require auth and/or allowed roles; redirects to login with `?next=` or to role default; shows “Checking session…” / “Redirecting…” while hydrating or role-mismatch.

---

## 4. Key execution paths

### 4.1 HTTP request to response

1. Client (e.g. `apiPost('/api/bets', body)`) → Axios adds `Authorization: Bearer <token>` from localStorage, `withCredentials: true`.  
2. Express: CORS, body parser, cookies, logger, rate limit, sanitize.  
3. Route: e.g. `/api/bets` → authMiddleware (verify JWT, set req.user) → requireRole('member') → handler.  
4. Handler: validate body, call `placeBet(...)` in bets.service.  
5. Service: DB transaction (lock account, deduct, insert bet and credit_transaction), system log, `emitToUser(userId, 'balance:updated', ...)`.  
6. Response: `res.status(201).json({ success: true, data: result, message, error: null })`.  
7. If 401: Axios interceptor triggers refresh then retry (see “JWT refresh” above).

### 4.2 Login to dashboard

1. User opens `/login`, submits credentials.  
2. `authStore.login()` → POST `/api/auth/login`; API sets cookies and returns `{ user, accessToken }`.  
3. Web: setToken(accessToken), connectSocket(accessToken), set user + isAuthenticated.  
4. Redirect or navigate to role default: member → e.g. `/sports`, admin → `/admin/overview`, agent → `/agent/dashboard`.  
5. (Member) layout: AuthBootstrap already ran hydrateSession; SocketBootstrap ensures Socket connected; CreditsProvider/useBalance fetch balance; AuthGuard allows access.

### 4.3 Bet slip to placement

1. User adds selections in UI; state in `betSlipStore` (picks, stake).  
2. UI (e.g. MemberGlobalChrome or AppShell) builds payload: `type` (single/accumulator from picks length), `stake`, `selections` (event_id, market_type, selection_name, odds).  
3. `placeBet()` from CreditsContext or inline `apiPost('/api/bets', { type, stake, selections })` with credentials.  
4. API: auth + requireRole('member') → bets.service placeBet → snapshot odds, compute stake/potential, transaction (deduct, insert bet + transaction), emit balance:updated.  
5. Web: on success, refetch balance (or React Query invalidated by Socket `balance:updated`); bet slip can be cleared locally.

---

## 5. Data flow

### 5.1 Database schema (from Knex migrations)

- **users** (`apps/api/migrations/20240101000001_create_users.ts`): id, display_id, username, password_hash, role (admin|agent|sub_agent|member), nickname, is_active, created_by, parent_agent_id, can_create_sub_agent, timestamps. Indexes: role, parent_agent_id, created_by.
- **credit_accounts** (`20240101000002_create_credit_accounts.ts`): id, user_id (unique, FK users), balance, total_received, total_sent, updated_at.
- **credit_transactions** (`20240101000003_create_credit_transactions.ts`): id, from_user_id, to_user_id, amount, type (create|transfer|deduct), note, created_at. Indexes on from_user_id, to_user_id, created_at.
- **bets** (`20240101000004_create_bets.ts`): id, bet_uid, user_id, type (single|accumulator|system|each_way|asian_handicap|over_under), status (open|won|lost|void|cashout), stake, potential_win, actual_win, odds_snapshot (jsonb), selections (jsonb), settled_at, created_at. Later migration adds metadata (e.g. `20240101000008_add_metadata_to_bets.ts`).
- **events, odds, system_logs:** See other migrations under `apps/api/migrations/`.

### 5.2 Redis usage

| Key pattern            | TTL / usage |
|------------------------|------------|
| `refresh:<uuid>`       | REFRESH_TOKEN_EXPIRY_SECONDS; JWT payload for refresh. |
| `bf:<ip>`              | 15 min; login failure count; brute-force block. |
| `prefs:<userId>`       | No TTL; user preferences JSON. |
| `watchers:<eventId>`  | Counter; incr/decr on join:event / leave:event. |
| Odds/sports cache      | Various keys with setex (e.g. ODDS_CACHE_TTL_SECONDS, sports-data TTL) in sports.service, sports-data.service, redis-strategy, oddsSync. |

### 5.3 API response shape

- Standard: `{ success: boolean, data: T | null, message: string, error: string | null }`.  
- Success: `data` holds payload (e.g. user, balance, bet, list); `error` null.  
- Failure: `success` false, `message` and `error` set (e.g. `INVALID_CREDENTIALS`, `INSUFFICIENT_BALANCE`, `FORBIDDEN`).  
- Types in `packages/shared/src/types/index.ts`: User, CreditAccount, CreditTransaction, Bet, SportEvent, Odds, SystemLog, ApiResponse<T>.

---

## 6. Environment variables (reference)

**API (`apps/api/src/config/env.ts`):**

- Required: `JWT_SECRET`, `JWT_REFRESH_SECRET`.  
- DB: `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.  
- Redis: `REDIS_URL` or `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.  
- Optional: `NODE_ENV`, `PORT` (default 4000), `CORS_ORIGIN` (default `http://localhost:3000`), `SPORTS_API_KEY`, `SPORTS_API_BASE_URL`.

**Web:**

- `NEXT_PUBLIC_API_URL` — API base URL (e.g. `http://localhost:4000`).  
- `NEXT_PUBLIC_WS_URL` — WebSocket URL (same as API in single-server setup).

---

## 7. API route index (full)

All routes are prefixed with `/api`. Middleware: `authMiddleware` = JWT from Bearer or cookie; `requireRole(...)` = RBAC after auth.

| Prefix | Method | Path / pattern | Auth | Role | Handler / purpose |
|--------|--------|----------------|------|------|-------------------|
| `/api` | GET | `/api/health` | No | — | Health check |
| `/api/auth` | POST | `/login` | No | — | Login, set cookies, return user + accessToken |
| | POST | `/logout` | Yes | — | Clear refresh token, clear cookies |
| | POST | `/refresh` | Cookie | — | Rotate refresh, new access + cookies |
| | GET | `/me` | Yes | — | Current user |
| | PATCH | `/preferences` | Yes | — | User preferences (Redis) |
| | POST | `/change-password` | Yes | — | Change password |
| `/api/admin` | POST | `/agents` | Yes | admin | Create agent |
| | GET | `/agents` | Yes | admin | List agents |
| | GET | `/agents/:id` | Yes | admin | Agent detail |
| | PATCH | `/agents/:id/status` | Yes | admin | Activate/deactivate agent |
| | PATCH | `/agents/:id/privilege` | Yes | admin | Grant/revoke sub-agent right |
| | POST | `/credits/create` | Yes | admin | Create system credits |
| | GET | `/credits/ledger` | Yes | admin | Credit ledger |
| | GET | `/members` | Yes | admin | List all members |
| | PATCH | `/members/:id/status` | Yes | admin | Member active/suspended |
| `/api/admin/logs` | GET | `/` | Yes | admin | System logs (paginated) |
| `/api/agents` | POST | `/members` | Yes | agent/sub_agent | Create member (under agent) |
| | GET | `/members` | Yes | agent/sub_agent | List agent’s members |
| | GET | `/members/:id` | Yes | agent/sub_agent | Member detail |
| | PATCH | `/members/:id/status` | Yes | agent/sub_agent | Suspend/activate member |
| | GET | `/members/:id/bets` | Yes | agent/sub_agent | Member’s bets |
| | GET | `/members/:id/credits` | Yes | agent/sub_agent | Member’s credit history |
| | POST | `/sub-agents` | Yes | agent | Create sub-agent |
| | GET | `/sub-agents` | Yes | agent/sub_agent | List sub-agents |
| | PATCH | `/sub-agents/:id/privilege` | Yes | agent | Sub-agent privilege |
| `/api/credits` | POST | `/admin/create` | Yes | admin | Create credits |
| | GET | `/admin/overview` | Yes | admin | Credits overview (totals, agent/member balances) |
| | POST | `/transfer` | Yes | agent/sub_agent | Transfer credits to subordinate |
| | GET | `/balance` | Yes | any | Current user balance |
| | GET | `/transactions` | Yes | any | Current user transactions |
| `/api/sports` | GET | `/` | No | — | Sports list / config |
| | GET | `/live` | No | — | Live events (aggregated) |
| | GET | `/:sport/events` | No | — | Events by sport |
| | GET | `/:sport/competitions/:id/events` | No | — | Events by competition |
| | GET | `/events/:id/markets` | No | — | Markets for event |
| `/api/gaming` | GET | `/lobby` | No | — | Casino lobby placeholder |
| | GET | `/promotions` | No | — | Promotions placeholder |
| | GET | `/racecards` | No | — | Racecards placeholder |
| | GET | `/virtual-sports` | No | — | Virtual sports placeholder |
| `/api/bets` | POST | `/` | Yes | member | Place bet |
| | GET | `/my-bets` | Yes | member | Current user’s bets |
| | POST | `/:betUid/cashout` | Yes | member | Full cashout |
| | POST | `/:betUid/cashout/partial` | Yes | member | Partial cashout |
| `/api/results` | GET | `/` | No | — | Results list |

---

## 8. Frontend route map by role

| Route pattern | Layout | Auth | Role | Description |
|---------------|--------|------|------|--------------|
| `/`, `/login` | Root | No | — | Home, login |
| `/sports`, `/sports/*`, `/in-play`, `/results`, `/live` | (member) | Optional | Member / guest | Sports lobby, event pages, results, live grid |
| `/my-bets`, `/account`, `/account/*` | (member) | **Required** | Member | My bets, account, settings, transactions |
| `/admin`, `/admin/*` | admin | **Required** | **admin** | Admin dashboard, agents, members, credits, logs, settings, profile, privileges |
| `/agent`, `/agent/*` | agent | **Required** | **agent** or **sub_agent** | Agent dashboard, members, sub-agents, credits, reports, settings |

**Middleware behaviour:** Unauthenticated users hitting `/admin` or `/agent/*` → redirect to `/login`. Wrong role on `/admin` → redirect to `/agent/dashboard` or `/sports`. Wrong role on `/agent/*` → redirect to `/admin/overview` or `/sports`. Admin/agent on member routes (`/sports`, `/my-bets`, `/account`) → redirect to their dashboard.

**AuthGuard (client):** Used in (member), admin, and agent layouts. `requireAuth` forces login redirect with `?next=`. `allowedRoles` (admin layout: `['admin']`; agent layout: `['agent','sub_agent']`) redirects to role default when role does not match.

---

## 9. Sports data and odds flow

- **Sports-data module** (`apps/api/src/modules/sports-data/`): Aggregates events and odds from multiple providers (API-Football, ESPN, TheSportsDB, CricketData, OddsPapi, The Odds API). Normalizer unifies shape; sports-data.service exposes `getLiveEvents()`, sport-specific event lists, and market data.
- **Cron (sports):** `apps/api/src/modules/sports-data/scheduler/cron-jobs.ts` — started from `index.ts` via `startSportsDataScheduler()`. Refreshes live/prematch data on a schedule; writes to DB/Redis as configured.
- **Odds sync:** `apps/api/src/jobs/oddsSync.ts` — `syncOdds()` called by scheduler every 5s (live) and every minute (prematch). Reads from sports-data / odds providers; updates `events` and `odds` tables; uses Socket.IO (set via `setSocketIO(io)`) to push updates to clients in event rooms.
- **Bet settlement:** `apps/api/src/jobs/betSettlement.ts` — `settleBets()` runs every minute. Fetches open bets and event results; evaluates outcomes; updates `bets` (status, actual_win); credits accounts; inserts `credit_transactions`; emits `balance:updated` per user.

**Flow:** External APIs → sports-data providers → normalizer → sports-data.service → DB/Redis; scheduler/cron keep data fresh; oddsSync writes odds; bet placement reads odds snapshot; settlement reads results and updates bets + balances.

---

## 10. Two UI systems (variant vs Next-native)

- **Variant exports** (`variant-exports/`): 13 JSX components (e.g. `variant_login.js`, `variant_home.js`, `variant_inplay.js`, `variant_my_bets.js`, `variant_admin_dashboard.js`, `variant_agent_dashboard.js`). Use React Router shims (`Link`, `useNavigate`, `useLocation`) mapped to Next.js. Used for login, sports home, in-play, results, my-bets, account, admin and agent dashboards.
- **Next-native:** App Router pages under `apps/web/src/app/`; components under `apps/web/src/components/` (e.g. AuthGuard, MemberGlobalChrome, LiveEventsPage, SportSidebar, TopHeader, BalanceBadge). Sport-specific event pages under `(member)/sports/{sport}/[eventId]/page.tsx` (football, basketball, tennis, cricket, golf, esports, horse-racing) are Next-native. Both systems coexist; member layout and AppShell wrap content and provide bet slip, balance, and nav.

---

## 11. Background jobs (cron)

| Job | File | Schedule | Purpose |
|-----|------|----------|---------|
| Odds sync (live) | `jobs/oddsSync.ts` | Every 5s | Sync live odds; update DB; push via Socket to event rooms |
| Odds sync (prematch) | `jobs/oddsSync.ts` | Every 1 min | Sync prematch odds |
| Bet settlement | `jobs/betSettlement.ts` | Every 1 min | Settle open bets from event results; update balances; emit `balance:updated` |
| Sports-data refresh | `modules/sports-data/scheduler/cron-jobs.ts` | Per scheduler config | Refresh live/prematch events from external APIs |

Started in `apps/api/src/index.ts`: `startScheduler()` (odds + settlement), `startSportsDataScheduler()` (sports-data).

---

## 12. Flow diagrams (Mermaid)

### 12.1 Authentication flow

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web (authStore)
  participant A as API (/api/auth/login)
  participant R as Redis

  U->>W: Submit credentials
  W->>A: POST /api/auth/login { username, password }
  A->>R: Check bf:<ip> (brute-force)
  A->>A: bcrypt compare, issue JWT + refresh
  A->>R: SET refresh:<uuid> (payload)
  A->>W: Set-Cookie access_token, refresh_token; { user, accessToken }
  W->>W: setToken(), set user, connectSocket(accessToken)
  W->>U: Redirect to role default (admin/agent/sports)
```

### 12.2 Bet placement flow

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web (CreditsContext / placeBet)
  participant A as API (bets.routes + bets.service)
  participant DB as PostgreSQL
  participant S as Socket.IO

  U->>W: Place bet (stake, selections)
  W->>A: POST /api/bets { type, stake, selections } + Bearer
  A->>A: authMiddleware, requireRole('member')
  A->>A: placeBet(): validate, snapshot odds
  A->>DB: BEGIN; lock credit_accounts; balance >= stake?
  A->>DB: UPDATE balance; INSERT bets; INSERT credit_transactions (deduct)
  A->>DB: COMMIT
  A->>S: emitToUser(userId, 'balance:updated', { balance })
  A->>W: 201 { success, data: { bet_uid, ... } }
  W->>W: refetch balance / invalidate BALANCE_QUERY_KEY
  W->>U: Clear bet slip; show success
```

### 12.3 Credit transfer (agent → member)

```mermaid
sequenceDiagram
  participant Ag as Agent (Web)
  participant A as API (credits.routes + credits.service)
  participant DB as PostgreSQL
  participant S as Socket.IO

  Ag->>A: POST /api/credits/transfer { to_user_id, amount } + Bearer
  A->>A: authMiddleware; require agent/sub_agent
  A->>A: transferCredits(): validate subordinate (parent_agent_id/created_by)
  A->>DB: BEGIN; decrement sender balance; increment receiver; INSERT transfer tx
  A->>DB: COMMIT
  A->>S: emitToUser(senderId, 'balance:updated'); emitToUser(receiverId, 'balance:updated')
  A->>Ag: 200 { success, data }
```

---

*Architecture and flows document — 2025-03-06 (extended with route index, frontend map, sports-data, variant UI, cron, diagrams)*
