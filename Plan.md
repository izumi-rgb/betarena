# Plan.md — Step-by-Step Build Roadmap

> **RULE: Complete one step fully before moving to the next.**
> Each step has a clear ✅ Done Criteria. Do not proceed until all criteria are met.
> When a step is done, mark it `[x]` and move on.

---

## PHASE 1 — Foundation & Infrastructure

### Step 1: Project Scaffold & Dev Environment
**Goal:** Get the monorepo running with the database ready.

Tasks:
- [ ] Initialize monorepo with `apps/web`, `apps/api`, `packages/shared`
- [ ] Set up `docker-compose.yml` with PostgreSQL 15 + Redis 7
- [ ] Initialize Next.js 14 in `apps/web` with TypeScript, Tailwind CSS, shadcn/ui
- [ ] Initialize Express + TypeScript in `apps/api`
- [ ] Set up `packages/shared` with shared TypeScript types
- [ ] Configure path aliases in both tsconfig files
- [ ] Create `.env.example` with all required environment variable keys documented
- [ ] Verify: `docker-compose up` starts Postgres + Redis without errors
- [ ] Verify: `npm run dev` in `apps/api` starts server on port 4000
- [ ] Verify: `npm run dev` in `apps/web` starts Next.js on port 3000

✅ **Done Criteria:** Both servers run, DB is up, monorepo structure matches Architecture.md exactly.

---

### Step 2: Database Migrations & Seed
**Goal:** All tables created and an admin account seeded.

Tasks:
- [ ] Set up Knex.js with PostgreSQL connection in `apps/api/src/config/database.ts`
- [ ] Write migration `001_create_users.sql` — `users` table
- [ ] Write migration `002_create_credit_accounts.sql` — `credit_accounts` table
- [ ] Write migration `003_create_credit_transactions.sql` — `credit_transactions` table
- [ ] Write migration `004_create_bets.sql` — `bets` table
- [ ] Write migration `005_create_events.sql` — `events` table
- [ ] Write migration `006_create_odds.sql` — `odds` table
- [ ] Write migration `007_create_system_logs.sql` — `system_logs` table (INSERT-only at DB permission level)
- [ ] Write seed: create admin user with hashed password, display_id = `"1"`, role = `"admin"`, credit_account row created
- [ ] Run migrations and seed successfully
- [ ] Verify: all tables exist in Postgres with correct columns and constraints

✅ **Done Criteria:** All 7 migrations run clean, admin seed works, DB schema matches Architecture.md schema exactly.

---

### Step 3: Core Middleware Stack
**Goal:** Auth, security, logging, and error handling middleware in place.

Tasks:
- [ ] `logger.middleware.ts` — logs every request (method, path, IP, user-agent, timestamp)
- [ ] `sanitize.middleware.ts` — input sanitization + SQLi pattern detection (flag + block + log on match)
- [ ] `sqliDetector.ts` utility — regex library for common SQLi patterns
- [ ] `rateLimiter.middleware.ts` — 5 attempts/15min on login, 100 req/min on other routes
- [ ] `auth.middleware.ts` — JWT verification, attach user to `req.user`
- [ ] `rbac.middleware.ts` — role-based route protection
- [ ] `errorHandler.middleware.ts` — catch-all, structured error response, no stack trace in production
- [ ] Wire all middleware into `app.ts` in correct order
- [ ] Test: send a SQLi string in request body → confirm it is blocked and logged

✅ **Done Criteria:** All middleware wired, SQLi detection works, JWT auth works, unauthorized requests return 401.

---

## PHASE 2 — User & Auth System

### Step 4: Authentication Module
**Goal:** Login, logout, token refresh — no registration.

Tasks:
- [ ] `POST /api/auth/login` — validates credentials, returns JWT + sets refresh token in httpOnly cookie
- [ ] `POST /api/auth/logout` — invalidates refresh token in Redis
- [ ] `POST /api/auth/refresh` — issues new JWT from valid refresh token
- [ ] `GET /api/auth/me` — returns current user info (no password, no nickname exposure to self)
- [ ] Log every login attempt (success/failure) with IP and user-agent
- [ ] On 5 consecutive failures from same IP: block for 15 min, log as `auth.brute_force`
- [ ] No registration endpoint exists anywhere

✅ **Done Criteria:** Login works, logout invalidates session, refresh works, brute force blocking works, all events logged.

---

### Step 5: Admin — Agent Management
**Goal:** Admin can create and manage agents.

