---
name: BetArena Build Roadmap
overview: Complete step-by-step build plan for BetArena — a demo-currency sports betting platform with a 3-tier hierarchy (Admin/Agent/Member), real-time odds via WebSocket, and full credit system. Monorepo with Next.js 14 frontend, Express API, PostgreSQL, and Redis.
todos:
  - id: step-1
    content: "Step 1: Project Scaffold — monorepo (apps/web, apps/api, packages/shared), docker-compose, Next.js 14, Express, path aliases, .env.example"
    status: completed
  - id: step-2
    content: "Step 2: Database Migrations & Seed — Knex.js setup, 7 migration files (users, credit_accounts, credit_transactions, bets, events, odds, system_logs), admin seed"
    status: completed
  - id: step-3
    content: "Step 3: Core Middleware — logger, sanitize+SQLi detector, rate limiter, JWT auth, RBAC, error handler; wire into app.ts"
    status: completed
  - id: step-4
    content: "Step 4: Auth Module — POST login/logout/refresh, GET /me, brute force protection, no registration endpoint"
    status: completed
  - id: step-5
    content: "Step 5: Admin Agent Management — CRUD agents, suspend/activate, grant/revoke can_create_sub_agent"
    status: completed
  - id: step-6
    content: "Step 6: Agent Sub-Agent & Member Management — create members/sub-agents, privacy isolation, credentials shown once"
    status: completed
  - id: step-7
    content: "Step 7: Credit Management — admin credit creation, hierarchical transfer (atomic), balance/transaction endpoints"
    status: completed
  - id: step-8
    content: "Step 8: Sports API Integration — external API client, odds.sync.ts, cron scheduler, Redis cache, sports/events/markets endpoints"
    status: completed
  - id: step-9
    content: "Step 9: WebSocket Odds Push — Socket.io server/client, event rooms, useOdds hook, Zustand integration"
    status: completed
  - id: step-10
    content: "Step 10: Bet Placement — Zustand bet slip store, BetSlip/OddsButton components, POST /api/bets with odds snapshot"
    status: completed
  - id: step-11
    content: "Step 11: Bet Settlement — betSettlement.job.ts cron, auto-settle on match finish, credit winners, handle voids"
    status: completed
  - id: step-12
    content: "Step 12: Extended Bet Types — System bets, Each-Way, Asian Handicap, Over/Under; validator + settlement updates"
    status: completed
  - id: step-13
    content: "Step 13: Member Betting UI — sports lobby, event detail, live page, my-bets, account, LiveMatchTracker, odds format toggle"
    status: completed
  - id: step-14
    content: "Step 14: Agent Dashboard UI — stats, member table, create member modal, sub-agents, credits, reports, sidebar nav"
    status: in_progress
  - id: step-15
    content: "Step 15: Admin Dashboard UI — overview, agents/members lists, credits panel, privileges, logs viewer, settings"
    status: pending
  - id: step-16
    content: "Step 16: Login Page & Auth Flow — login form, role-based redirect, httpOnly cookie, brute force message, logout"
    status: pending
  - id: step-17
    content: "Step 17: Security Audit — SQLi tests, brute force tests, RBAC verification, privacy isolation, helmet.js, CORS, Winston"
    status: pending
  - id: step-18
    content: "Step 18: VPS Deployment — Ubuntu setup, Node/Postgres/Redis/Nginx, PM2, reverse proxy, production migrations"
    status: pending
  - id: step-19
    content: "Step 19: Domain & SSL — DNS, Certbot, Nginx HTTPS, CORS/API URL updates, full HTTPS testing"
    status: pending
isProject: false
---

# BetArena — Step-by-Step Build Roadmap

> **RULE: Complete one step fully before moving to the next.**
> Each step has clear Done Criteria. Do not proceed until all criteria are met.

---

## PHASE 1 — Foundation and Infrastructure

### Step 1: Project Scaffold and Dev Environment

**Goal:** Get the monorepo running with the database ready.

**Monorepo structure** ([Architecture.md](Architecture.md) Section 2):

```
betarena/
  apps/web/          -- Next.js 14 (App Router)
  apps/api/          -- Express + TypeScript
  packages/shared/   -- Shared types, constants, utils
  docker-compose.yml -- PostgreSQL 15 + Redis 7
  .env.example
```

**Tasks:**

- Initialize monorepo root with npm workspaces pointing to `apps/`* and `packages/*`
- Create `docker-compose.yml` with PostgreSQL 15 + Redis 7 containers
- Initialize Next.js 14 in `apps/web` with TypeScript, Tailwind CSS, shadcn/ui
- Initialize Express + TypeScript in `apps/api` with `ts-node-dev` for hot reload
- Set up `packages/shared` with shared TypeScript types and barrel export
- Configure path aliases in both `tsconfig.json` files (`@shared/*`)
- Create `.env.example` with all required environment variable keys documented

