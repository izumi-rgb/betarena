# AI_Rules.md — Rules & Context for Cursor AI

> **Read this before writing a single line of code.**
> This file tells you what kind of project this is, how to think, and what rules are non-negotiable.

---

## 1. What You Are Building

You are building **BetArena** — a demo sports betting platform with fake virtual credits. It looks and behaves like a real betting site (Bet365 style), but no real money is involved. Think of it as a fully-functional simulation platform.

The project uses:
- **Next.js 14** (App Router) for the frontend
- **Node.js + Express** for the REST API backend
- **PostgreSQL** for the primary database (via Knex.js query builder)
- **Redis** for sessions and real-time caching
- **Socket.io** for WebSocket communication (live odds, scores)
- **Zustand** for frontend state management
- **Tailwind CSS + shadcn/ui** for UI components
- **Winston** for structured server-side logging

Everything is in a monorepo under `betarena/`. The frontend is `apps/web`, the backend is `apps/api`, and shared types live in `packages/shared`.

---

## 2. The User Hierarchy — Understand This Deeply

```
Admin (1 account, supreme control)
  └── Agent (created by Admin, gets a numeric ID e.g. "20")
        ├── Member (created by Agent, gets sub-ID e.g. "20_1", "20_2")
        └── Sub-Agent (ONLY if Admin granted the privilege to the Agent)
              └── Member (sub-ID under sub-agent)
                    └── (Sub-agent CANNOT create more sub-agents unless their parent agent explicitly grants it)
```

**Rules you must enforce in code:**
- `can_create_sub_agent` flag on the `users` table controls whether an agent can create sub-agents
- A sub-agent's `can_create_sub_agent` flag is `false` by default — only set to `true` if the parent agent explicitly grants it (and the parent must themselves have that privilege)
- Only the Admin can flip the top-level agent's `can_create_sub_agent` to `true`
- No one can register themselves — there is **no public registration endpoint**

---

## 3. Credit System — Treat This Like a Bank

Credits flow in **one direction only**: Admin → Agent → (Sub-Agent) → Member.

- `POST /api/credits/create` — Admin only. Creates credits out of thin air and adds them to the admin's own credit account.
- `POST /api/credits/transfer` — Transfers from sender's balance to receiver's balance. The sender can only transfer to someone directly below them in their hierarchy.
- **No endpoint should ever allow a non-admin user to create credits.**
- Every credit movement must insert a row in `credit_transactions`.
- Before any transfer: validate that sender has sufficient balance. If not, return `400` with message `"Insufficient credit balance"`.

---

## 4. Security Rules — No Exceptions

### 4.1 SQL Injection
- **All DB queries must use parameterized statements via Knex.** Never concatenate user input into a query string.
- The `sanitize.middleware.ts` must run `sqliDetector` on ALL string fields in every request body and query param.
- If SQLi patterns are detected: log the event with `threat_flag: true`, return `400 Bad Request`, do NOT process the request further.
- Common SQLi patterns to detect: `' OR 1=1`, `--`, `; DROP TABLE`, `UNION SELECT`, `xp_cmdshell`, `EXEC(`, `CAST(`, script tags, etc.

### 4.2 Authentication
- JWT tokens expire in 2 hours. Refresh tokens last 7 days (stored in Redis, revokable).
- Never store tokens in localStorage — use httpOnly cookies.
- Every protected route must pass through `auth.middleware.ts` then `rbac.middleware.ts`.

### 4.3 Rate Limiting
- Login endpoint: max 5 attempts per IP per 15 minutes. On failure, log with IP.
- API endpoints: 100 req/min per user.

### 4.4 Logging
- **Every single user action must be logged** to the `system_logs` table. No exceptions.
- Log format: `{ user_id, role, action, ip_address, user_agent, payload (sanitized), result, threat_flag, created_at }`
- The API's DB user has INSERT-only access on `system_logs`. Never add UPDATE or DELETE.
- Log action names follow this naming convention: `noun.verb` — e.g., `auth.login`, `auth.logout`, `bet.place`, `credit.create`, `credit.transfer`, `user.create`, `privilege.grant`, `sqli.attempt`

---

## 5. Data Privacy Rules

