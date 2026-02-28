# BetArena Production Readiness — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring BetArena from 4.8/10 to 9/10 production readiness by fixing critical blockers, integrating real sports data, adding tests, and setting up CI/CD.

**Architecture:** Monorepo with `apps/api` (Express + Knex + PostgreSQL + Redis + Socket.IO) and `apps/web` (Next.js 14 + Zustand + Tailwind). Backend is solid. Frontend has structural gaps: bet placement is broken, socket listeners partially implemented, no tests, no CI/CD.

**Tech Stack:** TypeScript, Next.js 14, Express, PostgreSQL, Redis (ioredis), Socket.IO, Zustand, Knex, Axios, Winston (already configured), Radix UI toast (already configured).

---

## Codebase Validation Report

Before executing, understand these corrections to the original readiness doc:

| Original Claim | Actual Finding |
|----------------|----------------|
| "Credit Management UI: Zero UI exists" | **WRONG** — Full admin credits page exists at `apps/web/src/app/(admin)/admin/credits/page.tsx` (125 lines) with create, assign, and ledger |
| "Socket: zero listeners" | **PARTIALLY WRONG** — Event detail pages (tennis, basketball, golf, esports, cricket) DO register `event:update` and `odds:update` listeners. SocketBootstrap itself has no global listeners. |
| "Replace console.log with Winston" | **ALREADY DONE** — Winston configured at `apps/api/src/config/logger.ts`. Only 2 console.logs remain (both in `apps/api/src/config/redis.ts`) |
| "Token cookie/localStorage mismatch" | **LESS SEVERE** — Backend login DOES set `access_token` httpOnly cookie. Middleware reads it. Both pathways exist. May still have edge cases. |
| "Frontend also stores token in localStorage" | **TRUE** — `authStore.ts` stores in `localStorage.setItem('accessToken', ...)` and API client reads from there |
| "BetSlipPick missing event_id" | **TRUE** — Pick has `{id, market, selection, odds}` but API needs `{event_id, market_type, selection_name, odds}` |

---

## PHASE 1 — Critical Blockers

### Task 1: Enrich BetSlipPick with API-compatible fields

The bet slip pick interface only has `{id, market, selection, odds}`. The backend `POST /api/bets` expects `{event_id, market_type, selection_name, odds}`. We must bridge this gap before wiring up the Place Bet button.

**Files:**
- Modify: `apps/web/src/stores/betSlipStore.ts:6-11`

**Step 1: Update BetSlipPick interface**

Add `eventId` and `marketType` to the pick shape:

```typescript
export interface BetSlipPick {
  id: string;
  eventId: number;
  market: string;
  marketType: string;
  selection: string;
  odds: number;
}
```

**Step 2: Verify event pages pass enriched picks**

Check each event detail page that calls `toggleSharedPick`. The `onPick` callback currently builds:
```typescript
{ id: s.id, market: g.title, selection: s.name, odds: s.odds }
```

Each event page must also pass `eventId` (from the URL param) and `marketType` (from the market object). Update every event page's `onPick` call to include these fields.

Files to update (search for `onPick({` in each):
- `apps/web/src/app/(member)/sports/tennis/[eventId]/page.tsx`
- `apps/web/src/app/(member)/sports/basketball/[eventId]/page.tsx`
- `apps/web/src/app/(member)/sports/golf/[eventId]/page.tsx`
- `apps/web/src/app/(member)/sports/esports/[eventId]/page.tsx`
- `apps/web/src/app/(member)/sports/cricket/[eventId]/page.tsx`

In each file, find:
```typescript
onClick={() => onPick({ id: s.id, market: g.title, selection: s.name, odds: s.odds })}
```
Replace with:
```typescript
onClick={() => onPick({ id: s.id, eventId: Number(eventId), market: g.title, marketType: g.type || g.title.toLowerCase().replace(/\s+/g, '_'), selection: s.name, odds: s.odds })}
```

Also check variant-export pages that reference the bet slip for the same pattern.

**Step 3: Verify the app compiles**

Run: `cd /home/voxmastery/Music/bitarena/apps/web && npx tsc --noEmit`
Expected: No type errors related to BetSlipPick

**Step 4: Commit**

```
feat: enrich BetSlipPick with eventId and marketType for API compatibility
```

---

### Task 2: Wire up Place Bet button

The core product flow. The Place Bet button at `MemberGlobalChrome.tsx:63-70` checks auth then does nothing. The backend `POST /api/bets` is fully implemented with balance deduction, odds snapshot, and transaction logging.

**Files:**
- Modify: `apps/web/src/components/app/MemberGlobalChrome.tsx:1-116`

**Step 1: Add imports and state**

At top of file, add:
```typescript
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
```

Add state inside the component:
```typescript
const [isPlacing, setIsPlacing] = useState(false);
const clearPicks = useBetSlipStore((s) => s.clearPicks);
```

**Step 2: Implement the place bet handler**

Replace the empty onClick (lines 63-66):
```typescript
onClick={() => {
  if (triggerLoginForProtectedAction()) return;
}}
```

