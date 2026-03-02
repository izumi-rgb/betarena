# Vercel + Railway Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy BetArena with Vercel (free) for the Next.js frontend and Railway (free) for the Express API + PostgreSQL + Redis.

**Architecture:** Two-platform split — Vercel handles SSR/static for the Next.js web app, Railway hosts the Express API with Socket.IO, cron jobs, and managed Postgres + Redis. The frontend communicates with the API via `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` env vars (already implemented).

**Tech Stack:** Vercel, Railway, Docker, Next.js 14, Express, PostgreSQL, Redis

---

### Task 1: Make `output: 'standalone'` conditional in next.config.mjs

Vercel uses its own build pipeline and doesn't need `standalone` output. Docker builds (Railway, self-hosted) still need it. We make it conditional via an environment variable.

**Files:**
- Modify: `apps/web/next.config.mjs`

**Step 1: Update next.config.mjs**

Replace the current config:

```js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.STANDALONE_BUILD === '1' ? 'standalone' : undefined,
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-router-dom': path.join(__dirname, 'src/shims/react-router-dom.tsx'),
    };
    return config;
  },
};

export default nextConfig;
```

**Step 2: Verify local dev still works**

Run: `cd apps/web && npm run build`
Expected: Build succeeds. Output should NOT contain `.next/standalone/` directory (since `STANDALONE_BUILD` is not set).

**Step 3: Commit**

```bash
git add apps/web/next.config.mjs
git commit -m "feat(web): make standalone output conditional for Vercel compatibility"
```

---

### Task 2: Update web Dockerfile to set STANDALONE_BUILD

The Docker build path (used by Railway and docker-compose) needs standalone output. Set the env var before `npm run build`.

**Files:**
- Modify: `apps/web/Dockerfile`

**Step 1: Add ENV STANDALONE_BUILD=1 before the build step**

In the build stage (Stage 2), add this line after the existing `ENV` declarations and before `RUN npm run build`:

```dockerfile
ENV STANDALONE_BUILD=1
```

The full Stage 2 should look like:

```dockerfile
# ============================================
# Stage 2: Build
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy installed dependencies from deps stage (all hoisted to root node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy root workspace files
COPY package.json package-lock.json tsconfig.base.json ./

# Copy shared package source
COPY packages/shared/ packages/shared/

# Copy web app source
COPY apps/web/ apps/web/

# Copy variant-exports (referenced by @variant-exports/* alias in tsconfig)
COPY variant-exports/ variant-exports/

# Set production environment for optimized build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV STANDALONE_BUILD=1

# Build the Next.js app (standalone output for Docker)
RUN npm run build --workspace=apps/web
```

**Step 2: Verify Docker build still works**

Run: `cd /home/voxmastery/Music/bitarena && docker build -f apps/web/Dockerfile -t betarena-web-test .`
Expected: Build succeeds. The `.next/standalone/` directory should exist in the build stage.

**Step 3: Clean up test image**

Run: `docker rmi betarena-web-test`

**Step 4: Commit**

```bash
git add apps/web/Dockerfile
git commit -m "feat(web): set STANDALONE_BUILD=1 in Dockerfile for standalone output"
```

---

### Task 3: Create vercel.json in repo root

Vercel needs to know this is a monorepo and where the Next.js app lives.

**Files:**
- Create: `vercel.json` (repo root)

**Step 1: Create the vercel.json file**

```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm ci",
  "framework": "nextjs"
}
```

Notes:
- `installCommand: "npm ci"` runs from repo root, installing all workspaces (web needs `@variant-exports/*` from the monorepo root)
- `buildCommand` changes into `apps/web` before building
- `outputDirectory` points Vercel to the Next.js output
- `framework: "nextjs"` tells Vercel to use its Next.js adapter

**Step 2: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel config for monorepo deployment"
```

---

### Task 4: Verify both build paths work

**Step 1: Verify Vercel path (no standalone)**

Run: `cd apps/web && npm run build`
Expected: Build succeeds. Check that `apps/web/.next/standalone` does NOT exist:
Run: `ls apps/web/.next/standalone 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"`
Expected: `NOT FOUND`

**Step 2: Verify Docker path (standalone)**

Run: `cd /home/voxmastery/Music/bitarena && STANDALONE_BUILD=1 npm run build --workspace=apps/web`
Expected: Build succeeds. Check that `apps/web/.next/standalone` exists:
Run: `ls apps/web/.next/standalone`
Expected: Directory listing with `server.js` and other files

**Step 3: Clean up**

Run: `rm -rf apps/web/.next`

---

## Post-Code: Platform Setup Instructions

After merging to `main`, follow these manual steps:

### Railway Setup (API + Database + Redis)

1. Go to [railway.app](https://railway.app) → Create new project → "Deploy from GitHub repo"
2. Select the `bitarena` repository
3. Add PostgreSQL plugin → Railway auto-provisions and injects `DATABASE_URL`
4. Add Redis plugin → Railway auto-provisions and injects `REDIS_URL`
5. Create API service:
   - Railway detects `apps/api/railway.toml` automatically
   - Set environment variables:
     - `JWT_SECRET` = `<generate: openssl rand -hex 32>`
     - `JWT_REFRESH_SECRET` = `<generate: openssl rand -hex 32>`
     - `CORS_ORIGIN` = `https://betarena.vercel.app` (your Vercel domain)
     - `APISPORTS_KEY` = your API-Football key (optional)
     - `CRICKET_API_KEY` = your CricketData.org key (optional)
     - `ODDS_API_KEY` = your The Odds API key (optional)
     - `ODDSPAPI_KEY` = your OddsPapi key (optional)
   - Reference variables (Railway syntax):
     - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
     - `REDIS_URL` = `${{Redis.REDIS_URL}}`
6. Deploy — Railway runs migrations automatically via the `startCommand` in `railway.toml`
7. Seed the database (one-time, in Railway shell):
   ```bash
   knex seed:run --knexfile apps/api/dist/config/knexfile.js
   ```
8. Note the API service URL (e.g., `https://betarena-api-production.up.railway.app`)

### Vercel Setup (Web Frontend)

1. Go to [vercel.com](https://vercel.com) → Import GitHub repo → select `bitarena`
2. Vercel auto-detects Next.js from `vercel.json`
3. Root directory: leave as `/` (vercel.json handles the monorepo)
4. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://<your-railway-api>.up.railway.app`
   - `NEXT_PUBLIC_WS_URL` = `wss://<your-railway-api>.up.railway.app`
5. Deploy

### Verify End-to-End

1. Open the Vercel URL in browser
2. Home page should load with featured events (fetched from Railway API)
3. Login with admin credentials (from seed)
4. Admin dashboard should show KPI cards with real data
5. Navigate to `/sports` — sports lobby should load
6. Place a test bet (as a member) — balance should update in real-time via Socket.IO

### Update CORS After Vercel Deployment

Once you know your Vercel domain, update the Railway API's `CORS_ORIGIN`:
```
CORS_ORIGIN=https://betarena.vercel.app,https://your-custom-domain.com,http://localhost:3000
```