Tasks:
- [ ] `POST /api/admin/agents` — create agent (Admin only). Auto-generate display_id (next integer), auto-generate username + password, create credit_account row
- [ ] `GET /api/admin/agents` — list all agents with balance, member count, sub-agent count
- [ ] `GET /api/admin/agents/:id` — agent detail
- [ ] `PATCH /api/admin/agents/:id/status` — activate / suspend agent
- [ ] `PATCH /api/admin/agents/:id/privilege` — grant/revoke `can_create_sub_agent`
- [ ] All actions logged with correct action names

✅ **Done Criteria:** Admin can create, list, view, suspend, and manage privileges for agents. All logged.

---

### Step 6: Agent — Sub-Agent & Member Management
**Goal:** Agents can create members. Master agents can create sub-agents.

Tasks:
- [ ] `POST /api/agents/members` — create member (Agent or Sub-Agent). Auto-generate username + password + display_id (`agentId_sequence`). Optional nickname stored server-side only.
- [ ] `GET /api/agents/members` — list agent's own members only (scoped by `parent_agent_id`)
- [ ] `GET /api/agents/members/:id` — member detail (credit, bets, P&L)
- [ ] `POST /api/agents/sub-agents` — create sub-agent (requires `can_create_sub_agent = true`). Generate sub-agent ID.
- [ ] `GET /api/agents/sub-agents` — list own sub-agents with credit balance (no member list)
- [ ] `PATCH /api/agents/sub-agents/:id/privilege` — grant sub-agent the right to create sub-agents (only if calling agent has that right)
- [ ] Member creation returns credentials in response body **once** — after that they cannot be retrieved again
- [ ] All actions logged

