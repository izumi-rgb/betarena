# Bet365 Parity Backlog

This backlog tracks the full parity target for BetArena against bet365-style product areas.

## Done in this iteration

- Added `gaming` API module with endpoints:
  - `GET /api/gaming/lobby`
  - `GET /api/gaming/promotions`
  - `GET /api/gaming/racecards`
  - `GET /api/gaming/virtual-sports`
- Added member pages:
  - `/casino`
  - `/racecards`
  - `/promotions`
  - `/virtual-sports`
- Extended member desktop navigation to include:
  - Casino
  - Virtual
  - Racecards
  - Promos
- Expanded member home quick links with Casino and Racecards.
- Extended bet slip parity:
  - Multi-single placement flow (batch singles).
  - System bet type selector with combo-count awareness.
  - Each-way controls with fraction (`1/4`, `1/5`) and places (`2-5`).
  - Dynamic total stake calculation for system bets.
- Added cashout flow:
  - `POST /api/bets/:betUid/cashout`
  - Open bets now include `cashout_offer` and `cashout_available`.
  - `My Bets` supports cashout action for open bets.
- Added partial cashout flow:
  - `POST /api/bets/:betUid/cashout/partial` with `percent` (25/50/75 supported in UI).
  - Eligibility guard: open bets only and minimum remaining stake.
  - `My Bets` now exposes quick partial-cashout action chips.
- Added event-level bet-builder mode indicator in event market page.
- Added in-play suspension behavior:
  - live odds socket payload now emits temporary `suspended` flags.
  - odds buttons render suspended state as `SUSP` and disable selection.
- Added advanced event market navigation:
  - market-tree node filters (`popular`, `goals`, `handicaps`, `players`, `other`) on event page.
  - market type tabs now work together with tree filters.
- Added bet-builder constraints in store:
  - max 8 selections per event.
  - Correct Score exclusivity.
  - blocks Over + Under on the same line.
  - rule-violation messaging surfaced in event page and bet slip.
- Live depth improvements:
  - enhanced `LiveMatchTracker` with momentum split and recent-incident feed.
  - odds suspension now includes reason tags (`trading`, `var_check`) in live socket payload.
  - odds buttons surface suspension reason and disable interaction while suspended.
- Expanded market coverage baseline in seeds:
  - Football: result, BTTS, correct score, totals, AH, double chance, DNB, team totals, corners, cards, player props.
  - Basketball/Tennis: totals + handicap lines.
  - Generic fallback totals + handicap for other sports.
- Added market metadata normalization in sports service:
  - market display names
  - market type families (`result`, `goals`, `handicaps`, `corners`, `cards`, `players`, `other`)
  - selection line support (`line`) for builder/rules.
- Live engine upgrades in odds sync:
  - in-memory clock progression with period transitions.
  - simulated incidents feed and score updates.
  - emits `event:update` and global `live:update` continuously for live UX.
- Event market rendering now supports line ladders:
  - line-based rows for totals/handicap style markets.
  - stable market ordering for better browsing density.

## Remaining parity domains

- Sportsbook depth:
  - Full market coverage per sport (player props, cards, corners, period markets, system bets).
  - Advanced pre-match filters and competition trees.
- In-play depth:
  - Rich live trackers by sport, timeline incidents, and micro-markets.
  - Streaming availability indicators and market suspension flows.
- Bet slip parity:
  - Same Game Parlay+, edit selections inline, advanced system configurator.
  - Cashout states, partial cashout, and bet-builder constraints.
- Account and wallet:
  - Full statement filtering, transaction drilldown, and limits/preferences.
- Promotions and personalization:
  - User-segmented offers, expiry timers, opt-in flows.
- Gaming integration:
  - Real provider catalogs, launch URLs, lobby personalization, favorites/recent.
- Racing:
  - Full meetings cards, runner details, place terms, each-way controls.
- Cross-platform behavior:
  - Desktop/mobile parity for every section and nav pattern.

## Execution order

1. Finish sportsbook market parity and bet slip parity.
2. Implement live tracker depth and suspension/cashout flows.
3. Expand racing and gaming with provider-backed catalogs.
4. Complete account/statement and promotions personalization.