**Done Criteria:** Both servers run (`web` on :3000, `api` on :4000), DB is up via Docker, monorepo structure matches Architecture.md exactly.

---

### Step 2: Database Migrations and Seed

**Goal:** All tables created and an admin account seeded.

**Schema** ([Architecture.md](Architecture.md) Section 5) defines 7 tables:

- `users` — roles: admin, agent, sub_agent, member; hierarchy via `parent_agent_id`
- `credit_accounts` — balance per user
- `credit_transactions` — full ledger of every transfer
- `bets` — bet slip with JSONB `odds_snapshot` and `selections`
- `events` — synced from external sports API
- `odds` — market data per event
- `system_logs` — INSERT-only immutable audit log

**Tasks:**

- Set up Knex.js with PostgreSQL connection in `apps/api/src/config/database.ts`
- Write 7 migration files (users, credit_accounts, credit_transactions, bets, events, odds, system_logs)
- The `system_logs` migration must restrict the API DB role to INSERT-only (no UPDATE/DELETE)
- Write seed: create admin user with hashed password, `display_id = "1"`, `role = "admin"`, plus `credit_accounts` row
- Run migrations and seed successfully

**Done Criteria:** All 7 migrations run clean. Admin seed works. DB schema matches Architecture.md exactly. `system_logs` is INSERT-only at the DB permission level.

---

### Step 3: Core Middleware Stack

**Goal:** Auth, security, logging, and error handling middleware in place.

**Middleware files** in `apps/api/src/middleware/`:

- `logger.middleware.ts` — logs every request (method, path, IP, user-agent, timestamp)
- `sanitize.middleware.ts` — input sanitization + SQLi pattern detection (flag, block, log)
- `rateLimiter.middleware.ts` — 5 attempts/15min on login, 100 req/min on other routes
- `auth.middleware.ts` — JWT verification, attach user to `req.user`
- `rbac.middleware.ts` — role-based route protection
- `errorHandler.middleware.ts` — catch-all, structured error response, no stack trace in prod

**Supporting utility:** `apps/api/src/utils/sqliDetector.ts` — regex library for common SQLi patterns (`' OR 1=1`, `--`, `; DROP TABLE`, `UNION SELECT`, etc.)

**Tasks:**

- Implement all 6 middleware files
- Implement `sqliDetector.ts` utility
- Wire all middleware into `app.ts` in correct order
- Test: send a SQLi string in request body and confirm it is blocked and logged

**Done Criteria:** All middleware wired. SQLi detection blocks and logs malicious input. JWT auth works. Unauthorized requests return 401.

---

## PHASE 2 — User and Auth System

### Step 4: Authentication Module

**Goal:** Login, logout, token refresh — no registration.

**Endpoints:**

- `POST /api/auth/login` — validates credentials, returns JWT + sets refresh token in httpOnly cookie
- `POST /api/auth/logout` — invalidates refresh token in Redis
- `POST /api/auth/refresh` — issues new JWT from valid refresh token
- `GET /api/auth/me` — returns current user info (no password, no nickname to self)

**Security rules** ([AI_Rules.md](AI_Rules.md) Section 4.2):

- JWT expires in 2 hours, refresh token lasts 7 days (stored in Redis)
- Tokens stored in httpOnly cookies, never localStorage
- 5 consecutive failures from same IP: block for 15 min, log as `auth.brute_force`
- No registration endpoint exists anywhere

**Done Criteria:** Login works, logout invalidates session, refresh works, brute force blocking works, all events logged.

---

### Step 5: Admin — Agent Management

**Goal:** Admin can create and manage agents.

**Endpoints:**

- `POST /api/admin/agents` — create agent (auto-generate `display_id`, username, password, credit_account)
- `GET /api/admin/agents` — list all agents with balance, member count, sub-agent count
- `GET /api/admin/agents/:id` — agent detail
- `PATCH /api/admin/agents/:id/status` — activate/suspend
- `PATCH /api/admin/agents/:id/privilege` — grant/revoke `can_create_sub_agent`

**Done Criteria:** Admin can create, list, view, suspend, and manage privileges for agents. All actions logged.

---

### Step 6: Agent — Sub-Agent and Member Management

**Goal:** Agents create members. Master agents create sub-agents.

**Endpoints:**

- `POST /api/agents/members` — create member (auto-generate username, password, `display_id` as `{agentId}_{sequence}`)
- `GET /api/agents/members` — list agent's own members only (scoped by `parent_agent_id`)
- `GET /api/agents/members/:id` — member detail (credit, bets, P&L)
- `POST /api/agents/sub-agents` — create sub-agent (requires `can_create_sub_agent = true`)
- `GET /api/agents/sub-agents` — list own sub-agents with credit balance (no member list visibility)
- `PATCH /api/agents/sub-agents/:id/privilege` — grant sub-agent creation rights (cascading privilege check)

