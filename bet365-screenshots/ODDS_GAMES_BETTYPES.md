# BetArena alignment with bet365: Odds, Games, Bet types

Reference: **parallel-web-extract** from [bet365 US](https://www.bet365.com), and bet365 international (screenshots). Goal: same odds presentation, same sports/games, same bet types as bet365.

---

## 1. Odds (same as bet365)

**Source (extract):** bet365 markets and “The Most Competitive Betting Odds”; industry standard is decimal/fractional/American.

**Requirements:**

| Item | bet365 | BetArena status |
|------|--------|------------------|
| **Decimal** | Primary in EU/UK | ✅ Implemented (`oddsStore.ts`, `convertOdds`) |
| **Fractional** | UK option | ✅ Implemented |
| **American** | US option (+100, -150, etc.) | ✅ Implemented |
| **Toggle in header** | User can switch format | ✅ Member layout: “Odds: Decimal/Fractional/American” cycle |
| **Display** | Same numeric style (2 d.p. decimal, fractions like 4/5, American +100/-150) | ✅ Verify display matches bet365 style |

**To-do (align-odds):** Confirm odds display (decimal 2 d.p., fractional “4/5”, American “+100”/“-150”) matches bet365; no logic change if already correct.

---

## 2. Games (same sports & coverage as bet365)

**Source (extract):** “Bet on 1.3 million+ games Including Live in-Game”, “NFL, NBA, NHL, and MLB” (US); internationally: Football (soccer), Tennis, Basketball, Ice Hockey, Cricket, etc. (from bet365 screenshot ref: Fußball, Tennis, Basketball, Eishockey, Curling, Slots, Fantasy, Champions League).

**Sports to support (bet365-style):**

- **Football** (soccer) — main leagues, Champions League, domestic
- **Tennis** — ATP/WTA, Grand Slams
- **Basketball** — NBA, international
- **Ice Hockey** — NHL, international
- **American Football** — NFL, college
- **Cricket** — int’l and domestic
- **Baseball** — MLB
- **Other** — e.g. Curling, Rugby, MMA (as data allows)

**Requirements:**

| Item | bet365 | BetArena status |
|------|--------|------------------|
| **Sports list** | Tabs/strip: Football, Tennis, Basketball, etc. | ✅ `listSports()` from DB; UI sport tabs |
| **Events by sport** | Leagues, start time, home/away | ✅ `listEventsBySport(sport)` |
| **Live + upcoming** | Separate or combined with “Live” badge | ✅ status live/scheduled; Live page |
| **Same games** | Same *sports and league coverage*; event data from your feed (no bet365 scraping) | ⚠️ Ensure seed/API populates Football, Tennis, NBA, etc. |

**To-do (align-games):** Ensure sports feed or seed includes bet365-style sports (Football, Tennis, Basketball, Ice Hockey, Cricket, American Football, Baseball); add any missing sports to sync/seed; keep league/event structure compatible with bet365-style UI.

---

## 3. Bet types (same as bet365)

**Source (extract):** “Same Game Parlay+”, “Profit Boost”, “Straight bets”; standard bet365 markets include Match Result, BTTS, O/U, Asian Handicap, Correct Score, etc.

**Bet types to support (bet365 parity):**

| Bet type | bet365 | BetArena API | Notes |
|----------|--------|--------------|--------|
| **Single** | ✅ | ✅ `single` | One selection |
| **Accumulator (Parlay)** | ✅ | ✅ `accumulator` | 2+ selections, combined odds |
| **System** (Trixie, Patent, Yankee, Lucky 15/31/63) | ✅ | ✅ `system` + system_type | ✅ in `bets.utils.ts` |
| **Each-Way** | ✅ | ✅ `each_way` | ew_fraction, ew_places |
| **Asian Handicap** | ✅ | ✅ `asian_handicap` | handicap_line |
| **Over/Under** | ✅ | ✅ `over_under` | total_line |
| **Both Teams to Score (BTTS)** | ✅ | Market type | Model as 1X2 or custom market; settlement Yes/No |
| **Correct Score** | ✅ | Market type | Model as market with selection names; settlement by score |
| **Same Game Parlay** | ✅ (US) | ⚠️ Optional | Multi-market from one event; can be accumulator from same event_id |

**Requirements:**

| Item | Action |
|------|--------|
| **Single, Acca, System, Each-Way, AH, O/U** | Already in validator; ensure UI exposes all (bet slip, event markets). |
| **BTTS** | Add or map market type “Both Teams to Score”; selections e.g. Yes/No; settlement by result. |
| **Correct Score** | Add or map market type “Correct Score”; selections e.g. “1-0”, “2-1”; settlement by score. |
| **Bet slip** | Show bet type selector (Single, Acca, Each-Way toggle, System type, AH/O/U lines) like bet365. |

**To-do (align-bettypes):** Add or document BTTS and Correct Score (market types + settlement); ensure bet slip UI offers all existing types (system type, each-way, AH line, O/U line); optional Same Game Parlay (accumulator same event_id).

---

## Summary to-dos

1. **align-odds** — Verify odds display (decimal/fractional/American) matches bet365; adjust formatting if needed.
2. **align-games** — Ensure sports/events data includes bet365-style sports and leagues (Football, Tennis, NBA, etc.); add missing sports to sync/seed.
3. **align-bettypes** — Add/map BTTS and Correct Score; expose all bet types in bet slip; optional Same Game Parlay.