With:
```typescript
onClick={async () => {
  if (triggerLoginForProtectedAction()) return;
  if (picks.length === 0 || isPlacing) return;

  const stakeNum = Number(stake);
  if (!stakeNum || stakeNum <= 0) {
    toast({ title: 'Invalid stake', description: 'Enter a valid stake amount', variant: 'destructive' });
    return;
  }

  setIsPlacing(true);
  try {
    const betType = picks.length === 1 ? 'single' : 'accumulator';
    const selections = picks.map((p) => ({
      event_id: p.eventId,
      market_type: p.marketType,
      selection_name: p.selection,
      odds: p.odds,
    }));

    await apiPost('/api/bets', { type: betType, stake: stakeNum, selections });

    toast({ title: 'Bet Placed!', description: `${betType === 'single' ? 'Single' : 'Accumulator'} bet of ${stakeNum} placed successfully` });
    clearPicks();
    router.push('/my-bets');
  } catch (err: unknown) {
    const msg = (err as any)?.response?.data?.message || 'Failed to place bet';
    const friendly: Record<string, string> = {
      INSUFFICIENT_BALANCE: 'Insufficient balance. Please add credits.',
      INVALID_STAKE: 'Invalid stake amount.',
      NO_SELECTIONS: 'No selections in bet slip.',
    };
    toast({ title: 'Bet Failed', description: friendly[msg] || msg, variant: 'destructive' });
  } finally {
    setIsPlacing(false);
  }
}}
```

**Step 3: Update button text to show loading state**

Replace the button text:
```typescript
{isPlacing ? 'Placing...' : `Place Bet${picks.length > 0 ? ` (${picks.length})` : ''}`}
```

Add disabled state:
```typescript
disabled={isPlacing || picks.length === 0}
className="mt-3 w-full rounded-lg bg-[#00C37B] py-2.5 text-sm font-bold text-[#0B0E1A] disabled:opacity-50"
```

**Step 4: Test manually**

1. Login as member
2. Navigate to any event page
3. Click an odds button to add pick to slip
4. Enter stake
5. Click Place Bet
6. Verify: API call succeeds, toast appears, redirected to /my-bets, balance deducted

**Step 5: Commit**

```
feat: wire up Place Bet button to POST /api/bets with loading state and error handling
```

---

### Task 3: Add socket authentication middleware

Backend accepts all socket connections with no JWT verification. Frontend already passes `auth: { token }` on connect (`apps/web/src/lib/socket.ts:24-26`), but the server ignores it.

**Files:**
- Modify: `apps/api/src/socket.ts:1-42`

**Step 1: Add JWT import and auth middleware**

Add to imports at top:
```typescript
import jwt from 'jsonwebtoken';
import { env } from './config/env';
```

Add auth middleware before the `io.on('connection')` handler:
```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
    || socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: number; role: string };
    socket.data.user = decoded;
    socket.data.role = decoded.role;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});
```

**Step 2: Add room access control**

Inside the `connection` handler, update the `join:event` listener to check role:
```typescript
socket.on('join:event', (eventId: string) => {
  if (!socket.data.user) return;
  socket.join(`event:${eventId}`);
  logger.debug('Socket joined event room', { socketId: socket.id, eventId, userId: socket.data.user.id });
});
```

**Step 3: Add reconnection handling on frontend**

Modify `apps/web/src/lib/socket.ts` — add error listener in `connectSocket`:
```typescript
s.on('connect_error', (err) => {
  if (err.message === 'Authentication required' || err.message === 'Invalid or expired token') {
    const freshToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (freshToken) {
      s.auth = { token: freshToken };
    }
  }
});
```

**Step 4: Verify the backend compiles**

Run: `cd /home/voxmastery/Music/bitarena/apps/api && npx tsc --noEmit`

**Step 5: Commit**

```
feat: add JWT authentication middleware to Socket.IO server
```

---

### Task 4: Remove hardcoded admin password from seed

**Files:**
- Modify: `apps/api/seeds/001_admin_user.ts:1-35`

**Step 1: Read password from environment variable**

Replace line 11:
```typescript
const passwordHash = await bcrypt.hash('admin123!', 12);
```

With:
```typescript
const password = process.env.ADMIN_SEED_PASSWORD;
if (!password) {
  throw new Error('ADMIN_SEED_PASSWORD environment variable is required to run seeds');
}
const passwordHash = await bcrypt.hash(password, 12);
```