**Privacy isolation** ([AI_Rules.md](AI_Rules.md) Section 5): agent queries scoped by `parent_agent_id = current_user.id` in the **service layer**, not just UI. Sub-agent member data is invisible to parent agent.

**Done Criteria:** Full user creation flow works. Privacy isolation verified. Credentials shown once on creation.

---

## PHASE 3 — Credit System

### Step 7: Credit Management

**Goal:** Credit creation (admin) and distribution (agents) fully working.

**Endpoints:**

- `POST /api/admin/credits/create` — admin creates credits, adds to admin balance, logs `credit.create`
- `POST /api/credits/transfer` — transfer to direct subordinate only (atomic DB transaction)
- `GET /api/credits/balance` — current user's balance
- `GET /api/credits/transactions` — paginated transaction history
- `GET /api/admin/credits/overview` — admin view: total created, in circulation, by agent

**Credit flow** ([AI_Rules.md](AI_Rules.md) Section 3): Admin -> Agent -> Sub-Agent -> Member. One direction only. All transfers use DB transactions for atomicity (deduct sender + credit receiver in one transaction).

**Done Criteria:** Credit flow works end-to-end. No credit leaks. All transactions recorded. Atomic transfers.

---

## PHASE 4 — Odds and Sports Data

### Step 8: External Sports API Integration

**Goal:** Sports events and odds pulled from real data source and stored.

**Tasks:**

- Set up API client for sports data provider (SportRadar / API-Football / BetsAPI via RapidAPI)
- `odds.sync.ts` — fetch live events + odds, upsert into `events` and `odds` tables
- `scheduler.ts` — run sync every 5s for live, 60s for pre-match using node-cron
- Cache latest odds in Redis: key `odds:{eventId}:{marketType}`, TTL 10s
- `GET /api/sports` — list available sports
- `GET /api/sports/:sport/events` — list events by sport (live + upcoming)
- `GET /api/events/:id/markets` — return all markets + odds (Redis cache first, DB fallback)

**Done Criteria:** Events and odds in DB. API endpoints return correct data. Redis cache working. Cron jobs running.

---

### Step 9: WebSocket — Real-Time Odds Push

**Goal:** Frontend clients receive live odds updates via Socket.io.

**Tasks:**

- Set up Socket.io server in `apps/api/src/socket.ts`
- Clients join rooms: `event:{eventId}`
- Odds sync job emits `odds:update` to event room on change
- Set up Socket.io client in `apps/web/src/lib/socket.ts`
- `useOdds.ts` hook — subscribe to room, update Zustand store on `odds:update`

**Done Criteria:** Odds update in browser within seconds of change without page reload.

---

## PHASE 5 — Betting Engine

### Step 10: Bet Placement and Slip

**Goal:** Members can build a bet slip and place bets.

**Frontend components:**

- `useBetSlip.ts` Zustand store — add/remove selections, calculate potential payout
- `BetSlip.tsx` — display selections, stake input, potential win, place bet button
- `OddsButton.tsx` — clicking adds selection to bet slip, highlights if selected

**Backend:** `POST /api/bets` — validate balance, snapshot odds, deduct stake, insert bet, log `bet.place`. Support Single and Accumulator types.

**Done Criteria:** Member can add selections, enter stake, place bet, see balance deducted, see bet in history.

---

### Step 11: Bet Settlement

**Goal:** Bets are auto-settled when matches finish.

**Tasks:**

- `betSettlement.job.ts` — runs every 60s, finds `open` bets on finished events
- Evaluate selections against match result
- Won: add `actual_win` to member balance, insert credit_transaction
- Lost: set `status = 'lost'` (stake already deducted)
- Void: return stake, set `status = 'void'`
- Log `bet.settle` for each

**Done Criteria:** Bets auto-settle correctly. Winners receive credits. All settlements logged.

---

### Step 12: Extended Bet Types

**Goal:** Add System bets, Each-Way, Asian Handicap, Over/Under beyond Single and Accumulator.

- Update `bets.validator.ts` for each type
- Update bet slip UI for each-way toggle
- Update settlement logic per type
- Test each type end-to-end

**Done Criteria:** All listed bet types can be placed and settled correctly.

---

## PHASE 6 — Frontend UI

### Step 13: Member Betting UI

**Goal:** Bet365-style betting interface for members.

**Pages** ([Architecture.md](Architecture.md) Section 3):

