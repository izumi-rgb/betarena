# BitArena — In-Depth Application Analysis

**Purpose:** Single reference for architecture, tech stack, data flows, security, testing, and production considerations. Use for onboarding, audits, and implementation planning.

**Analysis date:** February 2026

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Repository structure](#2-repository-structure)
3. [Technology stack](#3-technology-stack)
4. [Application type and roles](#4-application-type-and-roles)
5. [Core flows](#5-core-flows)
6. [Data layer](#6-data-layer)
7. [API surface](#7-api-surface)
8. [Frontend architecture](#8-frontend-architecture)
9. [Sports data and external integrations](#9-sports-data-and-external-integrations)
10. [Security and authentication](#10-security-and-authentication)
11. [Background jobs](#11-background-jobs)
12. [Testing](#12-testing)
13. [Deployment and configuration](#13-deployment-and-configuration)
14. [Known issues and audit](#14-known-issues-and-audit)
15. [Strengths, gaps, and recommendations](#15-strengths-gaps-and-recommendations)

---

## 1. Executive summary

**BitArena (BetArena)** is a **multi-role sports betting platform** built as a monorepo. It provides:

- **Members:** Browse sports/events, place bets with virtual credits, cash out, view account and my-bets.
- **Agents / sub-agents:** Create members, transfer credits, view reports and member activity.
- **Admins:** Full control over users, credits, system logs, and privileges.

The stack is **Node.js (Express)** for the API, **Next.js 14** for the web app, **PostgreSQL** (Knex) and **Redis** for persistence and cache, and **Socket.IO** for real-time balance and event updates. Sports and odds come from **multiple external providers** (API-Football, ESPN, The Odds API, CricketData, etc.), normalized and cached. Bet settlement and sports-data refresh run as **cron jobs**. The frontend uses **two UI systems**: variant exports (React Router–style JSX with Next.js shims) and Next.js–native App Router pages and components.

---

## 2. Repository structure

```
bitarena/
├── apps/
│   ├── api/                    # Express REST API + Socket.IO server
│   │   ├── src/
│   │   │   ├── index.ts        # Server entry: HTTP + Socket + schedulers
│   │   │   ├── app.ts          # Express app, middleware, route mounting
│   │   │   ├── config/         # env, database, redis, knexfile, logger
│   │   │   ├── middleware/     # auth, RBAC, rate limit, sanitize, error handler
│   │   │   ├── modules/        # auth, admin, agents, credits, sports, bets, logs, gaming, results, sports-data
│   │   │   ├── jobs/           # scheduler, betSettlement, oddsSync
│   │   │   ├── socket.ts       # Socket.IO server, JWT auth, rooms
│   │   │   └── utils/          # socketEvents, distributedLock, sqliDetector
│   │   ├── migrations/         # Knex migrations (users, credit_accounts, bets, events, odds, etc.)
│   │   ├── seeds/              # admin user, bet365-style sports events
│   │   └── Dockerfile
│   └── web/                    # Next.js 14 frontend
│       ├── src/
│       │   ├── app/            # App Router: (auth), (member), admin, agent, root
│       │   ├── components/     # AuthGuard, MemberGlobalChrome, LiveEventsPage, etc.
│       │   ├── contexts/       # CreditsContext
│       │   ├── hooks/          # useBalance
│       │   ├── lib/            # api.ts (Axios), socket.ts, query-client
│       │   ├── stores/         # authStore, betSlipStore
│       │   └── middleware.ts   # role-based redirects, cookie/JWT
│       └── Dockerfile
├── packages/
│   └── shared/                 # @betarena/shared
│       └── src/                # types, constants (ROLES, BET_STATUSES, JWT/refresh TTL, rate limits)
├── variant-exports/            # 13 JSX variants (variant_login.js, variant_home.js, variant_inplay.js, etc.)
├── docs/                       # Architecture, deployment, audits, plans
├── package.json                # Workspaces: apps/*, packages/*
├── docker-compose.yml          # postgres, redis, api, web
└── docker-compose.override.yml # Dev overrides
```

| Path | Purpose |
|------|--------|
| `apps/api/src/index.ts` | Creates HTTP server from `app`, initializes Socket.IO, starts bet settlement and sports-data schedulers, listens on `PORT` (default 4000). |
| `apps/api/src/app.ts` | Express: helmet, CORS, body parsing, cookie parser, logger, sanitize, rate limit; mounts `/api/auth`, `/api/admin`, `/api/agents`, `/api/credits`, `/api/sports`, `/api/gaming`, `/api/bets`, `/api/admin/logs`, `/api/results`; error handler. |
| `apps/web/src/app/` | App Router: root `page.tsx`, `(auth)/login`, `(member)/*` (sports, in-play, my-bets, account, etc.), `admin/*`, `agent/*`. |
| `packages/shared` | Consumed by API as `@betarena/shared`; types and constants only. |

---

## 3. Technology stack

### 3.1 Backend (API)

| Category | Technology | Version / notes |
|----------|------------|------------------|
| Runtime | Node.js | 20+ |
| Framework | Express | ^4.21.0 |
| Language | TypeScript | ^5.7.0 |
| Database | PostgreSQL, Knex, pg | Knex ^3.1.0, pg ^8.13.1 |
| Cache / session | Redis, ioredis | ^5.4.1 |
| Real-time | Socket.IO (server) | ^4.8.1 |
| Auth | jsonwebtoken, bcryptjs | ^9.0.2, ^3.0.3 |
| Scheduling | node-cron | ^3.0.3 |
| HTTP client | axios | ^1.13.6 |
| Security | helmet, cors, cookie-parser, express-rate-limit, xss | — |
| Logging | winston | ^3.17.0 |

### 3.2 Frontend (Web)

| Category | Technology | Version / notes |
|----------|------------|------------------|
| Framework | Next.js | 14.2.35 (App Router) |
| UI | React | ^18 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS, Radix UI, lucide-react | Tailwind ^3.4.1 |
| State | Zustand, TanStack React Query | ^5.0.11, ^5.90.21 |
| Real-time | socket.io-client | ^4.8.3 |
| HTTP | Axios | ^1.13.5 |
| Testing | Vitest, Testing Library | ^4.0.18 |

### 3.3 Shared package

- **Name:** `@betarena/shared`
- **Entry:** `packages/shared/src/index.ts` → types, constants
- **Build:** `tsc` → `dist/`
- **Consumers:** API only (web does not depend on it in package.json; types may be duplicated or inferred)

### 3.4 Infrastructure

- **Database:** PostgreSQL 15 (Docker image `postgres:15-alpine`)
- **Cache:** Redis 7 (Docker image `redis:7-alpine`)
- **Containers:** Docker Compose at repo root; API and Web each have a Dockerfile

---

## 4. Application type and roles

### 4.1 Product

Sports betting platform with **virtual/demo credits**: no real money. Features include multi-sport events, live and upcoming odds, bet placement (singles, accumulators, systems, each-way, Asian handicap, over/under), cashout (full and partial), credit hierarchy (admin → agent → sub-agent → member), and automated bet settlement.

### 4.2 User roles

Defined in `packages/shared` and enforced via `requireRole` in API routes and via middleware/layouts in the web app:

| Role | Access |
|------|--------|
| **admin** | Full platform: users, agents, members, credits (create/ledger/overview), system logs, privileges, settings, profile. |
| **agent** | Create members and sub-agents, transfer credits, view members/sub-agents, reports, credits, settings. |
| **sub_agent** | Same as agent, scoped to parent agent. |
| **member** | Place and cash out bets, view sports/live/upcoming, my-bets, account (balance, transactions, settings). |

### 4.3 Role middleware

- **API:** `apps/api/src/middleware/rbac.middleware.ts` — `requireRole(...allowedRoles)` checks `req.user.role` after `authMiddleware`; 401/403 as appropriate.
- **Web:** `apps/web/src/middleware.ts` — decodes JWT from cookie, redirects unauthenticated from `/admin` and `/agent/*` to `/login`; wrong role from `/admin` or `/agent/*` to dashboard or `/sports`. Client-side `AuthGuard` in layouts enforces `requireAuth` and `allowedRoles` per route group.

---

## 5. Core flows

### 5.1 Authentication

1. **Login:** User submits credentials on `/login`. Web `authStore.login()` → POST `/api/auth/login` with `withCredentials`. API: login rate limiter, brute-force check (Redis `bf:<ip>`), user lookup, bcrypt compare; on success: issue JWT, create refresh token (UUID) in Redis `refresh:<token>`, set cookies `access_token`, `refresh_token`; return `{ user, accessToken }`. Web stores token (localStorage + authStore), connects Socket, sets user and isAuthenticated; redirect to role default (admin → `/admin/overview`, agent → `/agent/dashboard`, member → `/sports`).
2. **Refresh:** On 401, Axios interceptor calls POST `/api/auth/refresh` (cookies only). API reads `refresh_token` cookie, validates in Redis, rotates refresh, issues new access + refresh, sets new cookies, returns `accessToken`. Web updates token and retries request; Socket may reconnect with new token.
3. **Logout:** POST `/api/auth/logout` clears refresh in Redis and clears cookies.

### 5.2 Credits and balance

- **Balance:** GET `/api/credits/balance` → `getBalance(userId)` from `credit_accounts`; also emitted via Socket `balance:updated` after create/transfer/deduct/cashout.
- **Admin create:** POST `/api/credits/admin/create` (body `amount`) → increment admin credit_accounts, insert `credit_transactions` type `create`, emit balance to admin.
- **Transfer (agent → subordinate):** POST `/api/credits/transfer` (body `to_user_id`, `amount`) → validate direct subordinate (`parent_agent_id`/`created_by`); in transaction: decrement sender, increment receiver, insert type `transfer`; emit `balance:updated` to both.

### 5.3 Betting

- **Place bet:** POST `/api/bets` (auth + `requireRole('member')`). Body: `type`, `stake`, `selections` (event_id, market_type, selection_name, odds). Service: validate, snapshot odds from DB, compute potential_win/totalStake; transaction: lock credit_accounts, check balance ≥ totalStake, decrement balance, insert `bets`, insert `credit_transactions` type `deduct`; system log; emit `balance:updated`; return bet_uid and snapshot.
- **Settlement:** Cron (e.g. every minute): fetch open bets and event results, evaluate outcomes, update bets (status, actual_win), credit accounts, insert credit_transactions; emit `balance:updated` per user.
- **Cashout:** POST `/api/bets/:betUid/cashout` or `.../cashout/partial` (body `percent` for partial). Lock bet, compute cashout amount, update bet, increment balance, insert transaction; emit `balance:updated`.

### 5.4 Real-time (Socket.IO)

- **Connection:** Client calls `connectSocket(accessToken)`. Server socket middleware verifies JWT from `socket.handshake.auth.token` or `Authorization`, sets `socket.data.user` and `socket.data.role`; socket joins room `user:${userId}`.
- **Server→client:** `emitToUser(userId, event, payload)` → `io.to('user:'+userId).emit(event, { userId, ...payload })`. Used for `balance:updated` (reason, balance).
- **Client→server:** `join:event`, `leave:event` → server joins/leaves room `event:${eventId}` and updates Redis `watchers:${eventId}` (for live watcher counts).

---

## 6. Data layer

### 6.1 Database (PostgreSQL, Knex)

- **Config:** `apps/api/src/config/database.ts`, `apps/api/src/config/knexfile.ts`. Migrations: `apps/api/migrations/*.ts`.
- **Key tables:** `users` (id, display_id, username, password_hash, role, nickname, is_active, created_by, parent_agent_id, can_create_sub_agent), `credit_accounts` (user_id, balance, total_received, total_sent), `credit_transactions` (from_user_id, to_user_id, amount, type, note), `bets` (bet_uid, user_id, type, status, stake, potential_win, actual_win, odds_snapshot, selections, settled_at), `events`, `odds`, `system_logs`.
- **Seeds:** `001_admin_user.ts`, `002_bet365_sports_events.ts` (admin/agent/member users; sample events with one `status: 'live'` for dev).

### 6.2 Redis

- **Client:** `apps/api/src/config/redis.ts`. Connection: `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`.
- **Usage:** Refresh tokens (`refresh:<uuid>`), brute-force counters (`bf:<ip>`), user preferences (`prefs:<userId>`), sports/odds cache keys, `watchers:<eventId>`, `display:live:events`, distributed locks (e.g. `lock:jobs:settle-bets`), sports-data aggregate cache.

### 6.3 API response shape

Standard: `{ success: boolean, data: T | null, message: string, error: string | null }`. Success: `data` holds payload; failure: `success` false, `message` and `error` set (e.g. `INVALID_CREDENTIALS`, `INSUFFICIENT_BALANCE`, `FORBIDDEN`).

---

## 7. API surface

All routes under `/api`. Middleware: `authMiddleware` (JWT from Bearer or `access_token` cookie), `requireRole(...)` per router.

| Prefix | Method | Path | Auth | Role | Purpose |
|--------|--------|------|------|------|---------|
| — | GET | `/api/health` | No | — | Health check |
| `/api/auth` | POST | `/login` | No | — | Login, set cookies, return user + accessToken |
| | POST | `/logout` | Yes | — | Clear refresh, clear cookies |
| | POST | `/refresh` | Cookie | — | Rotate refresh, new access + cookies |
| | GET | `/me` | Yes | — | Current user |
| | PATCH | `/preferences` | Yes | — | User preferences (Redis) |
| | POST | `/change-password` | Yes | — | Change password |
| `/api/admin` | POST/GET/PATCH | `/agents`, `/agents/:id`, `/agents/:id/status`, `/agents/:id/privilege` | Yes | admin | Create/list/update agents |
| | POST/GET | `/credits/create`, `/credits/ledger` | Yes | admin | Create credits, ledger |
| | GET/PATCH | `/members`, `/members/:id/status` | Yes | admin | List/update members |
| `/api/admin/logs` | GET | `/` | Yes | admin | System logs (paginated) |
| `/api/agents` | POST/GET/PATCH | `/members`, `/members/:id`, `/members/:id/status`, `/members/:id/bets`, `/members/:id/credits` | Yes | agent/sub_agent | Members CRUD and activity |
| | POST/GET/PATCH | `/sub-agents`, `/sub-agents/:id/privilege` | Yes | agent/sub_agent or agent | Sub-agents |
| `/api/credits` | POST | `/admin/create` | Yes | admin | Create credits |
| | GET | `/admin/overview` | Yes | admin | Credits overview |
| | POST | `/transfer` | Yes | agent/sub_agent | Transfer to subordinate |
| | GET | `/balance`, `/transactions` | Yes | any | Current user balance/transactions |
| `/api/sports` | GET | `/`, `/live`, `/:sport/events`, `/:sport/competitions/:id/events`, `/events/:id/markets` | No | — | Sports list, live+upcoming, events by sport/competition, markets |
| `/api/gaming` | GET | `/lobby`, `/promotions`, `/racecards`, `/virtual-sports` | No | — | Placeholder endpoints (static data) |
| `/api/bets` | POST | `/` | Yes | member | Place bet |
| | GET | `/my-bets` | Yes | member | Current user bets |
| | POST | `/:betUid/cashout`, `/:betUid/cashout/partial` | Yes | member | Full/partial cashout |
| `/api/results` | GET | `/` | No | — | Results list |

---

## 8. Frontend architecture

### 8.1 Route map by role

| Route pattern | Layout | Auth | Role | Description |
|---------------|--------|------|------|-------------|
| `/`, `/login` | Root | No | — | Home, login |
| `/sports`, `/sports/*`, `/in-play`, `/results`, `/live` | (member) | Optional | Member/guest | Sports lobby, event pages, results, live |
| `/my-bets`, `/account`, `/account/*` | (member) | Required | Member | My bets, account, settings, transactions |
| `/admin`, `/admin/*` | admin | Required | admin | Dashboard, agents, members, credits, logs, settings, profile, privileges |
| `/agent`, `/agent/*` | agent | Required | agent/sub_agent | Dashboard, members, sub-agents, credits, reports, settings |

### 8.2 Layouts and providers

- **Root:** `layout.tsx` — QueryProvider, AuthBootstrap, Toaster, globals.
- **Member:** `(member)/layout.tsx` — SocketBootstrap, CreditsProvider, AuthGuard (requireAuth for `/my-bets`, `/account`), MemberGlobalChrome, optional AppShell.
- **Admin / Agent:** Dedicated layouts with AuthGuard and role-specific nav.

### 8.3 State

- **Auth:** Zustand `authStore` — user, accessToken, isAuthenticated, isHydrating; login, logout, refresh, fetchMe, hydrateSession. Token in localStorage and passed to Socket.
- **Bet slip:** Zustand with persist `betSlipStore` — picks, stake, open state.
- **Server state:** React Query (e.g. balance via `useBalance`, invalidated on Socket `balance:updated`).

### 8.4 Two UI systems

- **Variant exports** (`variant-exports/`): JSX components (e.g. `variant_login.js`, `variant_home.js`, `variant_inplay.js`, `variant_my_bets.js`, `variant_admin_dashboard.js`, `variant_agent_dashboard.js`) using React Router shims (`Link`, `useNavigate`, `useLocation`) mapped to Next.js. Used for login, sports home, in-play, results, my-bets, account, admin and agent dashboards.
- **Next-native:** App Router pages under `apps/web/src/app/` and components under `apps/web/src/components/` (AuthGuard, MemberGlobalChrome, LiveEventsPage, SportSidebar, etc.). Sport-specific event pages under `(member)/sports/{sport}/[eventId]/page.tsx` are Next-native. Both systems coexist; member layout and AppShell wrap content and provide bet slip, balance, and nav.

---

## 9. Sports data and external integrations

### 9.1 Sports-data module

- **Location:** `apps/api/src/modules/sports-data/`. Aggregates events and odds from multiple providers; normalizer unifies shape; `sports-data.service` exposes `getLiveEvents()` (returns `{ live, upcoming }`), sport-specific event lists, and market data.
- **Providers (under `providers/`):** api-football, api-basketball, api-baseball, api-hockey, api-rugby, api-handball, api-volleyball, the-odds-api, cricket-data, cricbuzz, oddspapi, espn-hidden, thesportsdb. Caching via `cache/redis-strategy.ts`. Env: `SPORTS_API_KEY`, `SPORTS_API_BASE_URL`; README also mentions `ODDS_API_KEY`, `ESPN_API_KEY`, `CRICKET_API_KEY`.

### 9.2 Sports API (public routes)

- **GET `/api/sports/live`:** Returns `{ live, upcoming }`. Backend: `getLiveEvents()` in sports.service — tries `SportsDataService.getLiveEvents()` (cache/aggregate); on failure or empty, falls back to DB (live events + scheduled for upcoming). Upcoming from API used when present; otherwise from DB so the page always has data when available.
- **GET `/api/sports/counts`:** Per-sport counts (scheduled + live) from DB.
- **GET `/api/sports/:sport/events`:** Events by sport (DB + optional enrichment).
- **GET `/api/sports/events/:id/markets`:** Markets for event (sports-data or DB fallback).

### 9.3 Other integrations

- No payment processors (demo credits only). Auth is custom (JWT + Redis). No dedicated APM/error-tracking in code.

---

## 10. Security and authentication

- **JWT:** Access token (e.g. 2h from shared constants), refresh token (opaque UUID in Redis). Secrets: `JWT_SECRET`, `JWT_REFRESH_SECRET` in `apps/api/src/config/env.ts`. Verified in `authMiddleware` (Bearer or `access_token` cookie).
- **Cookies:** `access_token`, `refresh_token`; set by API on login/refresh (httpOnly, secure when `COOKIE_SECURE === 'true'`, sameSite: lax).
- **Rate limiting:** General API rate limiter on `/api`; login-specific rate limiter on POST `/login`. Brute-force tracking in Redis (`bf:<ip>`).
- **Other:** Helmet, CORS (origin from `CORS_ORIGIN`), body parsing limit 10mb, sanitize middleware, bet validation in `bets.validator.ts`; optional SQLi detection in `utils/sqliDetector.ts`.

---

## 11. Background jobs

| Job | File | Schedule | Purpose |
|-----|------|----------|---------|
| Odds sync (live) | `jobs/oddsSync.ts` | Every 5s | Sync live odds; update DB; push via Socket to event rooms |
| Odds sync (prematch) | `jobs/oddsSync.ts` | Every 1 min | Sync prematch odds |
| Bet settlement | `jobs/betSettlement.ts` | Every 1 min | Settle open bets from event results; update balances; emit `balance:updated` |
| Sports-data refresh | `modules/sports-data/scheduler/cron-jobs.ts` | Per scheduler config | Refresh live/prematch events from external APIs |

Started in `apps/api/src/index.ts`: `startScheduler()` (odds + settlement), `startSportsDataScheduler()` (sports-data). Distributed lock (e.g. Redis `lock:jobs:settle-bets`) used for settlement to avoid duplicate work in multi-instance setups.

---

## 12. Testing

- **API:** Jest (`apps/api`), tests in `modules/auth/__tests__/`, `modules/bets/__tests__/`, `modules/credits/__tests__/`. Run: `npm run test --workspace=apps/api`.
- **Web:** Vitest (`apps/web`), e.g. `__tests__/betSlipStore.test.ts`. Run: `npm run test --workspace=apps/web`.
- **Coverage:** No single coverage gate or script at root; each app runs its own test command. No E2E/Playwright in the main repo (references in `.claude/skills/playwright-cli`).

---

## 13. Deployment and configuration

### 13.1 Environment variables

**API (`apps/api/src/config/env.ts`):**

- **Required:** `JWT_SECRET`, `JWT_REFRESH_SECRET`.
- **Database:** `DATABASE_URL` (preferred) or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- **Redis:** `REDIS_URL` or `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- **Optional:** `NODE_ENV`, `PORT` (default 4000), `CORS_ORIGIN` (default `http://localhost:3000`), `SPORTS_API_KEY`, `SPORTS_API_BASE_URL`.

**Web:**

- `NEXT_PUBLIC_API_URL` — API base URL (e.g. `http://localhost:4000`).
- `NEXT_PUBLIC_WS_URL` — WebSocket URL (same as API in single-server setup).

### 13.2 Docker Compose

- **File:** `docker-compose.yml` at repo root. Services: `postgres` (port 5433), `redis` (port 6380), `api` (4000), `web` (3000). API env: `DB_HOST=postgres`, `REDIS_HOST=redis`; web env: `NEXT_PUBLIC_API_URL=http://api:4000`, `NEXT_PUBLIC_WS_URL=http://api:4000`. API expects `.env` at repo root (or env_file); DB password in compose is `betarena_dev_password` — must match `DB_PASSWORD` if using individual DB vars.
- **VPS:** See `docs/deploy/VPS_SETUP.md`, `docs/deploy/docker-compose.vps.example.yml`, `docs/deploy/run-part4-on-server.sh` for EC2/self-hosted steps.

### 13.3 Other deployment

- **Railway + Vercel:** See README and `docs/plans/2026-03-02-railway-deployment.md`. API: Dockerfile `apps/api/Dockerfile`; Web: root or `apps/web`; env and healthchecks as per docs.

---

## 14. Known issues and audit

See **`docs/DEMO_DATA_AND_LIVE_LABEL_AUDIT.md`** for full detail. Summary:

| Area | Issue | Risk |
|------|--------|------|
| **In-Play page** | When API returns no events: hardcoded “247 events live”, fake filters, static sport cards, fake score ticker | High — users see fake “live” counts and non-bettable demo cards |
| **My Bets page** | On API failure: demo bet cards and badge counts (3 open, 2 cashout) | High — looks like real bets |
| **Admin Credits** | On API failure: demo ledger rows and balance 92000 | Medium — admin only |
| **Seed “live” event** | First seed event is `status: 'live'`; when providers fail, GET `/api/sports/live` DB fallback returns it indefinitely | High — one event permanently “live” |
| **Display-list merge** | Old events kept in list if not in fresh feed; only `status === 'ft'` removed; stale “live” possible | Medium |
| **OddsSync simulation** | DB events with `status: 'live'` get simulated clock and fake incidents; not real live data | High — “live” is simulated |
| **Sport event pages** | Default `status \|\| 'live'` and fallback score/clock when API missing | Medium |
| **Gaming / Casino** | Lobby, promotions, racecards are static arrays | Low — labeled as lobby/placeholder |
| **Golf / Esports list** | On list failure redirect to demo route | Medium |

---

## 15. Strengths, gaps, and recommendations

### Strengths

- Clear monorepo layout and separation (api, web, shared).
- Role-based access consistently applied (API + middleware + client guards).
- Centralized auth (JWT + refresh in Redis, cookies, Socket auth).
- Rich sports-data pipeline (multiple providers, normalizer, cache, cron).
- Real-time balance and event watcher support via Socket.IO.
- Standardized API response shape and error handling.
- Docker Compose and docs for local and VPS deployment.
- Some unit tests for auth, bets, credits.

### Gaps

- **Documentation:** No single OpenAPI/Swagger; env vars scattered (README, env.ts). No runbooks for Redis/DB recovery or incidents. Variant vs Next-native UI not fully documented in one place.
- **Testing:** No root-level test script or coverage gate; limited E2E; demo/fallback paths and variant components largely untested.
- **Demo data and “live” labeling:** Multiple fallbacks show fake counts and static content; seed “live” event and OddsSync simulation can mislead users (see audit).
- **Consistency:** Two UI systems increase maintenance and risk of drift (e.g. odds shape `{ label, value }` in variant_home required explicit handling to avoid React “objects as children” error).
- **Production hardening:** Default credentials in seeds; no built-in APM or structured error tracking; rate limits and brute-force TTLs not fully documented.

### Recommendations

1. **Unify live/upcoming data source:** Prefer a single source of truth for “live” (e.g. provider feed or DB updated only by provider/cron); avoid permanent seed “live” and simulated clock in OddsSync for production.
2. **Replace or remove demo fallbacks:** In-Play and My Bets should show empty states or errors when API fails, not fake “247 events” or demo bet cards; Admin Credits should not show hardcoded ledger.
3. **Document env and API:** Single env reference (required vs optional, per app); consider OpenAPI/Swagger for `/api` routes.
4. **Testing:** Add root `npm run test` that runs both workspaces; add E2E for critical flows (login, place bet, cashout); test variant components and fallback paths.
5. **Variant vs Next-native:** Either document the contract (e.g. odds shape, API response) and add tests, or migrate high-traffic pages to Next-native and deprecate variants.
6. **Security:** Document and enforce password change after first login; document rate limits and brute-force behaviour; consider audit logging for credit and privilege changes.

---

*In-depth application analysis — February 2026. Related: ARCHITECTURE_AND_FLOWS.md, BETARENA_APPLICATION_DOCUMENTATION.md, DEMO_DATA_AND_LIVE_LABEL_AUDIT.md, PRODUCTION_READINESS_AUDIT.md.*
