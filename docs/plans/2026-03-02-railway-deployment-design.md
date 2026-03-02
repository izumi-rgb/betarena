# Railway Deployment Design

**Date:** 2026-03-02
**Status:** Approved

## Overview

Deploy BetArena to Railway as 4 services: API (Express + Socket.IO), Web (Next.js), PostgreSQL (plugin), Redis (plugin). Auto-deploy from `main` branch.

## Architecture

```
Railway Project: BetArena
├── api          (Docker → apps/api/Dockerfile, port 4000)
├── web          (Docker → apps/web/Dockerfile, port 3000)
├── PostgreSQL   (Railway managed plugin)
└── Redis        (Railway managed plugin)
```

## Files to Create

1. `apps/api/railway.toml` — API service config
2. `apps/web/railway.toml` — Web service config

## Code Changes

### 1. `apps/api/src/config/env.ts`
- Support `DATABASE_URL` connection string (Railway injects this for Postgres plugin)
- Support `REDIS_URL` connection string (Railway injects this for Redis plugin)
- Fall back to individual `DB_HOST`/`DB_PORT`/etc. for local dev

### 2. `apps/api/src/config/knexfile.ts`
- Support `DATABASE_URL` as connection string, falling back to individual vars

## Environment Variables

### Auto-injected by Railway plugins
- `DATABASE_URL` — Postgres connection string
- `REDIS_URL` — Redis connection string

### Set via Railway service references
- `NEXT_PUBLIC_API_URL` = `https://${{api.RAILWAY_PUBLIC_DOMAIN}}`
- `NEXT_PUBLIC_WS_URL` = `wss://${{api.RAILWAY_PUBLIC_DOMAIN}}`

### Set manually in Railway dashboard
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ADMIN_SEED_PASSWORD`
- `CORS_ORIGIN` (set to web service URL)
- `APISPORTS_KEY` (optional)
- `CRICKET_API_KEY` (optional)
- `ODDSPAPI_KEY` (optional)
- `ODDS_API_KEY` (optional)

## Migrations

API service start command runs migrations before starting:
```
npm run migrate && node apps/api/dist/index.js
```

## Deploy Config

- Auto-deploy on push to `main`
- Railway subdomain URLs (custom domain can be added later)
- Health checks configured for both services
