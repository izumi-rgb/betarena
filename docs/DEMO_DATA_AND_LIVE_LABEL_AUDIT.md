# BetArena — Demo Data & “Live” Label Audit

**Purpose:** In-depth audit of where the app uses demo/mock/placeholder data and where events or games are shown as “live” despite being outdated or static.

**Date:** 2025-03-06

---

## Quick reference (files and key lines)

| Area | File | Key lines |
|------|------|-----------|
| In-Play fallback UI | `variant-exports/variant_inplay.js` | 444–453 (fallbackItems), 453 (items = liveItems \|\| fallbackItems), 711 (useLiveData), 767 (“247 events live”), 793–824 (grid: live vs FootballCard etc), 821–823 (“243 remaining”) |
| In-Play sport filters | `variant-exports/variant_inplay.js` | 515–524 (sportFilters), 720–738 (dynamicSportFilters when !useLiveData) |
| My Bets demo cards | `variant-exports/variant_my_bets.js` | 466 (catch fallback), 478–479 (hasApiBets, openBets), 491, 504 (badges 3/2), 521–527 (Open: demo cards), 536–537 (Settled), 543–545 (Cash Out) |
| Admin Credits demo | `apps/web/src/app/admin/credits/page.tsx` | 35–43 (catch: ledger, balance, agents) |
| Seed “live” event | `apps/api/seeds/002_bet365_sports_events.ts` | 3 (comment dev/demo), 47 (status: i === 0 ? 'live' : 'scheduled') |
| Live API DB fallback | `apps/api/src/modules/sports/sports.service.ts` | 178–204 (getLiveEvents: try SportsDataService then db where status 'live') |
| Display list stale live | `apps/api/src/modules/sports-data/sports-data.service.ts` | 56–104 (mergeWithDisplayList, updated ?? old, only ft removed) |
| OddsSync simulation | `apps/api/src/jobs/oddsSync.ts` | 68 (db events status 'live'), 74–82 (runtimeState random minute), 85–93 (advance clock, maybeGenerateIncident) |
| Basketball default live | `apps/web/src/app/(member)/sports/basketball/[eventId]/page.tsx` | 401 (status \|\| 'live'), 402–412 (score, period, clock, stats fallbacks) |
| Tennis default live | `apps/web/src/app/(member)/sports/tennis/[eventId]/page.tsx` | 326 (status \|\| 'live') |
| Gaming static data | `apps/api/src/modules/gaming/gaming.service.ts` | 32–42 (LOBBY_GAMES), 44–66 (PROMOTIONS), 69+ (RACECARDS) |
| Golf/Esports demo route | `apps/web/src/app/(member)/sports/golf/page.tsx`, `esports/page.tsx` | 29 (golf demo), 25–29 (esports demo) |
| Demo disclaimer | `variant-exports/variant_login.js`, `variant_match_football.js` | 556, 484 (“Demo Platform · Virtual Credits Only”) |

---

## Summary

| Category | Location | Issue | Production risk |
|----------|----------|--------|------------------|
| **In-Play page** | variant_inplay.js | When API returns no events: hardcoded “247 events live”, fake filters, static sport cards, fake score ticker | High — users see fake “live” counts and non-bettable demo cards |
| **My Bets page** | variant_my_bets.js | On API failure: demo bet cards (AccumulatorBetCard, SingleBetCard, LiveBetCard, SettledBets) and badge counts (3 open, 2 cashout) | High — looks like real bets |
| **Admin Credits** | admin/credits/page.tsx | On API failure: demo ledger rows (Admin, Agent_20, Agent_21) and balance 92000 | Medium — admin only |
| **Seed “live” event** | seeds/002 + sports.service | First seed event is `status: 'live'`; when real providers fail, GET /api/sports/live falls back to DB and returns it forever | High — one event permanently “live” |
| **Display-list merge** | sports-data.service.ts | Old events kept in list if not in fresh feed; only `status === 'ft'` removed; no TTL on “live” → stale events can stay labeled live | Medium |
| **OddsSync simulation** | jobs/oddsSync.ts | DB events with `status: 'live'` get simulated clock (random minute, advance every ~10s) and fake incidents; not real live data | High — “live” is simulated |
| **Sport event pages** | basketball/tennis [eventId] | Default `status: normalized.status || 'live'` and fallback score/clock (e.g. 78–71, Q3, 8:42) when API missing | Medium — single event page |
| **Gaming / Casino** | gaming.service.ts | Entire lobby, promotions, racecards, virtual sports are static arrays (LOBBY_GAMES, PROMOTIONS, RACECARDS) | Low — labeled as lobby/placeholder |
| **Login / footer** | variant_login.js, variant_match_football.js | “BetArena — Demo Platform · Virtual Credits Only” in footer | Low — disclaimer |
| **Golf / Esports list** | sports/golf/page.tsx, sports/esports/page.tsx | On list failure redirect to `/sports/golf/demo` or `/sports/esports/demo` | Medium — demo route |

---

## 1. In-Play Page — Demo Data When API Fails or Empty

