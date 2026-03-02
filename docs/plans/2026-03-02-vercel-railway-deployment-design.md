# BetArena Deployment Design: Vercel (Web) + Railway (API)

**Date:** 2026-03-02
**Status:** Approved
**Goal:** Deploy BetArena to production using Vercel free tier for the Next.js frontend and Railway free tier for the Express API + PostgreSQL + Redis.

---

## Architecture

```
┌──────────────────┐              ┌─────────────────────────┐
│   Vercel (Free)  │              │    Railway (Free)        │
│                  │   HTTPS/WSS  │                          │
│  Next.js 14 Web  │────────────▸│  Express API + Socket.IO │
│  (SSR + Static)  │              │  + Cron Jobs (3 schedulers)
│                  │              │                          │
│  Env vars:       │              │  Managed PostgreSQL      │
│  NEXT_PUBLIC_    │              │  Managed Redis           │
│  API_URL         │              │                          │
│  NEXT_PUBLIC_    │              │  Env vars:               │
│  WS_URL          │              │  DATABASE_URL (auto)     │
│                  │              │  REDIS_URL (auto)        │
│  Root dir:       │              │  JWT_SECRET              │
│  apps/web        │              │  JWT_REFRESH_SECRET      │
│                  │              │  CORS_ORIGIN             │
│  Framework:      │              │  Sports API keys         │
│  Next.js (auto)  │              │                          │
└──────────────────┘              └─────────────────────────┘
```

## Why This Split

| Concern | Vercel | Railway |
|---------|--------|---------|
| Next.js SSR + Edge Middleware | Native support, zero config | Docker-based (works but no edge) |
| Socket.IO (persistent connections) | Not supported (serverless) | Full support |
| Cron jobs (5s/15s/60s intervals) | Not supported | Full support |
| PostgreSQL | Not offered | Managed plugin |
| Redis | Not offered on free tier | Managed plugin |
| Cost | Free (100GB bandwidth) | Free trial ($5 credits/30d, then ~$1/mo) |

The Express API MUST run on Railway because it requires:
1. Persistent WebSocket connections (Socket.IO for live odds, scores, balance updates)
2. Background cron jobs running every 5-60 seconds (odds sync, bet settlement, live scores)
3. Direct access to PostgreSQL and Redis

## Code Changes Required

### 1. Make `output: 'standalone'` conditional in `next.config.mjs`

Vercel uses its own build pipeline and doesn't need `standalone` output. Docker builds still need it.

**File:** `apps/web/next.config.mjs`

```js
const nextConfig = {
  output: process.env.STANDALONE_BUILD === '1' ? 'standalone' : undefined,
  // ... rest unchanged
};
```

Update `apps/web/Dockerfile` to set `ENV STANDALONE_BUILD=1` before the build step.

### 2. Create `vercel.json` in repo root

Tell Vercel this is a monorepo and the web app lives in `apps/web`.

**File:** `vercel.json` (repo root)

```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm ci",
  "framework": "nextjs"
}
```

### 3. Keep existing Railway config as-is

- `apps/api/Dockerfile` — already production-ready (multi-stage, non-root, health check)
- `apps/api/railway.toml` — already configured (migrations on start, health check)
- `docker-compose.yml` — unchanged (local dev)

### 4. No application code changes

- `api.ts` already reads `NEXT_PUBLIC_API_URL` env var
- `socket.ts` already reads `NEXT_PUBLIC_WS_URL` env var
- `middleware.ts` runs fine on Vercel Edge Runtime
- All API calls use relative paths through the axios baseURL

## Deployment Steps

### Railway (API + Database + Redis)

1. Create Railway project → "Deploy from GitHub repo"
2. Add PostgreSQL plugin (auto-provisions `DATABASE_URL`)
3. Add Redis plugin (auto-provisions `REDIS_URL`)
4. Create API service from repo
   - Railway will detect `apps/api/railway.toml`
   - Set env vars:
     - `JWT_SECRET` = generate a strong random string
     - `JWT_REFRESH_SECRET` = generate a different strong random string
     - `CORS_ORIGIN` = your Vercel domain (e.g., `https://betarena.vercel.app`)
     - `APISPORTS_KEY` = your API-Football key (optional)
     - `CRICKET_API_KEY` = your CricketData key (optional)
     - `ODDS_API_KEY` = your The Odds API key (optional)
     - `ODDSPAPI_KEY` = your OddsPapi key (optional)
   - Reference variables:
     - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
     - `REDIS_URL` = `${{Redis.REDIS_URL}}`
5. First deploy: Railway runs migrations automatically via `startCommand`
6. Seed database (one-time, Railway shell):
   ```
   knex seed:run --knexfile apps/api/dist/config/knexfile.js
   ```
7. Note the API service URL (e.g., `https://betarena-api-production.up.railway.app`)

### Vercel (Web Frontend)

1. Import GitHub repo in Vercel dashboard
2. Set root directory: `apps/web`
3. Framework preset: Next.js (auto-detected)
4. Set env vars:
   - `NEXT_PUBLIC_API_URL` = `https://<api-service>.up.railway.app`
   - `NEXT_PUBLIC_WS_URL` = `wss://<api-service>.up.railway.app`
5. Deploy

### CORS Configuration

The API's `CORS_ORIGIN` env var accepts comma-separated origins:
```
CORS_ORIGIN=https://betarena.vercel.app,http://localhost:3000
```

This allows both production (Vercel) and local development to work.

## Cost Summary

| Service | Platform | Cost |
|---------|----------|------|
| Next.js Web | Vercel Free | $0/mo |
| Express API | Railway Free | $0 (trial) → ~$1/mo |
| PostgreSQL | Railway Plugin | Included |
| Redis | Railway Plugin | Included |
| **Total** | | **$0–1/mo** |

## Limitations on Free Tiers

### Vercel Free
- 100GB bandwidth/month
- Serverless function execution: 100GB-hours
- 1 concurrent build
- No team features

### Railway Free
- $5 initial credits (30-day trial)
- 0.5 GB RAM per service
- 0.5 GB volume storage
- After trial: $1/mo minimum
- No custom domains on free tier (use `.up.railway.app` subdomain)

## What Stays the Same

- All application code (frontend + backend)
- Docker setup for local/self-hosted deployment
- docker-compose.yml for local development
- All API endpoints, socket events, cron jobs
- Database schema and migrations
