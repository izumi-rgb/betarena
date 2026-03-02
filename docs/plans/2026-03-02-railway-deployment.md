# Railway Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy BetArena monorepo to Railway with auto-deploy from main, managed Postgres + Redis, and zero-downtime migrations.

**Architecture:** Two Railway services (api, web) backed by Railway's managed PostgreSQL and Redis plugins. Services communicate via Railway's private network. Migrations run automatically before API startup.

**Tech Stack:** Railway, Docker (existing multi-stage Dockerfiles), Node 20, Knex migrations

---

### Task 1: Add DATABASE_URL and REDIS_URL support to env.ts

**Files:**
- Modify: `apps/api/src/config/env.ts`

**Step 1: Update env.ts to support connection string env vars**

Railway injects `DATABASE_URL` and `REDIS_URL` for its managed plugins. We keep individual vars as fallback for local dev.

```ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const env = {
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: parseInt(optionalEnv('PORT', '4000'), 10),

  // Database — prefer DATABASE_URL (Railway), fall back to individual vars
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DATABASE_URL ? '' : requireEnv('DB_HOST'),
  DB_PORT: parseInt(optionalEnv('DB_PORT', '5432'), 10),
  DB_NAME: process.env.DATABASE_URL ? '' : requireEnv('DB_NAME'),
  DB_USER: process.env.DATABASE_URL ? '' : requireEnv('DB_USER'),
  DB_PASSWORD: process.env.DATABASE_URL ? '' : requireEnv('DB_PASSWORD'),

  // Redis — prefer REDIS_URL (Railway), fall back to individual vars
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_HOST: optionalEnv('REDIS_HOST', '127.0.0.1'),
  REDIS_PORT: parseInt(optionalEnv('REDIS_PORT', '6379'), 10),
  REDIS_PASSWORD: optionalEnv('REDIS_PASSWORD', ''),

  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),

  CORS_ORIGIN: optionalEnv('CORS_ORIGIN', 'http://localhost:3000'),

  SPORTS_API_KEY: optionalEnv('SPORTS_API_KEY', ''),
  SPORTS_API_BASE_URL: optionalEnv('SPORTS_API_BASE_URL', ''),
} as const;
```

**Step 2: Verify API still starts locally**

Run: `cd apps/api && npm run dev`
Expected: Server starts on port 4000, connects to local Postgres/Redis

**Step 3: Commit**

```bash
git add apps/api/src/config/env.ts
git commit -m "feat(api): support DATABASE_URL and REDIS_URL env vars for Railway"
```

---

### Task 2: Update database.ts to use DATABASE_URL

**Files:**
- Modify: `apps/api/src/config/database.ts`

**Step 1: Update database.ts**

```ts
import knex from 'knex';
import { env } from './env';

const connection = env.DATABASE_URL
  ? { connectionString: env.DATABASE_URL }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    };

const db = knex({
  client: 'pg',
  connection,
  pool: {
    min: 2,
    max: 10,
  },
});

export default db;
```

**Step 2: Verify DB connection still works locally**

Run: `cd apps/api && npm run dev`
Expected: Server starts, no DB connection errors

**Step 3: Commit**

```bash
git add apps/api/src/config/database.ts
git commit -m "feat(api): use DATABASE_URL connection string when available"
```

---

### Task 3: Update knexfile.ts for DATABASE_URL and production migrations

**Files:**
- Modify: `apps/api/src/config/knexfile.ts`

**Step 1: Update knexfile.ts**

```ts
import dotenv from 'dotenv';
import path from 'path';
import type { Knex } from 'knex';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

const connection: Knex.Config['connection'] = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const config: Knex.Config = {
  client: 'pg',
  connection,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: path.resolve(__dirname, '../../migrations'),
    extension: isProduction ? 'js' : 'ts',
  },
  seeds: {
    directory: path.resolve(__dirname, '../../seeds'),
  },
};

export default config;
module.exports = config;
```

**Step 2: Verify migrations still run locally**

Run: `cd apps/api && npm run migrate`
Expected: "Already up to date" or migrations run successfully

**Step 3: Commit**

```bash
git add apps/api/src/config/knexfile.ts
git commit -m "feat(api): support DATABASE_URL in knexfile, use .js migrations in production"
```

---

### Task 4: Update redis.ts to use REDIS_URL

**Files:**
- Modify: `apps/api/src/config/redis.ts`

**Step 1: Update redis.ts**

```ts
import Redis from 'ioredis';
import { env } from './env';
import logger from './logger';

const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
    })
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
    });

redis.on('error', (err) => {
  logger.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

export default redis;
```

**Step 2: Verify Redis still connects locally**

Run: `cd apps/api && npm run dev`
Expected: "Redis connected" in logs

**Step 3: Commit**

```bash
git add apps/api/src/config/redis.ts
git commit -m "feat(api): support REDIS_URL connection string for Railway"
```

---

### Task 5: Update API Dockerfile for production migrations

**Files:**
- Modify: `apps/api/Dockerfile`

The migrations are `.ts` files outside `src/`, so `tsc` doesn't compile them. We need to compile them to `.js` during the build stage and copy them into the production image so `knex migrate:latest` works without ts-node.

**Step 1: Update Dockerfile**