**Step 2: Replace console.log with logger (while we're here)**

Replace lines 8 and 33:
```typescript
// line 8 — replace console.log with early return message
console.log('Admin user already exists, skipping seed.');
// line 33
console.log(`Admin user created: username=admin, display_id=1, id=${admin.id}`);
```

Actually, seed files run standalone (not in Express context), so `console.log` is appropriate here. Leave them as-is.

**Step 3: Add to .env.example**

Check if `.env.example` exists in `apps/api/`. If so, add:
```
ADMIN_SEED_PASSWORD=change_this_before_running_seeds
```

If it doesn't exist, create it with this line plus placeholders for all other env vars.

**Step 4: Verify .env is in .gitignore**

Check both root `.gitignore` and `apps/api/.gitignore` for `.env` entries.

**Step 5: Commit**

```
fix: remove hardcoded admin password from seed file, require env var
```

---

### Task 5: Add 429 rate limit handling to API client

**Files:**
- Modify: `apps/web/src/lib/api.ts:36-90`

**Step 1: Add 429 handling to existing response interceptor**

The current interceptor only handles 401. Add 429 handling before the 401 check. In the error handler of `api.interceptors.response.use`, before the `status !== 401` check:

```typescript
async (error) => {
  // Rate limit handling
  if (error.response?.status === 429) {
    const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
    const { toast } = await import('@/hooks/use-toast');
    toast({ title: 'Too many requests', description: `Please wait ${retryAfter}s before retrying.`, variant: 'destructive' });
    return Promise.reject(error);
  }

  const original = error.config as AxiosRequestConfig & { _retry?: boolean };
  // ... rest of existing 401 handler
```

**Step 2: Verify it compiles**

Run: `cd /home/voxmastery/Music/bitarena/apps/web && npx tsc --noEmit`

**Step 3: Commit**

```
feat: add 429 rate limit handling to Axios response interceptor
```

---

### Task 6: Fix remaining console.logs in backend

Only 2 remain in `apps/api/src/config/redis.ts`. Replace with logger.

**Files:**
- Modify: `apps/api/src/config/redis.ts`

**Step 1: Replace console.log/console.error with logger**

Import logger at top:
```typescript
import logger from './logger';
```

Replace any `console.log(...)` with `logger.info(...)` and `console.error(...)` with `logger.error(...)`.

**Step 2: Commit**

```
fix: replace remaining console.log calls with Winston logger in redis config
```

---

## PHASE 2 — Sports API Integration

### Task 7: Create sports-data module directory structure

**Files:**
- Create: `apps/api/src/modules/sports-data/providers/api-football.ts`
- Create: `apps/api/src/modules/sports-data/providers/espn-hidden.ts`
- Create: `apps/api/src/modules/sports-data/providers/thesportsdb.ts`
- Create: `apps/api/src/modules/sports-data/providers/cricket-data.ts`
- Create: `apps/api/src/modules/sports-data/providers/oddspapi.ts`
- Create: `apps/api/src/modules/sports-data/providers/the-odds-api.ts`
- Create: `apps/api/src/modules/sports-data/normalizer/normalizer.ts`
- Create: `apps/api/src/modules/sports-data/cache/redis-strategy.ts`
- Create: `apps/api/src/modules/sports-data/scheduler/cron-jobs.ts`
- Create: `apps/api/src/modules/sports-data/index.ts`

**Step 1: Create directories**

```bash
mkdir -p apps/api/src/modules/sports-data/{providers,normalizer,cache,scheduler}
```

**Step 2: Create shared types file**

Create `apps/api/src/modules/sports-data/types.ts` with the normalized interfaces:

```typescript
export interface LiveEvent {
  id: string;
  sport: 'football' | 'basketball' | 'tennis' | 'cricket' | 'golf' | 'esports';
  competition: { id: string; name: string; logo?: string };
  homeTeam: { id: string; name: string; badge?: string };
  awayTeam: { id: string; name: string; badge?: string };
  score: { home: number; away: number };
  clock: string;
  status: 'pre' | 'live' | 'ht' | 'ft';
  startTime: Date;
  stats?: Record<string, string>;
  markets: Market[];
  source: string;
  lastUpdated: Date;
}

export interface Market {
  id: string;
  name: string;
  selections: Selection[];
}

export interface Selection {
  id: string;
  name: string;
  odds: number;
  bookmaker: string;
  suspended: boolean;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  dailyLimit?: number;
  rateLimitMs?: number;
}
```

**Step 3: Create stub index.ts**

```typescript
export { SportsDataService } from './sports-data.service';
```

**Step 4: Commit**

```
feat: create sports-data module directory structure and shared types
```

---

### Task 8: Build Redis caching strategy

This is needed by all providers, so build it first.

**Files:**
- Create: `apps/api/src/modules/sports-data/cache/redis-strategy.ts`

**Step 1: Implement cache-first fetch pattern**

```typescript
import redis from '../../../config/redis';
import logger from '../../../config/logger';

export const CACHE_TTL = {
  LIVE_SCORE: 15,
  LIVE_ODDS: 15,
  LIVE_CRICKET: 30,
  PRE_MATCH_ODDS: 60,
  FIXTURES: 30 * 60,
  COMPETITION: 2 * 60 * 60,
  STANDINGS: 2 * 60 * 60,
  TEAM: 24 * 60 * 60,
  PLAYER: 24 * 60 * 60,
  RESULTS: 7 * 24 * 60 * 60,
} as const;

export async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn('Redis cache read error', { key, error: (err as Error).message });
  }

  const fresh = await fetchFn();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
  } catch (err) {
    logger.warn('Redis cache write error', { key, error: (err as Error).message });
  }

  return fresh;
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Daily budget tracking
export async function incrementDailyCounter(provider: string): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  const key = `${provider}:daily_count:${date}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expireat(key, Math.floor(Date.now() / 1000) + 86400);
  }
  return count;
}

