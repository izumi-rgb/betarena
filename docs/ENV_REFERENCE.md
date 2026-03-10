# BetArena — Environment Variables Reference

**Purpose:** Single reference for all environment variables used by the API and Web apps. See also [.env.example](../.env.example) and [README](../README.md).

---

## API (`apps/api`)

The API loads `.env` from the repo root (or `apps/api/.env` depending on config). See `apps/api/src/config/env.ts`.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for signing access tokens. Generate with `openssl rand -base64 64`. | `abc123...` |
| `JWT_REFRESH_SECRET` | Secret for refresh token validation. Must be different from `JWT_SECRET`. | `def456...` |

**Database** (one of):

- **Option A:** `DATABASE_URL` — Full connection string (e.g. from Railway).
- **Option B:** `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — Individual vars.

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development` \| `production` |
| `PORT` | `4000` | API server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origin(s), comma-separated |
| `DB_HOST` | — | PostgreSQL host (use `postgres` in Docker) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | — | Database name |
| `DB_USER` | — | Database user |
| `DB_PASSWORD` | — | Database password |
| `REDIS_URL` | — | Full Redis URL (e.g. from Railway) |
| `REDIS_HOST` | `127.0.0.1` | Redis host (use `redis` in Docker) |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | — | Redis password (leave blank for local dev) |
| `SPORTS_API_KEY` | — | API-Football / sports provider key |
| `SPORTS_API_BASE_URL` | — | Override sports API base URL |

### OddsSync (jobs/oddsSync.ts)

| Variable | Default | Description |
|----------|---------|-------------|
| `SIMULATE_ODDS` | unset | When set to `'true'`, enables **simulated** clock advancement and fake incidents for DB events with `status: 'live'`. Used only for local demo. **Production:** Leave unset or set to `false`. |

---

## Web (`apps/web`)

Set in `.env.local` or the deployment environment. These are embedded at build time (`NEXT_PUBLIC_*`).

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL for HTTP requests | `http://localhost:4000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket (Socket.IO) URL | `http://localhost:4000` |

---

## Seeds

| Variable | Description |
|----------|-------------|
| `ADMIN_SEED_PASSWORD` | Password for seeded admin user. **Change before running seeds in production.** |

---

## Sports Data Provider Keys

These are optional; the app works without them but sports data may be limited. See [.env.example](../.env.example):

- `APISPORTS_KEY` — API-Football (v3.football.api-sports.io)
- `CRICKET_API_KEY` — CricketData.org
- `RAPIDAPI_KEY` — Cricbuzz live cricket
- `ODDSPAPI_KEY` — OddsPapi
- `ODDS_API_KEY` — The Odds API

---

## Rate Limits and Brute-Force

Defined in `packages/shared/src/constants/index.ts` and `apps/api/src/modules/auth/auth.service.ts`. Not configurable via env today; values are hardcoded.

### API Rate Limit

- **Limit:** 300 requests per window
- **Window:** 1 minute
- **Scope:** Per IP (`req.ip` or `req.socket.remoteAddress`)
- **Applies to:** All `/api/*` routes except health check
- **Response:** `429` with `RATE_LIMIT_EXCEEDED`

### Login Rate Limit

- **Limit:** 5 attempts per window
- **Window:** 15 minutes
- **Scope:** Per IP
- **Applies to:** POST `/api/auth/login`
- **Response:** `429` with rate limit message

### Brute-Force Protection

- **Redis key:** `bf:<ip>`
- **Max failed logins:** 5 per IP
- **Window:** 15 minutes (TTL set on first failure)
- **Effect:** Login blocked for that IP until TTL expires or key is manually deleted

---

## Docker Compose

When using `docker-compose.yml`:

- **DB:** `DB_HOST=postgres`, `DB_PORT=5432`, `DB_NAME=betarena`, etc. Password in compose: `betarena_dev_password` — must match `DB_PASSWORD` if using individual vars.
- **Redis:** `REDIS_HOST=redis`, `REDIS_PORT=6379`.
- **Web:** `NEXT_PUBLIC_API_URL=http://api:4000`, `NEXT_PUBLIC_WS_URL=http://api:4000`.