```dockerfile
# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy workspace package.json files for dependency resolution
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install production + dev dependencies (need devDeps for build)
RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

# Copy shared package source (API depends on @betarena/shared)
COPY packages/shared/ packages/shared/

# Copy API source
COPY apps/api/ apps/api/

# Copy root tsconfig
COPY tsconfig.base.json ./

# Build the API
RUN npm run build --workspace=apps/api

# Compile migration .ts files to .js for production use
RUN cd apps/api && npx tsc --outDir migrations-compiled \
    --module commonjs --target ES2022 --esModuleInterop \
    --skipLibCheck --declaration false \
    migrations/*.ts

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set production environment
ENV NODE_ENV=production

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy workspace package.json files
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install production dependencies only
RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root --omit=dev \
    && npm cache clean --force

# Copy shared package source (needed at runtime since main points to src/)
COPY packages/shared/src/ packages/shared/src/

# Copy built API output from build stage
COPY --from=build /app/apps/api/dist apps/api/dist

# Copy compiled JS migrations for production
COPY --from=build /app/apps/api/migrations-compiled/migrations/ apps/api/migrations/

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 expressjs
USER expressjs

EXPOSE 4000

# Health check: hit a lightweight endpoint every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["dumb-init", "node", "apps/api/dist/index.js"]
```

Key changes:
- Added `npx tsc` step to compile migrations to JS
- Copy compiled migrations into production image at `apps/api/migrations/`
- Fixed health check URL to `/api/health` (matches actual route)

**Step 2: Test Docker build**

Run: `cd /home/voxmastery/Music/bitarena && docker build -f apps/api/Dockerfile -t betarena-api .`
Expected: Build completes successfully

**Step 3: Commit**

```bash
git add apps/api/Dockerfile
git commit -m "feat(api): compile migrations to JS in Docker build for production"
```

---

### Task 6: Create railway.toml for API service

**Files:**
- Create: `apps/api/railway.toml`

**Step 1: Create the config file**

```toml
[build]
dockerfilePath = "apps/api/Dockerfile"

[deploy]
startCommand = "knex migrate:latest --knexfile apps/api/dist/config/knexfile.js && dumb-init node apps/api/dist/index.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

Notes:
- `startCommand` overrides the Dockerfile CMD — runs migrations first, then starts the server
- `healthcheckPath` tells Railway to monitor the API health endpoint
- `dockerfilePath` is relative to repo root (Railway builds from repo root)

**Step 2: Commit**

```bash
git add apps/api/railway.toml
git commit -m "feat(api): add Railway deployment config"
```

---

### Task 7: Create railway.toml for Web service

**Files:**
- Create: `apps/web/railway.toml`

**Step 1: Create the config file**

```toml
[build]
dockerfilePath = "apps/web/Dockerfile"

[deploy]
healthcheckPath = "/"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

**Step 2: Commit**

```bash
git add apps/web/railway.toml
git commit -m "feat(web): add Railway deployment config"
```

---

### Task 8: Update .env.example with new vars

**Files:**
- Modify: `.env.example`

**Step 1: Add DATABASE_URL and REDIS_URL entries**

Add these lines after the existing DB and Redis sections:

```
# ── Railway (auto-injected) ────────────────────────────────
# These are set automatically by Railway plugins.
# Do NOT set them locally — the individual vars above are used instead.
# DATABASE_URL=                  # Set by Railway PostgreSQL plugin
# REDIS_URL=                     # Set by Railway Redis plugin
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add DATABASE_URL and REDIS_URL to .env.example"
```

---

### Task 9: Verify Docker builds work end-to-end

**Step 1: Build API image**

Run: `cd /home/voxmastery/Music/bitarena && docker build -f apps/api/Dockerfile -t betarena-api-test .`
Expected: Builds successfully, migrations compiled to JS

**Step 2: Build Web image**

Run: `cd /home/voxmastery/Music/bitarena && docker build -f apps/web/Dockerfile -t betarena-web-test .`
Expected: Builds successfully

**Step 3: Verify compiled migrations exist in API image**

Run: `docker run --rm betarena-api-test ls -la apps/api/migrations/`
Expected: List of `.js` migration files

**Step 4: Clean up test images**

Run: `docker rmi betarena-api-test betarena-web-test`

---

## Railway Dashboard Setup (manual — post-deploy)

After pushing to `main`, configure in Railway dashboard:

1. **Create new project** → "Deploy from GitHub repo"
2. **Add PostgreSQL plugin** → Railway auto-provisions and sets `DATABASE_URL`
3. **Add Redis plugin** → Railway auto-provisions and sets `REDIS_URL`
4. **Create API service:**
   - Source: GitHub repo, root directory: `/` (uses Dockerfile from railway.toml)
   - Config file: `apps/api/railway.toml`
   - Set env vars: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_SEED_PASSWORD`, `CORS_ORIGIN` (set to web URL), sports API keys
   - Reference variables: `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `REDIS_URL=${{Redis.REDIS_URL}}`
5. **Create Web service:**
   - Source: GitHub repo
   - Config file: `apps/web/railway.toml`
   - Set env vars: `NEXT_PUBLIC_API_URL=https://<api-service>.up.railway.app`, `NEXT_PUBLIC_WS_URL=wss://<api-service>.up.railway.app`
6. **Run seed** (one-time): Railway shell → `knex seed:run --knexfile apps/api/dist/config/knexfile.js`