**File:** `variant-exports/variant_inplay.js`

- **When:** `GET /api/sports/live` fails or returns `data: []` → `liveEvents.length === 0` → `useLiveData === false`.
- **What renders:**
  - **Score Updates sidebar:** `fallbackItems` — 6 hardcoded matches (e.g. “Arsenal 2–1 Chelsea”, “Man City 1–0 Liverpool”, “Real Madrid 3–1 Atletico”, “Djokovic 2–1 Alcaraz”, “Lakers 78–71 Warriors”, “PSG 0–2 Bayern”) with fake times (78', 45', 67', 3rd, Q3, 82'). Label still shows green “Live” or “Updated 2s ago”.
  - **Header:** Text **“247 events live right now”** (line 767) when `!useLiveData`.
  - **Sport filters:** Static `sportFilters`: “All Sports 247”, “Football 89”, “Tennis 42”, “Basketball 31”, etc. (lines 515–524).
  - **Main grid:** Static **FootballCard**, **TennisCard**, **BasketballCard**, **CricketCard** (lines 808–811) — not from API; they look like live events but are fixed demo cards.
  - **Button:** “Load More Live Events (243 remaining)” (line 823) when `!useLiveData`.
- **Impact:** Users see a full “In-Play” experience that is 100% demo: fake counts, fake filters, fake score ticker, and non-bettable static cards, all labeled as “live”.

---

## 2. My Bets Page — Demo Bets When API Fails

**File:** `variant-exports/variant_my_bets.js`

- **When:** `GET /api/bets/my-bets` fails (catch block line 466: “fallback to hardcoded”) → `apiBets` stays `[]` → `hasApiBets === false`.
- **What renders:**
  - **Open Bets tab:** Demo cards: `AccumulatorBetCard`, `SingleBetCard`, `LiveBetCard`, plus `SettledBets` (lines 522–527).
  - **Tab badges:** “3” on Open Bets and “2” on Cash Out (lines 491, 504) when `!hasApiBets` — fake counts.
  - **Settled tab:** `SettledBets` demo component (line 537).
  - **Cash Out tab:** Same demo `AccumulatorBetCard` and `SingleBetCard` (lines 543–545).
- **Impact:** Users believe they have open/settled/cashout bets; amounts and events are fake.

---

## 3. Admin Credits Page — Demo Ledger on API Failure

**File:** `apps/web/src/app/admin/credits/page.tsx`

- **When:** Any of `GET /api/admin/agents`, `GET /api/credits/admin/overview`, or `GET /api/admin/credits/ledger` fails → `catch` (lines 35–43).
- **What is set:**
  - `ledger`: 3 hardcoded rows — Admin create 100000, assign to Agent_20 (-5000), assign to Agent_21 (-3000); `balanceAfter` 100000, 95000, 92000.
  - `balance`: 92000.
  - `agents`: `[{ id: 'Agent_20' }, { id: 'Agent_21' }]`.
  - `agentId`: `'Agent_20'`.
- **Impact:** Admin sees a fake ledger and balance; decisions based on this would be wrong.

---

## 4. Seed Event Permanently “Live” (DB Fallback)

**Files:** `apps/api/seeds/002_bet365_sports_events.ts`, `apps/api/src/modules/sports/sports.service.ts`

- **Seed:** In `002_bet365_sports_events.ts`, the first event (index 0) is inserted with **`status: 'live'`**; all others are `'scheduled'` (line 47).
  - That event is “Real Madrid vs Manchester City” (Champions League), `external_id: 'seed-fb-1'`.
- **API:** `getLiveEvents()` in `sports.service.ts` (lines 178–204):
  1. Tries `SportsDataService.getLiveEvents()` (real providers).
  2. If that throws or returns empty, falls back to: `db('events').where({ status: 'live' }).orderBy(...)`.
- **Result:** Whenever real live feed is down or empty (e.g. no API keys, provider limits, errors), the API returns the **seed event** as the only “live” event. It is never updated to `finished` by real data, so it is **permanently** shown as live.
- **Impact:** One fake match is shown as live on In-Play, Live page, and anywhere that calls `GET /api/sports/live`.

---

## 5. Display List Merge — Stale Events Kept as “Live”

**File:** `apps/api/src/modules/sports-data/sports-data.service.ts`

- **Mechanism:** `mergeWithDisplayList(fresh)` (lines 59–104). Reads existing list from Redis `display:live:events` (TTL 60s). For each existing event:
  - If `old.status === 'ft'` it is dropped.
  - Otherwise `merged.push(updated ?? old)` — i.e. if the event is **not** in the current `fresh` feed, the **old** version is kept.
- **Problem:** If a match ends or a provider stops returning it, it may never get `status: 'ft'` in our system. It then stays in the display list with last-known data (score, clock, status) and continues to be shown as “live” until it eventually gets `ft` from some path or the list is evicted.
- **Impact:** Events that are no longer live can still appear in the live list with outdated scores and “live” label.

---

## 6. OddsSync — Simulated “Live” Clock and Incidents