- An agent querying their member list must only see members where `parent_agent_id = agent.id`. Enforce this in the **service layer** using a `WHERE` clause — do not rely on UI filtering alone.
- An agent with sub-agents can see each sub-agent's total credit balance **only** — they cannot see the sub-agent's member list or any member data under the sub-agent.
- The member's nickname (used by agents for internal identification) must **never** be exposed to the member's own API responses.
- Admins can see everything across the platform.

---

## 6. Betting Rules

- When a bet is placed:
  1. Validate the member has sufficient credit balance
  2. Snapshot the odds at the exact moment of placement into `odds_snapshot` (JSONB)
  3. Deduct the stake from the member's `credit_accounts.balance`
  4. Insert the bet row with `status = 'open'`
  5. Log `bet.place` action

- When a bet is settled (by the `betSettlement.job.ts` cron):
  1. Check match result from external API
  2. Calculate winnings based on snapshotted odds
  3. If won: add winnings to member's balance, set `status = 'won'`
  4. If lost: set `status = 'lost'` (stake already deducted)
  5. Log `bet.settle` action

- The `odds_snapshot` field must be an immutable record. Never update it after insert.

---

## 7. Coding Standards

### General
- Use **TypeScript strictly** — no `any` types unless absolutely unavoidable (add a comment explaining why)
- All functions must have proper type signatures
- Use `async/await` — no raw Promise chains
- Handle all errors with try/catch and pass to Express error handler via `next(error)`

### File Naming
- Files: `camelCase.ts` for utilities, `PascalCase.tsx` for React components
- Routes: `noun.routes.ts`, Controllers: `noun.controller.ts`, Services: `noun.service.ts`

### API Response Format
Always return this structure:
```json
{
  "success": true | false,
  "data": {} | [],
  "message": "Human readable message",
  "error": null | "Error detail (dev only)"
}
```

### Environment Variables
Never hardcode secrets. Always read from `process.env` via the `config/env.ts` validator. If a required env var is missing at startup, throw an error and refuse to start.

### Database
- Use Knex.js for all queries — never raw `pg` queries except in migrations
- All timestamps stored as UTC in `TIMESTAMPTZ` columns
- All migrations must be reversible (have both `up` and `down` functions)

---

## 8. Odds & Sports Data Integration

- Use an external sports data API (e.g., SportRadar, API-Football, or BetsAPI via RapidAPI)
- The `odds.sync.ts` job fetches new odds every 5 seconds for live events, every 60 seconds for upcoming
- Cache the latest odds in Redis with key pattern: `odds:{eventId}:{marketType}`
- Push updates to frontend clients via Socket.io room: `event:{eventId}`
- The frontend subscribes to rooms for events the user is viewing

---

## 9. Dashboard Requirements

### Agent Dashboard Must Show:
- Total credits issued to self by admin
- Total credits currently held
- Total credits distributed to members
- Member table: display_id, nickname (private), current balance, total bets, total P&L
- Sub-agent section (if applicable): sub-agent display_id, total credit held by sub-agent
- One-click create member button (auto-generates username + password, shows once)

### Admin Dashboard Must Show:
- Platform-wide: total credits created, total in circulation, total P&L
- Agent list with: ID, balance, member count, sub-agent count, total bet volume
- Drill-down into any agent
- Log viewer with filters: user, action, IP, date range, threat_flag
- Credit creation + assignment panel
- Privilege management panel (toggle `can_create_sub_agent`)
- User suspension controls

---

## 10. What NOT To Do

- ❌ Do not create any public registration endpoint
- ❌ Do not let any non-admin user create credits
- ❌ Do not let an agent see another agent's members
- ❌ Do not use `SELECT *` in production queries — always select specific columns
- ❌ Do not store sensitive data in frontend localStorage
- ❌ Do not delete or update log entries
- ❌ Do not skip logging any user action
- ❌ Do not hardcode API keys or DB credentials
- ❌ Do not write raw string SQL queries with user input concatenated
- ❌ Do not create migrations without a `down()` rollback function
- ❌ Do not expose internal error stack traces to API consumers in production

---

## 11. Dev Environment Setup

```bash
# Start local services
docker-compose up -d        # Postgres + Redis

# Backend
cd apps/api
cp .env.example .env        # Fill in your values
npm install
npm run migrate             # Run all DB migrations
npm run seed                # Create admin account
npm run dev                 # Start API on port 4000

# Frontend
cd apps/web
npm install
npm run dev                 # Start Next.js on port 3000
```

Default admin credentials after seed: check the seed file — credentials are printed to console once and must be changed immediately on first login.
