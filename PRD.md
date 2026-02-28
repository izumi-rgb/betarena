# PRD.md — Product Requirements Document
## Project: BetArena (Demo Betting Platform)

---

## 1. What This App IS

BetArena is a **full-featured, demo-currency sports betting platform** inspired by Bet365. It replicates the real experience of online sports betting — live odds, match data, bet types, real-time updates — but uses **fake/virtual credits** instead of real money. No real financial transactions ever occur.

### Core Identity
- A **white-label style** betting platform with a 3-tier user hierarchy: Admin → Agent → Member
- Credits (virtual currency) are created **only** by the Admin and flow downward through agents to members
- Members are created **only** by agents — no public self-registration exists
- All odds, sports data, and bet markets are sourced from **Bet365-compatible live data feeds**
- The platform has its own identity and creative UI — not a 1:1 clone

---

## 2. Target Users

| Role | Description |
|------|-------------|
| **Admin** | Single super-user. Full platform control. Creates credits. Manages all agents. |
| **Master Agent** | An agent given elevated privilege by Admin. Can create sub-agents AND members. |
| **Agent** | Default agent. Can create members only (no sub-agents unless privilege is granted). |
| **Sub-Agent** | Created by a Master Agent. Can create members. Cannot create sub-agents unless the parent agent explicitly grants that privilege. |
| **Member** | End user. Can browse, place bets, view their own balance and history. Cannot create any other users. |

---

## 3. Feature Requirements

### 3.1 Authentication & Access Control
- No public registration page
- Login page only — credentials issued by agents
- Session-based login with JWT + refresh tokens
- Role-based access control (RBAC) on every route and API endpoint
- All failed login attempts and suspicious patterns are logged with IP and user-agent

### 3.2 Credit System
- Admin is the **only source** of credit creation
- Admin → Agent: Admin assigns credits to agents
- Agent → Sub-Agent: Agents can pass credits to their sub-agents
- Agent/Sub-Agent → Member: Credits passed down to members
- Credits cannot be fabricated at any lower level
- Full credit transaction ledger: every transfer is logged with timestamp, sender, receiver, amount, and balance snapshot

### 3.3 User Hierarchy & IDs
- Every Agent gets a unique numeric ID (e.g., `20`)
- Members under that agent get a sub-ID (e.g., `20_1`, `20_2`, `20_3`)
- Sub-agents get their own ID in sequence (e.g., `21`) and their members follow the same pattern (`21_1`, etc.)
- Agents can see their own members' credit and P&L but **cannot see sub-agents' member lists** (privacy isolation)

### 3.4 Member Session Creation
- Agents create members in one click: system auto-generates a username and password
- Optional "nickname" field for agents to remember real identities (stored privately, not shown to member)
- Member receives credentials to log in

### 3.5 Betting Engine
- Sports coverage mirrors Bet365 offerings: Football, Basketball, Tennis, Cricket, Baseball, American Football, Hockey, and more
- Live and pre-match markets
- Bet types: Single, Accumulator (Parlay), System bets, Each-Way, Asian Handicap, Over/Under, Correct Score, First Goal Scorer, and all standard Bet365 market types
- Odds format toggle: Decimal / Fractional / American
- Real-time odds updates via WebSocket
- Bet slip: add, remove, view potential payout before confirming
- Live match tracker (score, time, events embedded from data feed)

### 3.6 Admin Dashboard
- Full overview: total credits in system, total credits in circulation, P&L summary across all users
- Agent list with drill-down: each agent's balance, member count, total bet activity
- Sub-agent tree view
- Credit management panel: create credits, assign to agents
- System logs viewer: filterable by user, action type, IP, date range
- Suspicious activity flags (SQLi attempts, brute force, unusual patterns)
- Ability to suspend/activate any user account
- Privilege management: grant/revoke Master Agent status, grant/revoke sub-agent creation rights

### 3.7 Agent Dashboard
- Clean, modern UI
- Summary cards: total credit given out, total credit remaining, member count
- Member table: ID, nickname, credit balance, current bets, P&L
- Sub-agent section (if applicable): shows sub-agent ID and total credit held — **no visibility into sub-agent's member list**
- One-click member creation
- Credit transfer panel (to members or sub-agents)
- Activity log for own account actions

### 3.8 Member Interface
- Full Bet365-style sports betting UI
- My Bets: open bets, settled bets, history
- Balance and transaction history
- Live scores and stats
- Responsible gambling notices (informational, since it's demo)

### 3.9 Security & Logging
- Every action logged: login, logout, bet placed, bet settled, credit transfer, user created, privilege change, failed login
- SQL injection attempt detection on all inputs with automatic flagging
- Rate limiting on login and API endpoints
- Input sanitization and parameterized queries throughout
- Log entries include: timestamp (UTC), user ID, role, action, IP address, user-agent, request payload summary, result
- Logs are immutable — no user including admin can delete log entries via UI (read-only log store)

---

## 4. What This App IS NOT

- ❌ **Not a real money gambling site** — no payment gateways, no real currency, no financial regulation required
- ❌ **Not a public platform** — no self-registration, no open sign-up
- ❌ **Not a Bet365 clone** — it uses similar data and bet types but has its own branding, UI design, and creative identity
- ❌ **Not a crypto platform** — no blockchain, no wallets
- ❌ **Not a social platform** — no chat between users, no public leaderboards
- ❌ **Not a mobile app (Phase 1)** — web-first, responsive design; native mobile apps are out of scope for now
- ❌ **Not multi-currency** — single virtual credit unit only
- ❌ **Not multi-language (Phase 1)** — English only initially
- ❌ **Not an affiliate system** — no referral codes, no commission tracking (beyond P&L visibility)

---

## 5. Success Criteria

- Admin can create credits and distribute to agents without issues
- Agents can create members and distribute credits seamlessly
- Members can place bets and see real-time odds updates
- Odds and match data reflect real-world events accurately via data feed
- All user actions are captured in logs with no gaps
- Any SQLi or brute-force attempt is flagged immediately in the admin log
- The system runs stably on an 8GB RAM VPS (localhost first, then VPS, then with domain)

---

## 6. Tech Stack (High-Level)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express (REST API) |
| Realtime | Socket.io (odds updates, live scores) |
| Database | PostgreSQL (primary) + Redis (sessions, cache) |
| Auth | JWT + bcrypt |
| Odds/Data | Bet365 data via RapidAPI (API-Football, SportRadar, or equivalent) |
| Logging | Winston + custom log middleware → PostgreSQL log table |
| Deployment | PM2 + Nginx (VPS) |