export async function getDailyCount(provider: string): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  const key = `${provider}:daily_count:${date}`;
  const count = await redis.get(key);
  return count ? parseInt(count, 10) : 0;
}
```

**Step 2: Commit**

```
feat: add Redis caching strategy with TTL config and daily budget tracking
```

---

### Task 9: API-Football provider (live scores)

**Files:**
- Create: `apps/api/src/modules/sports-data/providers/api-football.ts`

**Step 1: Implement provider**

```typescript
import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch, incrementDailyCounter, getDailyCount, CACHE_TTL } from '../cache/redis-strategy';
import type { LiveEvent } from '../types';

const BASE_URL = 'https://v3.football.api-sports.io';
const DAILY_LIMIT = 100;
const WARNING_THRESHOLD = 80;
const SOFT_CAP = 90;

function getApiKey(): string {
  const key = process.env.APISPORTS_KEY;
  if (!key) throw new Error('APISPORTS_KEY env var not set');
  return key;
}

async function guardedFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const count = await getDailyCount('apisports');
  if (count >= SOFT_CAP) {
    logger.warn('API-Football daily limit approaching, serving cache only', { count, limit: DAILY_LIMIT });
    return null;
  }
  if (count >= WARNING_THRESHOLD) {
    logger.warn('API-Football usage high', { count, limit: DAILY_LIMIT });
  }

  await incrementDailyCounter('apisports');

  const { data } = await axios.get(`${BASE_URL}${endpoint}`, {
    headers: { 'x-apisports-key': getApiKey() },
    params,
    timeout: 10_000,
  });

  return data.response as T;
}

export async function getLiveFixtures(): Promise<unknown[]> {
  return getCachedOrFetch('live:events:football', CACHE_TTL.LIVE_SCORE, async () => {
    const result = await guardedFetch<unknown[]>('/fixtures', { live: 'all' });
    return result || [];
  });
}

export async function getTodayFixtures(): Promise<unknown[]> {
  const today = new Date().toISOString().slice(0, 10);
  return getCachedOrFetch(`fixtures:${today}:football`, CACHE_TTL.FIXTURES, async () => {
    const result = await guardedFetch<unknown[]>('/fixtures', { date: today });
    return result || [];
  });
}

export async function getFixture(fixtureId: string): Promise<unknown | null> {
  return getCachedOrFetch(`live:score:${fixtureId}`, CACHE_TTL.LIVE_SCORE, async () => {
    const result = await guardedFetch<unknown[]>('/fixtures', { id: fixtureId });
    return result?.[0] || null;
  });
}

export async function getStandings(leagueId: string, season: string): Promise<unknown[]> {
  return getCachedOrFetch(`standings:${leagueId}`, CACHE_TTL.STANDINGS, async () => {
    const result = await guardedFetch<unknown[]>('/standings', { league: leagueId, season });
    return result || [];
  });
}
```

**Step 2: Commit**

```
feat: add API-Football provider with daily budget tracking and caching
```

---

### Task 10: ESPN Hidden API provider (US sports)

**Files:**
- Create: `apps/api/src/modules/sports-data/providers/espn-hidden.ts`

**Step 1: Implement provider**

```typescript
import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch, CACHE_TTL } from '../cache/redis-strategy';

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

const SPORT_PATHS: Record<string, string> = {
  nba: '/basketball/nba/scoreboard',
  nfl: '/football/nfl/scoreboard',
  nhl: '/hockey/nhl/scoreboard',
  mlb: '/baseball/mlb/scoreboard',
  epl: '/soccer/eng.1/scoreboard',
  ucl: '/soccer/uefa.champions_league/scoreboard',
};

async function fetchESPN(path: string): Promise<unknown> {
  try {
    const { data } = await axios.get(`${BASE_URL}${path}`, { timeout: 10_000 });
    return data;
  } catch (err) {
    logger.error('ESPN API error', { path, error: (err as Error).message });
    return null;
  }
}

export async function getScoreboard(sport: string): Promise<unknown> {
  const path = SPORT_PATHS[sport];
  if (!path) {
    logger.warn('Unknown ESPN sport', { sport });
    return null;
  }

  return getCachedOrFetch(`live:events:espn:${sport}`, CACHE_TTL.LIVE_SCORE * 2, async () => {
    return fetchESPN(path);
  });
}

