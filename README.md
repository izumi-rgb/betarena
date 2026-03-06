# BetArena — Sports Betting Platform

A full-featured, multi-role sports betting platform built for production deployment.

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full platform control, user management, credits, logs |
| **Agent** | Manage sub-agents and members, credit transfers, reports |
| **Member** | Place bets, view sports/live events, cashout, account |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (via Knex) |
| Cache / Pub-Sub | Redis |
| Real-time | Socket.IO |
| Containerisation | Docker + Docker Compose |

## Repository Structure

```
bitarena/
├── apps/
│   ├── api/          # Express REST API + Socket.IO server
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared types and utilities
├── docs/             # Architecture and deployment docs
├── docker-compose.yml
└── docker-compose.override.yml
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) and Docker Compose v2
- [PostgreSQL](https://www.postgresql.org/) 15+ (or use Docker)
- [Redis](https://redis.io/) 7+ (or use Docker)

## Quick Start (Docker — recommended)

```bash
# 1. Clone the repo
git clone https://github.com/ctr6780-ship-it/betarena.git
cd betarena

# 2. Copy env file and fill in secrets
cp apps/api/.env.example apps/api/.env

# 3. Start all services
docker compose up -d

# 4. Run database migrations
docker compose exec api npm run migrate

# 5. Seed initial data (admin user + sports)
docker compose exec api npm run seed
```

The web app will be available at **http://localhost:3000** and the API at **http://localhost:4000**.

## Manual Setup (Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` — required variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/betarena
# or individual vars:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=betarena
DB_USER=postgres
DB_PASSWORD=yourpassword

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-very-long-random-secret
JWT_REFRESH_SECRET=another-very-long-random-secret

# Sports data (optional — enables live odds)
ODDS_API_KEY=your-api-key
ESPN_API_KEY=your-api-key
CRICKET_API_KEY=your-api-key
```

### 3. Run migrations and seed

```bash
npm run migrate
npm run seed
```

### 4. Start development servers

```bash
npm run dev        # starts both API and web concurrently
# or individually:
npm run dev:api    # API on port 4000
npm run dev:web    # Web on port 3000
```

## Default Credentials (after seed)

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Agent | `agent` | `agent123` |
| Member | `member` | `member123` |

> **Change all default passwords immediately after first login.**

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + Web in development mode |
| `npm run build` | Build both apps for production |
| `npm run migrate` | Run pending database migrations |
| `npm run seed` | Seed initial data |
| `npm run test --workspace=apps/api` | Run API tests (Jest) |
| `npm run test --workspace=apps/web` | Run web tests (Vitest) |

## Cloud Deployment

### Railway (API) + Vercel (Web)

Deployment configs are included in the repo.

**Railway (API):**
- Connect your GitHub repo in Railway
- Set root directory to `apps/api`
- Add environment variables (DATABASE_URL, REDIS_URL, JWT_SECRET, etc.)
- Railway auto-detects the `Dockerfile`

**Vercel (Web):**
- Connect your GitHub repo in Vercel
- Set root directory to `apps/web`
- Set `NEXT_PUBLIC_API_URL` to your Railway API URL

See [`docs/plans/2026-03-02-railway-deployment.md`](docs/plans/2026-03-02-railway-deployment.md) for the full deployment guide.

### Docker Compose (Self-Hosted / VPS)

```bash
docker compose -f docker-compose.yml up -d
```

Includes PostgreSQL, Redis, API, and Web containers with automatic restart.

## Features

- **Sports:** Football, Basketball, Tennis, Cricket, Golf, Esports, Horse Racing
- **Live/In-Play:** Real-time odds via Socket.IO
- **Bet Types:** 1X2, Asian Handicap, Correct Score, BTTS, Over/Under
- **Cashout:** Full and partial cashout
- **Credits System:** Admin → Agent → Sub-Agent → Member credit flow
- **Bet Settlement:** Automated cron job (every 60 seconds)
- **Admin Dashboard:** Users, credits, logs, privileges
- **Agent Dashboard:** Members, sub-agents, reports, credit management

## Architecture Docs

- [`docs/BETARENA_APPLICATION_DOCUMENTATION.md`](docs/BETARENA_APPLICATION_DOCUMENTATION.md) — full app architecture
- [`docs/PRODUCTION_READINESS_AUDIT.md`](docs/PRODUCTION_READINESS_AUDIT.md) — production readiness notes
- [`docs/plans/`](docs/plans/) — deployment design documents

## License

Private — all rights reserved.
