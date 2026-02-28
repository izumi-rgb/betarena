# Architecture.md — System Architecture & Folder Structure

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│              Next.js 14 (App Router)                    │
│         Tailwind CSS + shadcn/ui + Socket.io-client     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP + WebSocket
┌────────────────────────▼────────────────────────────────┐
│                    API SERVER                           │
│              Node.js + Express.js                       │
│         REST API + Socket.io Server                     │
│         JWT Auth Middleware + RBAC + Rate Limiter       │
│         Security Middleware (SQLi detection, sanitize)  │
└────┬────────────────────┬────────────────────────────────┘
     │                    │
┌────▼────┐          ┌────▼────┐
│Postgres │          │  Redis  │
│Primary  │          │Sessions │
│Database │          │+ Cache  │
└─────────┘          └─────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              External Odds/Sports Data API              │
│   (SportRadar / API-Football / BetsAPI via RapidAPI)    │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Repository Structure

```
betarena/
├── apps/
│   ├── web/                         # Next.js Frontend
│   └── api/                         # Express Backend
├── packages/
│   └── shared/                      # Shared types, constants, utils
├── docker-compose.yml               # Local dev (Postgres + Redis)
├── .env.example
└── README.md
```

---

## 3. Frontend Structure (`apps/web/`)

```
apps/web/
├── public/
│   └── assets/                      # Static images, logos, icons
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx         # Login page (only entry point)
│   │   ├── (member)/                # Member-facing betting UI
│   │   │   ├── layout.tsx
│   │   │   ├── sports/
│   │   │   │   ├── page.tsx         # Sports lobby
│   │   │   │   └── [sportId]/
│   │   │   │       └── page.tsx     # Sport detail + markets
│   │   │   ├── live/
│   │   │   │   └── page.tsx         # Live betting page
│   │   │   ├── my-bets/
│   │   │   │   └── page.tsx         # Bet history
│   │   │   └── account/
│   │   │       └── page.tsx         # Balance + transactions
│   │   ├── (agent)/                 # Agent Dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # Agent home
│   │   │   ├── members/
│   │   │   │   ├── page.tsx         # Member list
│   │   │   │   └── create/
│   │   │   │       └── page.tsx     # Create member session
│   │   │   ├── sub-agents/
│   │   │   │   └── page.tsx         # Sub-agent list (if privileged)
│   │   │   ├── credits/
│   │   │   │   └── page.tsx         # Credit transfer panel
│   │   │   └── reports/
│   │   │       └── page.tsx         # P&L, activity reports
│   │   └── (admin)/                 # Admin Dashboard
│   │       ├── layout.tsx
│   │       ├── dashboard/
│   │       │   └── page.tsx         # Admin home overview
│   │       ├── users/
│   │       │   ├── agents/
│   │       │   │   └── page.tsx     # All agents
│   │       │   └── members/
│   │       │       └── page.tsx     # All members
│   │       ├── credits/
│   │       │   └── page.tsx         # Create + distribute credits
│   │       ├── privileges/
│   │       │   └── page.tsx         # Grant/revoke master agent rights
│   │       ├── logs/
│   │       │   └── page.tsx         # System log viewer
│   │       └── settings/
│   │           └── page.tsx         # Platform settings
│   ├── components/
│   │   ├── ui/                      # shadcn/ui base components
│   │   ├── betting/
│   │   │   ├── BetSlip.tsx
│   │   │   ├── OddsButton.tsx
│   │   │   ├── MatchCard.tsx
│   │   │   ├── LiveMatchTracker.tsx
│   │   │   └── MarketAccordion.tsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── CreditTable.tsx
│   │   │   ├── MemberTable.tsx
│   │   │   ├── AgentTree.tsx
│   │   │   └── PnLChart.tsx
│   │   ├── admin/
│   │   │   ├── LogViewer.tsx
│   │   │   ├── CreditManager.tsx
│   │   │   └── PrivilegePanel.tsx
│   │   └── shared/
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       ├── OddsFormatToggle.tsx
│   │       └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useOdds.ts               # WebSocket odds subscription
│   │   ├── useBetSlip.ts
│   │   ├── useAuth.ts
│   │   └── useCredits.ts
│   ├── lib/
│   │   ├── api.ts                   # Axios instance + interceptors
│   │   ├── socket.ts                # Socket.io client setup
│   │   ├── auth.ts                  # Token management
│   │   └── utils.ts
│   ├── store/
│   │   ├── betSlipStore.ts          # Zustand: bet slip state
│   │   ├── authStore.ts             # Zustand: user/session state
│   │   └── oddsStore.ts             # Zustand: live odds state
│   └── types/
│       └── index.ts                 # Shared TS types (frontend)
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 4. Backend Structure (`apps/api/`)

```
apps/api/
├── src/
│   ├── index.ts                     # Entry point, server bootstrap
│   ├── app.ts                       # Express app config, middleware stack
│   ├── socket.ts                    # Socket.io server setup
│   │
│   ├── config/
│   │   ├── database.ts              # Postgres connection (pg/knex)
│   │   ├── redis.ts                 # Redis client
│   │   ├── env.ts                   # Environment variable validation
│   │   └── constants.ts             # App-wide constants
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT verification
│   │   ├── rbac.middleware.ts       # Role-based access control
│   │   ├── rateLimiter.middleware.ts
│   │   ├── sanitize.middleware.ts   # Input sanitization + SQLi detection
│   │   ├── logger.middleware.ts     # Request/action logging
│   │   └── errorHandler.middleware.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.types.ts
│   │   │
│   │   ├── agents/
│   │   │   ├── agents.routes.ts
│   │   │   ├── agents.controller.ts
│   │   │   ├── agents.service.ts
│   │   │   └── agents.types.ts
│   │   │
│   │   ├── credits/
│   │   │   ├── credits.routes.ts
│   │   │   ├── credits.controller.ts
│   │   │   ├── credits.service.ts
│   │   │   └── credits.types.ts
│   │   │
│   │   ├── bets/
│   │   │   ├── bets.routes.ts
│   │   │   ├── bets.controller.ts
│   │   │   ├── bets.service.ts
│   │   │   ├── bets.validator.ts
│   │   │   └── bets.types.ts
│   │   │
│   │   ├── odds/
│   │   │   ├── odds.routes.ts
│   │   │   ├── odds.controller.ts
│   │   │   ├── odds.service.ts      # Fetches + caches from external API
│   │   │   └── odds.sync.ts         # Cron job: syncs odds every N seconds
│   │   │
│   │   ├── sports/
│   │   │   ├── sports.routes.ts
│   │   │   ├── sports.controller.ts
│   │   │   └── sports.service.ts
│   │   │
│   │   ├── logs/
│   │   │   ├── logs.routes.ts
│   │   │   ├── logs.controller.ts
│   │   │   └── logs.service.ts
│   │   │
│   │   └── admin/
│   │       ├── admin.routes.ts
│   │       ├── admin.controller.ts
│   │       └── admin.service.ts
│   │
│   ├── jobs/
│   │   ├── oddsSync.job.ts          # Periodic odds fetch from external API
│   │   ├── betSettlement.job.ts     # Auto-settle bets on match end
│   │   └── scheduler.ts             # node-cron scheduler
│   │
│   └── utils/
│       ├── idGenerator.ts           # Agent ID + Member sub-ID generator
│       ├── passwordGenerator.ts     # Auto-generate member credentials
│       ├── sqliDetector.ts          # Pattern matching for SQLi attempts
│       └── logger.ts                # Winston logger config
│
├── migrations/                      # SQL migration files (knex)
│   ├── 001_create_users.sql
│   ├── 002_create_agents.sql
│   ├── 003_create_credits.sql
│   ├── 004_create_bets.sql
│   ├── 005_create_odds.sql
│   └── 006_create_logs.sql
├── seeds/                           # Seed data (admin account)
│   └── 001_admin.seed.ts
├── tsconfig.json
└── package.json
```

---

## 5. Database Schema

### `users` table
```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  display_id    VARCHAR(20) UNIQUE NOT NULL,  -- e.g. "20", "20_1"
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL,         -- admin | agent | sub_agent | member
  nickname      VARCHAR(100),                 -- agent-only: private label
  is_active     BOOLEAN DEFAULT true,
  created_by    INT REFERENCES users(id),     -- who created this user
  parent_agent_id INT REFERENCES users(id),   -- agent who owns this member/sub-agent
  can_create_sub_agent BOOLEAN DEFAULT false, -- privilege flag
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `credit_accounts` table
```sql
CREATE TABLE credit_accounts (
  id            SERIAL PRIMARY KEY,
  user_id       INT UNIQUE REFERENCES users(id),
  balance       DECIMAL(18,2) DEFAULT 0,
  total_received DECIMAL(18,2) DEFAULT 0,
  total_sent    DECIMAL(18,2) DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `credit_transactions` table
```sql
CREATE TABLE credit_transactions (
  id            SERIAL PRIMARY KEY,
  from_user_id  INT REFERENCES users(id),     -- NULL if admin creation
  to_user_id    INT REFERENCES users(id),
  amount        DECIMAL(18,2) NOT NULL,
  type          VARCHAR(30) NOT NULL,         -- create | transfer | deduct
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `bets` table
```sql
CREATE TABLE bets (
  id            SERIAL PRIMARY KEY,
  bet_uid       UUID DEFAULT gen_random_uuid(),
  user_id       INT REFERENCES users(id),
  type          VARCHAR(30) NOT NULL,         -- single | accumulator | system | etc.
  status        VARCHAR(20) DEFAULT 'open',   -- open | won | lost | void | cashout
  stake         DECIMAL(18,2) NOT NULL,
  potential_win DECIMAL(18,2),
  actual_win    DECIMAL(18,2),
  odds_snapshot JSONB NOT NULL,               -- full snapshot of all selections at placement time
  selections    JSONB NOT NULL,               -- array of selections
  settled_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `events` table (synced from external API)
```sql
CREATE TABLE events (
  id            SERIAL PRIMARY KEY,
  external_id   VARCHAR(100) UNIQUE NOT NULL,
  sport         VARCHAR(50),
  league        VARCHAR(100),
  home_team     VARCHAR(100),
  away_team     VARCHAR(100),
  starts_at     TIMESTAMPTZ,
  status        VARCHAR(30),                  -- scheduled | live | finished
  score         JSONB,
  raw_data      JSONB,                        -- full API response cached
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `odds` table
```sql
CREATE TABLE odds (
  id            SERIAL PRIMARY KEY,
  event_id      INT REFERENCES events(id),
  market_type   VARCHAR(100),                 -- 1X2, over_under, asian_handicap, etc.
  selections    JSONB NOT NULL,               -- [{name, odds, status}]
  is_live       BOOLEAN DEFAULT false,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `system_logs` table
```sql
CREATE TABLE system_logs (
  id            BIGSERIAL PRIMARY KEY,
  user_id       INT REFERENCES users(id),
  role          VARCHAR(20),
  action        VARCHAR(100) NOT NULL,        -- login | bet_place | credit_transfer | sqli_attempt | etc.
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  payload       JSONB,                        -- sanitized request data
  result        VARCHAR(20),                  -- success | failure | blocked
  threat_flag   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
-- Logs are INSERT-only. No UPDATE or DELETE granted to API user role.
```

---

## 6. Key Architectural Decisions

**Credit Flow (unidirectional)**
Admin creates → assigns to Agent → Agent assigns to Sub-Agent (if any) → Sub-Agent assigns to Members. Credits never flow upward automatically.

**Privacy Isolation**
Each agent query is scoped to `parent_agent_id = current_user.id`. Sub-agent member data is invisible to the parent agent by design — enforced at the service layer, not just UI.

**Odds Sync Strategy**
A background job polls the external sports data API every 5–10 seconds for live odds and every 60 seconds for pre-match. Results are cached in Redis and pushed to connected clients via Socket.io rooms (one room per event).

**ID Generation**
Agent IDs are sequential integers. Member sub-IDs are `{agentId}_{sequence}` where sequence is auto-incremented per agent. Stored in `display_id` column.

**Immutable Logs**
The PostgreSQL role used by the API has `INSERT` only on `system_logs`. No `UPDATE` or `DELETE` is permitted at the DB permission level — not just application level.

**Security**
All queries use parameterized statements via Knex. The `sqliDetector` utility runs regex pattern matching on all incoming string inputs before they reach the DB layer. Matches are flagged in logs with `threat_flag = true` and return a 400 with no detail exposed to the client.