export async function getAllUSScoreboards(): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};
  for (const [sport, path] of Object.entries(SPORT_PATHS)) {
    results[sport] = await getCachedOrFetch(`live:events:espn:${sport}`, CACHE_TTL.LIVE_SCORE * 2, async () => {
      return fetchESPN(path);
    });
  }
  return results;
}
```

**Step 2: Commit**

```
feat: add ESPN Hidden API provider for US sports scores
```

---

### Task 11: TheSportsDB provider (static data)

**Files:**
- Create: `apps/api/src/modules/sports-data/providers/thesportsdb.ts`

**Step 1: Implement provider with rate limiting**

```typescript
import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch, CACHE_TTL } from '../cache/redis-strategy';

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/123';
const RATE_LIMIT_MS = 100;

let lastCallTime = 0;

async function rateLimitedFetch<T>(endpoint: string): Promise<T | null> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastCallTime = Date.now();

  try {
    const { data } = await axios.get(`${BASE_URL}${endpoint}`, { timeout: 10_000 });
    return data as T;
  } catch (err) {
    logger.error('TheSportsDB API error', { endpoint, error: (err as Error).message });
    return null;
  }
}

export async function searchTeam(name: string): Promise<unknown> {
  return getCachedOrFetch(`team:search:${name}`, CACHE_TTL.TEAM, async () => {
    const data = await rateLimitedFetch<{ teams: unknown[] }>(`/searchteams.php?t=${encodeURIComponent(name)}`);
    return data?.teams?.[0] || null;
  });
}

export async function getTeam(teamId: string): Promise<unknown> {
  return getCachedOrFetch(`team:${teamId}`, CACHE_TTL.TEAM, async () => {
    const data = await rateLimitedFetch<{ teams: unknown[] }>(`/lookupteam.php?id=${teamId}`);
    return data?.teams?.[0] || null;
  });
}

export async function getLeague(leagueId: string): Promise<unknown> {
  return getCachedOrFetch(`competition:${leagueId}`, CACHE_TTL.COMPETITION, async () => {
    const data = await rateLimitedFetch<{ leagues: unknown[] }>(`/lookupleague.php?id=${leagueId}`);
    return data?.leagues?.[0] || null;
  });
}

export async function getPastResults(leagueId: string): Promise<unknown[]> {
  const date = new Date().toISOString().slice(0, 10);
  return getCachedOrFetch(`results:${leagueId}:${date}`, CACHE_TTL.RESULTS, async () => {
    const data = await rateLimitedFetch<{ events: unknown[] }>(`/eventspastleague.php?id=${leagueId}`);
    return data?.events || [];
  });
}

export async function getUpcomingFixtures(leagueId: string): Promise<unknown[]> {
  return getCachedOrFetch(`fixtures:upcoming:${leagueId}`, CACHE_TTL.FIXTURES, async () => {
    const data = await rateLimitedFetch<{ events: unknown[] }>(`/eventsnextleague.php?id=${leagueId}`);
    return data?.events || [];
  });
}
```

**Step 2: Commit**

```
feat: add TheSportsDB provider for team badges and static data
```

---

### Task 12: CricketData.org provider

**Files:**
- Create: `apps/api/src/modules/sports-data/providers/cricket-data.ts`

**Step 1: Implement provider with daily budget**

```typescript
import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch, incrementDailyCounter, getDailyCount, CACHE_TTL } from '../cache/redis-strategy';

const BASE_URL = 'https://api.cricketdata.org/api/v1';
const DAILY_LIMIT = 100;
const SOFT_CAP = 90;

function getApiKey(): string {
  const key = process.env.CRICKET_API_KEY;
  if (!key) throw new Error('CRICKET_API_KEY env var not set');
  return key;
}

async function guardedFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const count = await getDailyCount('cricket');
  if (count >= SOFT_CAP) {
    logger.warn('CricketData daily limit approaching, serving cache only', { count });
    return null;
  }

  await incrementDailyCounter('cricket');

  const { data } = await axios.get(`${BASE_URL}${endpoint}`, {
    headers: { 'x-cricketdata-token': getApiKey() },
    params,
    timeout: 10_000,
  });

  return data.data as T;
}

export async function getCurrentMatches(): Promise<unknown[]> {
  return getCachedOrFetch('live:cricket:all', CACHE_TTL.LIVE_CRICKET, async () => {
    const result = await guardedFetch<unknown[]>('/currentMatches');
    return result || [];
  });
}

export async function getMatchInfo(matchId: string): Promise<unknown | null> {
  return getCachedOrFetch(`live:cricket:${matchId}`, CACHE_TTL.LIVE_SCORE, async () => {
    const result = await guardedFetch<unknown>(`/match-info`, { id: matchId });
    return result || null;
  });
}

export async function getSeries(): Promise<unknown[]> {
  return getCachedOrFetch('cricket:series', CACHE_TTL.COMPETITION, async () => {
    const result = await guardedFetch<unknown[]>('/series');
    return result || [];
  });
}
```

**Step 2: Commit**

```
feat: add CricketData.org provider with daily budget tracking
```

---

### Task 13: OddsPapi provider (primary odds)

**Files:**
- Create: `apps/api/src/modules/sports-data/providers/oddspapi.ts`

**Step 1: Implement provider**

```typescript
import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch, CACHE_TTL } from '../cache/redis-strategy';