- `/sports` — sport tabs, event list, live badge
- `/sports/[sportId]/[eventId]` — all markets, live odds via WebSocket
- `/live` — live events only, real-time
- `/my-bets` — open and settled bets, filter by status
- `/account` — balance, transaction history

**Components:** `LiveMatchTracker.tsx`, odds format toggle (Decimal/Fractional/American), responsive layout.

**Done Criteria:** Full betting interface works with live odds, bet placement, and history. Modern, polished UI.

---

### Step 14: Agent Dashboard UI

**Goal:** Clean, data-rich agent dashboard.

**Pages:**

- `/agent/dashboard` — stat cards: credits held, given out, member count, P&L
- `/agent/members` — table with display_id, balance, open bets, P&L, status
- `/agent/sub-agents` — sub-agent list (if privileged)
- `/agent/credits` — transfer form, transaction history
- `/agent/reports` — P&L chart, activity summary

**Features:** Create Member modal (one-click, show credentials once with copy), sidebar navigation.

**Done Criteria:** Agent dashboard fully functional with accurate data. Professional look.

---

### Step 15: Admin Dashboard UI

**Goal:** Comprehensive admin control center.

**Pages:**

- `/admin/dashboard` — platform overview: total credits, bets, P&L
- `/admin/users/agents` — full agent list, drill-down, suspend, privilege toggle
- `/admin/users/members` — all members across platform
- `/admin/credits` — create credits, assign to agent, full ledger
- `/admin/privileges` — master agent management
- `/admin/logs` — filterable log table with threat flag badges
- `/admin/settings` — platform settings

**Done Criteria:** Admin can manage every aspect through the dashboard. Logs are searchable and flag threats.

---

## PHASE 7 — Login Page and Auth Flow

### Step 16: Login Page UI and Auth Flow

**Goal:** Single entry point to the platform.

- `/login` — username + password form, no sign-up link
- On success: redirect by role (`/admin/dashboard`, `/agent/dashboard`, `/sports`)
- Token in httpOnly cookie
- Generic error on failure (don't reveal which field is wrong)
- After 5 failures: "too many attempts" message
- Logout clears cookie, redirects to `/login`

**Done Criteria:** Login works for all three roles, redirects correctly, failed attempts handled securely.

---

## PHASE 8 — Security Hardening and Testing

### Step 17: Security Audit and Hardening

**Goal:** Lock everything down before deployment.

- Test SQLi attempts on all input fields — confirm blocked and logged
- Test brute force on login — confirm lockout
- Verify RBAC on all routes (agent/member cannot access admin routes)
- Verify privacy isolation (agent cannot see another agent's members)
- Verify credit_accounts cannot be manipulated outside proper transfer flow
- Verify system_logs cannot be updated or deleted at DB level
- No passwords or nicknames exposed to wrong roles in responses
- Add `helmet.js` for security headers
- Configure CORS (frontend origin only)
- Replace all `console.log` with Winston logger

**Done Criteria:** All security checks pass. No unauthorized access possible. Logs capture all threats.

---

## PHASE 9 — VPS Deployment

### Step 18: VPS Setup and Deployment

**Goal:** Run the platform on the 8GB RAM VPS.

- Set up Ubuntu server (firewall with UFW)
- Install Node.js 20, PostgreSQL 15, Redis 7, Nginx
- PM2 for process management (API + cron jobs)
- Nginx reverse proxy (port 80 -> Next.js :3000, /api -> Express :4000)
- Run DB migrations + admin seed on production
- Set production env vars (never commit `.env`)
- PM2 startup for reboot persistence

**Done Criteria:** Platform runs on VPS, accessible via IP, all features work in production.

---

### Step 19: Domain and SSL

**Goal:** Secure production deployment with HTTPS.

- Point DNS A record to VPS IP
- Certbot (Let's Encrypt) for SSL
- Nginx HTTPS config, redirect HTTP -> HTTPS
- Update CORS_ORIGIN and NEXT_PUBLIC_API_URL to domain
- Test all features over HTTPS

**Done Criteria:** Site accessible at `https://yourdomain.com` with valid SSL. All features work.

---

## Phase Summary

- Phase 1 (Steps 1-3): Monorepo, DB, Middleware
- Phase 2 (Steps 4-6): Auth, Users, Hierarchy
- Phase 3 (Step 7): Credit System
- Phase 4 (Steps 8-9): Sports Data, WebSocket
- Phase 5 (Steps 10-12): Betting Engine
- Phase 6 (Steps 13-15): All Frontend UIs
- Phase 7 (Step 16): Login and Auth Flow
- Phase 8 (Step 17): Security Hardening
- Phase 9 (Steps 18-19): VPS and Domain Deploy

**Total: 19 Steps. Complete each before moving to the next.**