# BetArena → bet365 full clone design brief

**Goal:** Fully build all screens and clone bet365 layout, density, and styling.

**Design system (already in globals.css / layout):**
- **Background:** Deep green `hsl(160,30%,6%)` to `hsl(160,25%,9%)`
- **Header:** `bet365-header` — green bar, height ~48px
- **Accent:** Yellow/gold `hsl(48,96%,53%)` for CTAs, active states, odds
- **Cards:** Dark panels `hsl(160,25%,11%)`, border `hsl(160,20%,18%)`
- **Text:** White / slate-300 / muted-foreground
- **Classes:** `bet365-yellow-btn` for primary buttons

**bet365 reference structure:**
- **Home:** Hero/promo strip, quick links to Sports / Live, featured events
- **Header:** Logo left, nav (Sports, In-Play, etc.), odds format toggle, balance, Bet Slip CTA, user menu
- **Sports:** Sticky sport tabs (horizontal scroll), "Top games" or featured strip, events grouped by league with 1X2 (and more) odds
- **Live:** Red "LIVE" indicator, sport filters, event rows: score, minute, live odds
- **Event detail:** All markets (Match Result, BTTS, Correct Score, etc.), odds buttons, match tracker if live
- **My Bets:** Tabs Open / Settled, bet cards (selections, stake, potential win, status), pagination
- **Account:** Balance, transaction history, profile, logout
- **Login:** Username/password form, error state, "too many attempts" message
- **Bottom nav (mobile):** Home, All Sports, Live, Slips (Bet Slip)
- **Bet slip (drawer):** Selections list, stake input, potential returns, Place Bet

**Screenshot refs:** DESIGN_TASKS.md maps to-do IDs to screens (01–09). Use bet365 density and information hierarchy.