const BASE_URL = 'https://api.oddspapi.io/v4';

function getApiKey(): string {
  const key = process.env.ODDSPAPI_KEY;
  if (!key) throw new Error('ODDSPAPI_KEY env var not set');
  return key;
}

async function fetchOdds<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  try {
    const { data } = await axios.get(`${BASE_URL}${endpoint}`, {
      params: { apiKey: getApiKey(), ...params },
      timeout: 10_000,
    });
    return data as T;
  } catch (err) {
    logger.error('OddsPapi API error', { endpoint, error: (err as Error).message });
    return null;
  }
}

export async function getSports(): Promise<unknown[]> {
  return getCachedOrFetch('oddspapi:sports', CACHE_TTL.COMPETITION, async () => {
    const result = await fetchOdds<unknown[]>('/sports');
    return result || [];
  });
}

export async function getPreMatchOdds(sportId: string): Promise<unknown[]> {
  return getCachedOrFetch(`odds:prematch:${sportId}`, CACHE_TTL.PRE_MATCH_ODDS, async () => {
    const result = await fetchOdds<unknown[]>('/odds', { sportId });
    return result || [];
  });
}

export async function getLiveOdds(sportId: string): Promise<unknown[]> {
  return getCachedOrFetch(`live:odds:${sportId}`, CACHE_TTL.LIVE_ODDS, async () => {
    const result = await fetchOdds<unknown[]>('/odds', { live: 'true', sportId });
    return result || [];
  });
}

export async function getEventOdds(eventId: string): Promise<unknown | null> {
  return getCachedOrFetch(`live:odds:${eventId}:all`, CACHE_TTL.LIVE_ODDS, async () => {
    const result = await fetchOdds<unknown>('/odds', { eventId });
    return result || null;
  });
}
```

**Step 2: Commit**

```
feat: add OddsPapi provider for primary odds data
```

---

### Task 14: The Odds API provider (backup odds)

**Files:**
- Create: `apps/api/src/modules/sports-data/providers/the-odds-api.ts`

**Step 1: Implement provider with credit tracking**

```typescript
import axios from 'axios';
import logger from '../../../config/logger';
import redis from '../../../config/redis';
import { getCachedOrFetch, CACHE_TTL } from '../cache/redis-strategy';

const BASE_URL = 'https://api.the-odds-api.com/v4';

function getApiKey(): string {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error('ODDS_API_KEY env var not set');
  return key;
}

async function fetchWithCreditTracking<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await axios.get(`${BASE_URL}${endpoint}`, {
      params: { apiKey: getApiKey(), ...params },
      timeout: 10_000,
    });

    const remaining = res.headers['x-requests-remaining'];
    if (remaining !== undefined) {
      await redis.setex('oddsapi:remaining', 3600, String(remaining));
      logger.info('Odds API backup used', { remaining });
    }

    return res.data as T;
  } catch (err) {
    logger.error('The Odds API error', { endpoint, error: (err as Error).message });
    return null;
  }
}

export async function getRemainingCredits(): Promise<number> {
  const val = await redis.get('oddsapi:remaining');
  return val ? parseInt(val, 10) : -1;
}