**File:** `apps/api/src/jobs/oddsSync.ts`

- **What it does:** Runs every 5s. Loads all DB events with `status: 'live'` (line 68). For each:
  - Builds or reuses in-memory `runtimeState` with a **random starting minute** (e.g. 10–35) and period (1H/2H) (lines 74–82).
  - Every ~10s advances the “minute” and may call `maybeGenerateIncident()` (lines 85–93) — simulated events (goals, cards, etc.).
  - Writes odds to Redis and emits `odds:update` to Socket.IO rooms `event:${event.id}` (lines 96–123).
- **Implication:** Any event in the DB with `status: 'live'` (including the **seed** event) is treated as “live” and gets a **simulated** clock and optional fake incidents. There is no real feed updating the score or status; it is demo/simulation.
- **Impact:** “Live” events shown from DB (e.g. after fallback in section 4) are not real live; they are simulated.

---

## 7. Sport Event Pages — Default “Live” and Fallback Stats

**Files:** e.g. `apps/web/src/app/(member)/sports/basketball/[eventId]/page.tsx`, `tennis/[eventId]/page.tsx`, `esports/[eventId]/page.tsx`, `golf/[eventId]/page.tsx`

- **Basketball** (and similar pattern elsewhere): When mapping API response to local state (lines 396–413):
  - `status: normalized.status || 'live'` — if the API does not send a status, the event is shown as **live**.
  - `score: normalized.score ?? { home: 78, away: 71 }`, `period: 'Q3'`, `clock: '8:42'`, and `stats` (e.g. fgPercent, rebounds) are **fallback** values when missing.
- **Esports / Golf:** Copy refers to “live” (“No live esports events”, “No live golf tournaments”) and error/empty states can be confusing if data is stale.
- **Impact:** A single event page can show a “Live” badge and fake score/clock when the API response is missing or incomplete.

---

## 8. Gaming / Casino — Static Lobby and Promos

**File:** `apps/api/src/modules/gaming/gaming.service.ts`

- **Content:** All returned data is from in-code arrays:
  - `LOBBY_GAMES`: 10 games (e.g. Mega Wheel, Lightning Roulette, Live Blackjack A).
  - `PROMOTIONS`: 3 promo cards (Bet Boosts, Same Game Parlay+, Live Casino Cashback).
  - `RACECARDS`: Race events (e.g. Cheltenham) with fixed markets and odds.
  - Virtual sports and other endpoints return similar static structures.
- **Note:** These are not labeled “live” in the sense of in-play sports; “live” here is “live casino” (streamed tables). No claim of real-time odds or real games.
- **Impact:** Low for “live” misuse; clearly placeholder/demo content for lobby and promos.

---

## 9. Login and Footer — “Demo Platform” Disclaimer

**Files:** `variant-exports/variant_login.js`, `variant-exports/variant_match_football.js` (and possibly others)

- **Text:** “BetArena — Demo Platform · Virtual Credits Only” in the footer (e.g. lines 556, 484).
- **Impact:** Correct disclaimer; not demo data abuse, but good to keep for compliance.

---

## 10. Golf and Esports — Redirect to Demo Route

**Files:** `apps/web/src/app/(member)/sports/golf/page.tsx`, `apps/web/src/app/(member)/sports/esports/page.tsx`

- **When:** List fetch fails or returns no events (e.g. golf line 29, esports lines 25–29).
- **Action:** `router.replace('/sports/golf/demo')` or `router.replace('/sports/esports/demo')`.
- **Impact:** User is sent to a dedicated demo route; if that route shows “live” or “in-play” copy, it should be clearly marked as demo.

---

## Recommendations (concise)

1. **In-Play:** When `liveEvents.length === 0`, do not show “247 events live”, fake filters, or static sport cards; show an empty state (“No live events right now”) and optionally a retry. Remove or clearly label any fallback score ticker as “Sample”.
2. **My Bets:** On API failure, show an error and retry; do not render demo bet cards or fake badge counts.
3. **Admin Credits:** On API failure, show an error state; do not populate ledger/balance/agents with hardcoded demo values.
4. **Seed “live” event:** Either remove `status: 'live'` from the seed or do not use DB fallback for `GET /api/sports/live` when the intent is “real live only”; alternatively, add a flag (e.g. `source: 'seed'`) and hide or label seed events in the UI.
5. **Display list:** When an event is not in the fresh feed, consider dropping it after a short grace period or marking it non-live instead of keeping it indefinitely as “live”.
6. **OddsSync:** Document that DB `status: 'live'` events are simulated; do not use this path for production “live” without a real feed, or gate simulation behind a feature flag / env.
7. **Sport event pages:** Avoid defaulting to `status: 'live'`; use `'upcoming'` or `'unknown'` when status is missing, and do not show a “Live” badge without clear backend status.
8. **Gaming:** Keep as-is for lobby/promo placeholders; ensure any “live” wording refers only to “live casino” and not to real-time sports.

---

*Demo data and live-label audit — 2025-03-06*