✅ **Done Criteria:** Full user creation flow works. Privacy isolation verified (agent cannot query another agent's members). Credentials shown once.

---

## PHASE 3 — Credit System

### Step 7: Credit Management
**Goal:** Credit creation (admin) and distribution (agents) fully working.

Tasks:
- [ ] `POST /api/admin/credits/create` — Admin creates credits, adds to admin's credit_account balance, logs `credit.create`
- [ ] `POST /api/credits/transfer` — Transfer credits from sender to direct subordinate only. Validates balance, inserts `credit_transactions` row, updates both balances atomically (use DB transaction), logs `credit.transfer`
- [ ] `GET /api/credits/balance` — Returns current user's balance
- [ ] `GET /api/credits/transactions` — Returns current user's transaction history (paginated)
- [ ] `GET /api/admin/credits/overview` — Admin view: total created, total in circulation, total by agent
- [ ] Enforce: non-admin cannot hit `/admin/credits/create`
- [ ] Enforce: sender can only send to their direct children in hierarchy

✅ **Done Criteria:** Credit flow works end-to-end Admin → Agent → Member. No credit leaks. All transactions recorded. Atomic transfers (no partial states).

---

## PHASE 4 — Odds & Sports Data

### Step 8: External Sports API Integration
**Goal:** Sports events and odds pulled from real data source and stored.

Tasks:
- [ ] Set up API client for chosen sports data provider (SportRadar / API-Football / BetsAPI)
- [ ] `odds.sync.ts` — fetch live events + odds and upsert into `events` and `odds` tables
- [ ] `scheduler.ts` — run sync every 5s for live, 60s for pre-match using node-cron
- [ ] Cache latest odds in Redis: key `odds:{eventId}:{marketType}`, TTL 10s
- [ ] `GET /api/sports` — list available sports
- [ ] `GET /api/sports/:sport/events` — list events by sport (live + upcoming)
- [ ] `GET /api/events/:id/markets` — return all markets + odds for an event (from Redis cache first, DB fallback)
- [ ] Verify odds update in near real-time for a live event

✅ **Done Criteria:** Events and odds are in DB. API endpoints return correct market data. Redis cache is working. Cron jobs running.

---

### Step 9: WebSocket — Real-Time Odds Push
**Goal:** Frontend clients receive live odds updates via Socket.io.

Tasks:
- [ ] Set up Socket.io server in `apps/api/src/socket.ts`
- [ ] Client can join a room: `socket.join('event:{eventId}')`
- [ ] When odds sync job fetches new odds and detects a change: emit `odds:update` to the event room with the new odds payload
- [ ] Set up Socket.io client in `apps/web/src/lib/socket.ts`
- [ ] `useOdds.ts` hook — subscribe to a room, update local Zustand state on `odds:update`
- [ ] Test: open two browser windows, observe odds updating live

✅ **Done Criteria:** Odds update in the browser within seconds of change without page reload.

---

## PHASE 5 — Betting Engine

### Step 10: Bet Placement & Slip
**Goal:** Members can build a bet slip and place bets.

Tasks:
- [ ] `useBetSlip.ts` Zustand store — add/remove selections, calculate potential payout, clear slip
- [ ] `BetSlip.tsx` component — display selections, stake input, potential win, place bet button
- [ ] `OddsButton.tsx` — clicking adds selection to bet slip, highlights if selected
- [ ] `POST /api/bets` — place bet endpoint:
  - Validate member has enough balance
  - Snapshot current odds from Redis/DB
  - Deduct stake from balance
  - Insert bet row
  - Log `bet.place`
- [ ] Support bet types: Single and Accumulator (Parlay) in this step
- [ ] Return bet confirmation with bet ID and potential win

✅ **Done Criteria:** Member can add selections, enter stake, see potential win, place bet, see balance deducted, see bet in their history.

---

### Step 11: Bet Settlement
**Goal:** Bets are auto-settled when matches finish.

Tasks:
- [ ] `betSettlement.job.ts` — runs every 60s, finds `open` bets on events with `status = 'finished'`
- [ ] For each unsettled bet: fetch match result, evaluate selections against result
- [ ] Calculate winnings (stake × total odds if all selections win for accumulator)
- [ ] Update bet `status` to `won` or `lost`, set `actual_win`, set `settled_at`
- [ ] If won: add `actual_win` to member's credit balance, insert credit_transaction row
- [ ] Log `bet.settle` for each settled bet
- [ ] Handle edge case: voided events (return stake, set status `void`)

✅ **Done Criteria:** Bets auto-settle correctly. Winners receive credits. All settlements logged.

---

### Step 12: Extended Bet Types
**Goal:** Add remaining bet types beyond Single and Accumulator.

Tasks:
- [ ] System bets (e.g., Trixie, Patent, Yankee)
- [ ] Each-Way bets
- [ ] Asian Handicap
- [ ] Over/Under
- [ ] Update `bets.validator.ts` to handle each type
- [ ] Update bet slip UI for each-way toggle
- [ ] Update settlement logic for each type
- [ ] Test each type end-to-end

✅ **Done Criteria:** All listed bet types can be placed and settled correctly.

---

## PHASE 6 — Frontend UI

### Step 13: Member Betting UI
**Goal:** Full Bet365-style betting interface for members.

Tasks:
- [ ] Sports lobby page (`/sports`) — sport tabs, event list, live badge
- [ ] Event detail page (`/sports/[sportId]/[eventId]`) — all markets, live odds with WebSocket update
- [ ] Live betting page (`/live`) — live events only, real-time
- [ ] My Bets page (`/my-bets`) — open bets, settled history, filter by status
- [ ] Account page (`/account`) — balance, transaction history
- [ ] `LiveMatchTracker.tsx` — score + time + key events (from data feed)
- [ ] Odds format toggle (Decimal / Fractional / American) in navbar
- [ ] Fully responsive layout (works on mobile browsers)

✅ **Done Criteria:** Member can navigate the full betting interface, see live odds, place bets, and view their history. UI looks modern and polished.

---

### Step 14: Agent Dashboard UI
**Goal:** Clean, data-rich agent dashboard.

Tasks:
- [ ] Agent home (`/agent/dashboard`) — stat cards: credits held, credits given out, member count, total P&L
- [ ] Members page (`/agent/members`) — table: display_id, credit balance, open bets, P&L, status
- [ ] Create Member modal — one-click generate, show credentials once with copy button
- [ ] Sub-Agents page (`/agent/sub-agents`) — only if privileged: sub-agent list with credit balance
- [ ] Credits page (`/agent/credits`) — transfer credits form, transaction history
- [ ] Reports page (`/agent/reports`) — P&L chart, activity summary
- [ ] Sidebar navigation with role-appropriate links

✅ **Done Criteria:** Agent dashboard is fully functional and data is accurate. Looks professional.

---

### Step 15: Admin Dashboard UI
**Goal:** Comprehensive admin control center.

Tasks:
- [ ] Admin home (`/admin/dashboard`) — platform overview: total credits created, in circulation, total bets, total P&L
- [ ] Agents page (`/admin/users/agents`) — full agent list, drill-down, suspend button, privilege toggle
- [ ] Members page (`/admin/users/members`) — all members across platform
- [ ] Credits page (`/admin/credits`) — create credits form, assign to agent form, full ledger table
- [ ] Privileges page (`/admin/privileges`) — master agent management
- [ ] Logs page (`/admin/logs`) — filterable log table: user, action, date, IP, result, threat flag badge
- [ ] Settings page — basic platform settings
- [ ] Real-time widgets where relevant (e.g., live bet counter)

✅ **Done Criteria:** Admin can manage every aspect of the platform through the dashboard. Logs are searchable and clearly flag threats.

---

## PHASE 7 — Login Page & Auth Flow

### Step 16: Login Page UI & Auth Flow
**Goal:** The single entry point to the platform.

Tasks:
- [ ] Login page (`/login`) — username + password form, no sign-up link
- [ ] On success: redirect to role-appropriate dashboard (`/admin/dashboard`, `/agent/dashboard`, `/sports`)
- [ ] Token stored in httpOnly cookie, not localStorage
- [ ] Failed login: show generic error (don't reveal if username or password is wrong)
- [ ] After 5 failures: show "too many attempts" message
- [ ] Logout clears cookie and redirects to login

✅ **Done Criteria:** Login works for all three roles, redirects correctly, failed attempts handled securely.

---

## PHASE 8 — Security Hardening & Testing

### Step 17: Security Audit & Hardening
**Goal:** Lock everything down before VPS deployment.

Tasks:
- [ ] Manually test SQLi attempts on all input fields — confirm they are blocked and logged
- [ ] Test brute force on login — confirm lockout triggers
- [ ] Verify all API routes have correct RBAC (try accessing admin routes as agent/member — expect 403)
- [ ] Verify agent cannot see another agent's members (try with different JWT tokens)
- [ ] Verify credit_accounts cannot be manipulated except through proper transfer flow
- [ ] Verify system_logs table cannot be updated or deleted (test at DB level)
- [ ] Check all response bodies — no passwords, no nicknames exposed to wrong roles
- [ ] Add `helmet.js` to Express for security headers
- [ ] Configure CORS properly (only allow frontend origin)
- [ ] Review all `console.log` statements — replace with Winston logger

✅ **Done Criteria:** All security checks pass. No unauthorized access possible. Logs capture all threats.

---

## PHASE 9 — VPS Deployment

### Step 18: VPS Setup & Deployment
**Goal:** Run the platform on the 8GB RAM VPS.

Tasks:
- [ ] Set up Ubuntu server (update packages, configure firewall with UFW)
- [ ] Install Node.js 20, PostgreSQL 15, Redis 7, Nginx
- [ ] Set up PM2 for process management (API server + cron jobs)
- [ ] Configure Nginx as reverse proxy (port 80 → Next.js :3000, /api → Express :4000)
- [ ] Run DB migrations on production Postgres
- [ ] Run admin seed on production
- [ ] Set all production environment variables (never commit `.env` to git)
- [ ] Test full flow on VPS IP address
- [ ] Configure PM2 startup so services restart on reboot

✅ **Done Criteria:** Platform runs on VPS, accessible via IP, all features work in production mode.

---

### Step 19: Domain & SSL (When Domain is Ready)
**Goal:** Secure production deployment with HTTPS.

Tasks:
- [ ] Point domain DNS A record to VPS IP
- [ ] Install Certbot (Let's Encrypt) and generate SSL certificate
- [ ] Update Nginx config for HTTPS with SSL certificate
- [ ] Redirect HTTP → HTTPS
- [ ] Update `CORS_ORIGIN` env var to use `https://yourdomain.com`
- [ ] Update frontend `NEXT_PUBLIC_API_URL` to use domain
- [ ] Test all features over HTTPS

✅ **Done Criteria:** Site accessible at `https://yourdomain.com` with valid SSL. All features work over HTTPS.

---

## Summary Table

| Phase | Steps | Focus |
|-------|-------|-------|
| 1 | 1–3 | Monorepo, DB, Middleware |
| 2 | 4–6 | Auth, Users, Hierarchy |
| 3 | 7 | Credit System |
| 4 | 8–9 | Sports Data, WebSocket |
| 5 | 10–12 | Betting Engine |
| 6 | 13–15 | All Frontend UIs |
| 7 | 16 | Login & Auth Flow |
| 8 | 17 | Security Hardening |
| 9 | 18–19 | VPS & Domain Deploy |

**Total Steps: 19**

> Start with Step 1. Don't skip ahead. Each step builds on the last.