export async function getOddsForSport(sport: string): Promise<unknown[]> {
  return getCachedOrFetch(`oddsapi:backup:${sport}`, CACHE_TTL.PRE_MATCH_ODDS, async () => {
    const result = await fetchWithCreditTracking<unknown[]>(
      `/sports/${sport}/odds`,
      { regions: 'uk,eu', markets: 'h2h,spreads,totals', bookmakers: 'bet365,pinnacle,williamhill' },
    );
    return result || [];
  });
}
```

**Step 2: Commit**

```
feat: add The Odds API backup provider with credit tracking
```

---

### Task 15: Data normalizer

**Files:**
- Create: `apps/api/src/modules/sports-data/normalizer/normalizer.ts`

**Step 1: Implement normalizer functions**

Build mapping functions for each provider to our `LiveEvent` interface. Each function takes raw API response and returns normalized `LiveEvent` or `Market[]`. Reference the `types.ts` interfaces from Task 7.

Key mappings:
- `normalizeApiFootball(raw)` → `LiveEvent`
- `normalizeESPN(raw)` → `LiveEvent`
- `normalizeCricket(raw)` → `LiveEvent`
- `normalizeOddsPapi(raw)` → `Market[]`
- `normalizeOddsApi(raw)` → `Market[]`

Each normalizer must:
1. Map provider-specific field names to our interface
2. Convert odds to decimal format
3. Set `source` field to provider name
4. Set `lastUpdated` to current time
5. Handle missing/null fields gracefully

**Step 2: Commit**

```
feat: add data normalizer for all sports API providers
```

---

### Task 16: Smart polling scheduler

**Files:**
- Create: `apps/api/src/modules/sports-data/scheduler/cron-jobs.ts`

**Step 1: Implement cron-based polling**

Use `node-cron` (already in dependencies). Implement:
- Watcher tracking via Redis (`INCR/DECR watchers:{eventId}`)
- Only poll events where `watchers:{eventId} > 0`
- Every 15s: Refresh live scores for watched events
- Every 15s: Refresh live odds for watched events
- Every 5min: Refresh pre-match odds
- Every 30min: Refresh today's fixtures
- Daily midnight: Reset API daily counters

After each refresh, broadcast via Socket.IO:
```typescript
io.to(`event:${eventId}`).emit('live:update', normalizedData);
io.to(`event:${eventId}`).emit('odds:update', oddsData);
```

Budget protection:
- Skip polling if `apisports_count >= 90`
- Skip polling if `cricket_count >= 90`

**Step 2: Wire up watcher tracking in socket.ts**

In `apps/api/src/socket.ts`, on `join:event`:
```typescript
await redis.incr(`watchers:${eventId}`);
```
On `leave:event` and `disconnect`:
```typescript
await redis.decr(`watchers:${eventId}`);
```

**Step 3: Commit**

```
feat: add smart polling scheduler with watcher-based API calls
```

---

### Task 17: Connect sports data to existing API routes

**Files:**
- Modify: `apps/api/src/modules/sports/sports.service.ts`
- Modify: `apps/api/src/modules/sports/sports.routes.ts`

**Step 1: Update service to use real data providers**

Import from sports-data module. Update each service function to:
1. Try real provider first (via cache)
2. Fall back to existing DB data if provider fails
3. Remove `Math.random()` odds generation (if any exists)

Routes to update:
- `GET /api/sports/live` → use sports-data providers
- `GET /api/sports/events/:id/markets` → use OddsPapi
- `GET /api/sports` → merge provider data with DB

**Step 2: Create SportsDataService facade**

Create `apps/api/src/modules/sports-data/sports-data.service.ts` that orchestrates all providers and normalizes data into a single API.

**Step 3: Commit**

```
feat: connect sports data providers to existing API routes
```

---

## PHASE 3 — High Severity Fixes

### Task 18: Add React Error Boundaries

**Files:**
- Create: `apps/web/src/components/ErrorBoundary.tsx`
- Modify: `apps/web/src/app/(member)/layout.tsx`
- Modify: `apps/web/src/app/(agent)/layout.tsx`
- Modify: `apps/web/src/app/(admin)/layout.tsx`

**Step 1: Create ErrorBoundary component**

```typescript
'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0E1A] text-white">
          <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre className="mb-4 max-w-lg overflow-auto rounded bg-[#1A2235] p-4 text-sm text-red-400">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-[#00C37B] px-4 py-2 font-bold text-[#0B0E1A]"
            >
              Reload Page
            </button>
            <a href="/" className="rounded border border-[#1E293B] px-4 py-2">
              Go Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Step 2: Wrap each route layout**

In each layout file, wrap `{children}` with `<ErrorBoundary>`.

**Step 3: Commit**

```
feat: add React Error Boundaries to all route layouts
```

---

### Task 19: Add React Query for data fetching

**Files:**
- Modify: `apps/web/package.json` (add dependency)
- Create: `apps/web/src/lib/query-client.ts`
- Modify: `apps/web/src/app/layout.tsx` (add QueryClientProvider)

**Step 1: Install React Query**

```bash
cd apps/web && npm install @tanstack/react-query
```

**Step 2: Create query client config**

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

**Step 3: Wrap root layout with QueryProvider**

In `apps/web/src/app/layout.tsx`, wrap children with `<QueryProvider>`.

**Step 4: Migrate key pages to useQuery**

Priority pages to migrate (replace `useEffect + fetch` patterns):
- Sports lobby page
- My Bets page
- Admin dashboard
- Agent dashboard (if source is available, not variant export)

**Step 5: Commit**

```
feat: add React Query with QueryProvider and migrate key pages
```

---

## PHASE 4 — Testing

### Task 20: Install test frameworks

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`
- Create: `apps/api/jest.config.ts`
- Create: `apps/web/vitest.config.ts`

**Step 1: Install backend test deps**

```bash
cd apps/api && npm install -D jest @types/jest ts-jest supertest @types/supertest
```

**Step 2: Create jest.config.ts for API**

```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
```

**Step 3: Install frontend test deps**

```bash
cd apps/web && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

**Step 4: Create vitest.config.ts for Web**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

**Step 5: Create test setup file**

Create `apps/web/src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

**Step 6: Add test scripts to root package.json**

```json
"test": "npm run test:api && npm run test:web",
"test:api": "cd apps/api && npx jest",
"test:web": "cd apps/web && npx vitest run"
```

**Step 7: Commit**

```
feat: install Jest (API) and Vitest (Web) test frameworks
```

---

### Task 21: Write critical API tests

**Files:**
- Create: `apps/api/src/modules/auth/__tests__/auth.test.ts`
- Create: `apps/api/src/modules/bets/__tests__/bets.test.ts`
- Create: `apps/api/src/modules/credits/__tests__/credits.test.ts`

**Step 1: Write auth tests**

Test cases:
- POST /api/auth/login with valid credentials → 200 + token
- POST /api/auth/login with wrong password → 401
- GET /api/auth/me with valid token → 200 + user data
- GET /api/auth/me with no token → 401

Use `supertest` against the Express app. Create a test helper that sets up a test database or mocks Knex.

**Step 2: Write bets tests**

Test cases:
- POST /api/bets with valid selection → 201 + bet created
- POST /api/bets with insufficient balance → 400
- POST /api/bets with no selections → 400
- POST /api/bets/:uid/cashout → 200 + credits returned

**Step 3: Write credits tests**

Test cases:
- POST /api/admin/credits/create → 200 + balance increases
- POST /api/credits/transfer valid → 200 + balance deducted from sender
- POST /api/credits/transfer over balance → 400
- Member accessing admin credits → 403

**Step 4: Run all tests**

```bash
cd apps/api && npx jest --verbose
```

**Step 5: Commit**

```
test: add critical API tests for auth, bets, and credits modules
```

---

### Task 22: Write critical frontend tests

**Files:**
- Create: `apps/web/src/__tests__/BetSlip.test.tsx`
- Create: `apps/web/src/__tests__/OddsButton.test.tsx`

**Step 1: Write BetSlip tests**

Test cases:
- Renders empty state when no picks
- Adding a pick shows it in the slip
- Stake input updates potential returns
- Remove button removes a pick
- Clear all removes everything

**Step 2: Write OddsButton tests** (if component exists)

Test cases:
- Renders odds in correct format
- Click triggers togglePick
- Selected state has active styling

**Step 3: Run tests**

```bash
cd apps/web && npx vitest run --reporter=verbose
```

**Step 4: Commit**

```
test: add critical frontend tests for BetSlip and OddsButton
```

---

## PHASE 5 — DevOps

### Task 23: Create Dockerfiles

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`

**Step 1: Create API Dockerfile (multi-stage)**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

**Step 2: Create Web Dockerfile (multi-stage)**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

**Step 3: Commit**

```
feat: add multi-stage Dockerfiles for API and Web apps
```

---

### Task 24: Create GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint --workspaces --if-present
      - run: npx tsc --noEmit --project apps/api/tsconfig.json
      - run: npx tsc --noEmit --project apps/web/tsconfig.json

  test:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: betarena_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: cd apps/api && npx jest --ci
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/betarena_test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret
      - run: cd apps/web && npx vitest run

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build --workspaces --if-present
```

**Step 2: Commit**

```
feat: add GitHub Actions CI/CD pipeline with lint, test, and build
```

---

### Task 25: Create production environment templates

**Files:**
- Create: `apps/api/.env.example`
- Create: `apps/web/.env.example`

**Step 1: Create API env template**

List all required env vars with placeholder values. Include comments explaining each.

**Step 2: Create Web env template**

```
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_WS_URL=https://yourdomain.com
NODE_ENV=production
```

**Step 3: Verify .gitignore covers .env files**

**Step 4: Commit**

```
feat: add .env.example files for API and Web apps
```

---

## Execution Order Summary

```
Phase 1 — Critical Blockers (Tasks 1-6)
  1. Enrich BetSlipPick with eventId/marketType
  2. Wire up Place Bet button
  3. Add socket authentication
  4. Remove hardcoded admin password
  5. Add 429 rate limit handling
  6. Fix remaining console.logs

Phase 2 — Sports API Integration (Tasks 7-17)
  7.  Create module directory + types
  8.  Redis caching strategy
  9.  API-Football provider
  10. ESPN Hidden API provider
  11. TheSportsDB provider
  12. CricketData.org provider
  13. OddsPapi provider (primary odds)
  14. The Odds API provider (backup)
  15. Data normalizer
  16. Smart polling scheduler
  17. Connect to existing routes

Phase 3 — High Severity Fixes (Tasks 18-19)
  18. React Error Boundaries
  19. React Query integration

Phase 4 — Testing (Tasks 20-22)
  20. Install test frameworks
  21. Critical API tests
  22. Critical frontend tests

Phase 5 — DevOps (Tasks 23-25)
  23. Dockerfiles
  24. GitHub Actions CI/CD
  25. Production env templates
```

---

## Notes

- **Not a git repo**: Project at `/home/voxmastery/Music/bitarena` is not initialized as a git repository. Run `git init` before starting.
- **Variant exports are compiled**: Agent dashboard, login, and several pages are pre-compiled JS bundles in `variant-exports/`. These cannot be modified with standard source edits. Any changes to variant-exported pages require recompilation from their source.
- **Task 1.5 from original plan (Credit Management UI) is SKIPPED**: Admin credits page already fully exists. Agent credit transfer is in the variant export.
- **Task 3.4 from original plan (Winston logger) is SKIPPED**: Already implemented. Only 2 stray console.logs remain (Task 6 handles them).
- **Toast system exists**: Custom `@radix-ui/react-toast` with `useToast` hook at `apps/web/src/hooks/use-toast.ts`. Use `toast()` function from there.
