# MASTER CURSOR BUILD PROMPT
# BetArena — Complete Frontend Build Instructions
# Read every word before writing a single line of code.

---

## WHO YOU ARE & WHAT YOU ARE BUILDING

You are building **BetArena** — a full-featured sports betting platform that is a 
creative clone of Bet365.com using virtual/demo credits instead of real money. 
The design has been completed in Variant.ai across 11 screens and exported as 
React components. Your job is to take those exported components, keep their 
visual code exactly as-is, and wire them up to be fully functional — adding 
TypeScript, real API data, state management, WebSocket connections, and 
proper Next.js App Router structure.

The platform has 3 user roles: **Admin**, **Agent/Sub-Agent**, **Member**
Each role sees a completely different interface.

---

## VARIANT EXPORT FILES — THESE ARE YOUR ACTUAL COMPONENTS

All 11 exported React files are in `/design-reference/variant-exports/`

| File Name | What It Covers | Target Route(s) |
|-----------|---------------|-----------------|
| `variant_home_sports_lobby.jsx` | Home + Sports Lobby | `/` and `/sports` |
| `variant_match_football.jsx` | Football Match Page | `/sports/football/[eventId]` |
| `variant_login.jsx` | Login Page | `/login` |
| `variant_agent_dashboard.jsx` | Agent Dashboard + Create Member Modal | `/agent/dashboard` |
| `variant_admin_dashboard.jsx` | Admin Control Center | `/admin/dashboard` |
| `variant_my_bets.jsx` | My Bets + Cash Out | `/my-bets` |
| `variant_inplay.jsx` | In-Play Hub | `/in-play` |
| `variant_horse_racing.jsx` | Horse Racing Card | `/sports/horse-racing` |
| `variant_cricket.jsx` | Cricket Match Page | `/sports/cricket/[eventId]` |
| `variant_my_account.jsx` | My Account Overview | `/account` |
| `variant_agent_reports.jsx` | Agent Reports & Analytics | `/agent/reports` |
| `variant_mobile.jsx` | Mobile breakpoint reference | All pages |

### Rules for working with Variant exports:
**DO:**
- Keep ALL className strings exactly as exported
- Keep ALL layout, grid, flex, spacing structure
- Keep ALL colors, borders, shadows exactly
- Convert to TypeScript (.tsx) — add proper interfaces
- Replace hardcoded mock data with real API data
- Add onClick, onChange, onSubmit handlers
- Add useEffect hooks for data fetching
- Add Zustand store connections
- Add WebSocket subscriptions
- Add loading skeleton states
- Add empty states and error handling

**DO NOT:**
- Change any visual styling whatsoever
- Restructure the layout
- Change any color values
- Add new design elements not in the export
- Remove any design elements
- "Improve" or "clean up" the design in any way

---

## DESIGN SYSTEM — IMPLEMENT THESE EXACTLY

### Colors (add to tailwind.config.js as custom tokens)
```js
colors: {
  arena: {
    // Backgrounds
    'bg-primary':    '#0B0E1A',  // Main app background
    'bg-secondary':  '#111827',  // Sidebars, panels
    'bg-card':       '#1A2235',  // Cards, dropdowns, elevated surfaces
    'bg-input':      '#0F1629',  // Input fields
    
    // Accents
    'green':         '#00C37B',  // Primary CTA, selected state, wins
    'green-dark':    '#009960',  // Hover state for green elements
    'amber':         '#F59E0B',  // Live badges, highlights, horse racing
    'amber-dark':    '#D97706',  // Hover state for amber
    
    // Odds animations
    'odds-up':       '#16A34A',  // Flash green when odds increase
    'odds-down':     '#DC2626',  // Flash red when odds decrease
    
    // Status
    'win':           '#00C37B',  // Won bets
    'loss':          '#EF4444',  // Lost bets
    'open':          '#F59E0B',  // Open/pending bets
    'live':          '#EF4444',  // Live badge color
    'suspended':     '#374151',  // Suspended market
    
    // Text
    'text-primary':  '#F1F5F9',  // Main text
    'text-secondary':'#94A3B8',  // Muted text
    'text-muted':    '#475569',  // Very muted, timestamps
    
    // Borders
    'border':        '#1E293B',  // Subtle borders
    'border-bright': '#2D3F55',  // Slightly visible borders
    
    // Threat/danger (admin logs)
    'threat-bg':     '#450a0a',  // SQLi row background
    'threat-border': '#7f1d1d',  // SQLi row border
  }
}
```

### Typography
```js
fontFamily: {
  sans:  ['Inter', 'sans-serif'],          // All UI text
  mono:  ['Roboto Mono', 'monospace'],     // Odds numbers ONLY
  display: ['Outfit', 'sans-serif'],       // Logo, large headings
}
```

### Key Design Rules
- **Background is ALWAYS dark** — `bg-arena-bg-primary`. No white screens anywhere.
- **Odds numbers ALWAYS use `font-mono`** — prevents layout shift when numbers update
- **Cards use `bg-arena-bg-card` with `border border-arena-border`**
- **All interactive elements have `transition-all duration-150`**
- **Border radius**: cards `rounded-xl`, buttons `rounded-lg`, pills `rounded-full`
- **Shadows**: colored glow shadows for stat cards using the card's accent color at 20% opacity

---

## COMPONENT LIBRARY — BUILD THESE FIRST (in this order)

### Phase A: Design Tokens & Base (build before anything else)

**1. `globals.css`**
- Import Inter + Roboto Mono + Outfit from Google Fonts
- Set `body { background: #0B0E1A; color: #F1F5F9; }`
- CSS custom properties for all arena colors
- Keyframe animations:
  ```css
  @keyframes odds-flash-up {
    0% { background: #16A34A; }
    100% { background: #1E2D45; }
  }
  @keyframes odds-flash-down {
    0% { background: #DC2626; }
    100% { background: #1E2D45; }
  }
  @keyframes live-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  ```
- Utility classes: `.odds-flash-up`, `.odds-flash-down`, `.live-dot`

**2. `tailwind.config.js`**
- All arena color tokens above
- Font families above
- Custom animations: `'odds-up': 'odds-flash-up 600ms ease-out'`
- Extend screens for responsive: sm/md/lg/xl

---

### Phase B: Shared Components

**3. `OddsButton.tsx`**
Props: `odds: number`, `label: string`, `selected: boolean`, 
`suspended: boolean`, `previousOdds?: number`, `format: 'decimal'|'fraction'|'american'`

States:
- Default: `bg-arena-bg-card border border-arena-border text-arena-text-primary`
- Hover: `bg-arena-border brightness-125 cursor-pointer`
- Selected: `bg-arena-green text-white border-arena-green`
- Suspended: `bg-arena-suspended text-arena-text-muted cursor-not-allowed` — shows "SUSP" instead of odds
- Flash up: trigger `.odds-flash-up` animation when odds increase
- Flash down: trigger `.odds-flash-down` animation when odds decrease

Structure:
```
<button>
  <span class="text-xs text-arena-text-muted">{label}</span>
  <span class="font-mono font-bold text-sm">{formattedOdds}</span>
  {oddsDirection && <span>{↑ or ↓}</span>}
</button>
```

**4. `LiveBadge.tsx`**
Props: `minute?: string`, `period?: string`
- Red pill: `bg-arena-live text-white text-xs font-bold px-2 py-0.5 rounded-full`
- Pulsing dot before text: `animate-[live-pulse_1s_ease-in-out_infinite]`
- Shows: "🔴 LIVE 67'" or "🔴 LIVE Q3" or "🔴 LIVE 3rd Set"

**5. `StatCard.tsx`**
Props: `title`, `value`, `subtitle?`, `trend?`, `color: 'green'|'amber'|'red'|'blue'`
- Dark card with colored glow: `shadow-[0_0_20px_rgba(0,195,123,0.15)]` (adjust per color)
- Large value number in accent color
- Optional progress bar
- Optional trend arrow

**6. `MarketAccordion.tsx`**
Props: `title`, `markets: MarketOption[]`, `defaultOpen?: boolean`, `popular?: boolean`
- Smooth height animation on open/close (300ms ease)
- Header: dark bg, title left, "Popular" badge right if applicable
- Content: grid of `OddsButton` components
- Chevron rotates on open/close

**7. `BetSlip.tsx` (critical component)**
States: Singles | Multiples | System
- Persists selections in Zustand `betSlipStore`
- Each selection card:
  - × remove button
  - Event name, market type, selection name
  - Odds with flash animation
  - Direction indicator (↑↓)
- Stake input with quick-stake pills: [5][10][25][50][100]
- Potential returns calculated live
- Each Way toggle where applicable
- Place Bet button: green, disabled if insufficient balance
- Shows balance below button
- On mobile: renders as bottom sheet with slide-up animation

**8. `MatchCard.tsx`**
Props: `event`, `isLive`, `sport`
- Live variant: colored left border (green=football, amber=tennis, blue=basketball, purple=cricket)
- Shows: league, teams, score (if live), top 3 OddsButtons, "+X markets" link
- Mini stats bar for live events (corners, cards, shots)
- Favourite star toggle (yellow on click)

**9. `SportSidebar.tsx`**
- Full sport list with icons and live event counts
- Expandable competition sub-lists with country flags
- Active sport: green left border accent
- Sticky on desktop, hidden on mobile (replaced by bottom tabs)

**10. `TopHeader.tsx`**
- BetArena logo (shield icon + wordmark)
- Navigation tabs: Sports | In-Play (with pulsing count) | Live | My Bets | Results
- Odds format toggle: Dec/Frac/Am (stored in user preference)
- Balance chip in green
- Avatar with dropdown
- Mobile: compact with just logo, notifications, balance, avatar

---

### Phase C: Page Components

Build pages in this EXACT order — one at a time, fully complete before next:

---

#### PAGE 1: Login Page (`/login`)

**Design reference**: Frosted glass card on dark animated background

Layout:
- Full screen `bg-arena-bg-primary`
- Subtle particle/geometric animation in background (use `tsparticles` or pure CSS)
- Centered card: `max-w-sm`, `bg-arena-bg-card/80 backdrop-blur-xl border border-arena-border`

Card contents (top to bottom):
1. BetArena shield logo SVG in `#00C37B` — centered, 48px
2. "BetArena" wordmark in white, "Your Game. Your Arena." in `text-arena-text-muted`
3. Username input with user icon inside left
4. Password input with lock icon + show/hide toggle right
5. Row: Remember me checkbox (green when checked) + "Forgot?" link muted right
6. "SIGN IN" button — full width, `bg-arena-green hover:bg-arena-green-dark`, 48px height
7. "No account? Contact your agent." — centered, small, muted
8. Footer: "BetArena — Demo Platform · Virtual Credits Only"

States:
- Loading: button shows spinner, disabled
- Error: inputs get `border-red-500 bg-red-950/20`, error message below password in red
- Success: redirect based on role → `/admin/dashboard` or `/agent/dashboard` or `/sports`

Rules:
- NO sign up link
- NO register button
- Generic error message only: "Invalid username or password" — never specify which field

---

#### PAGE 2: Home + Sports Lobby (`/` and `/sports`)

**Variant file**: `variant_home_sports_lobby.jsx`
**IMPORTANT**: This is both the home page AND the sports lobby.
`/` redirects logged-in members here. `/sports` renders this directly.
They are the same component — no separate home page exists.

**Design reference**: Three-column layout — sidebar / main / bet slip

Layout: `grid grid-cols-[240px_1fr_320px]` on desktop

Left: `<SportSidebar />`

Main content:
1. **In-Play section** at top:
   - Section header with pulsing count
   - Horizontal sport filter pills
   - Grid of `<MatchCard isLive />` components
   - 3 columns desktop, 2 tablet, 1 mobile

2. **Pre-match sections** grouped by competition:
   - Competition header: flag + name + match count
   - Event rows in list style (denser than cards)
   - Each row: favourite star | time | teams | top 3 odds | secondary markets | +X more

Right: `<BetSlip />` sticky

---

#### PAGE 3: Match/Event Page (`/sports/[sport]/[eventId]`)

**Design reference**: Arsenal vs Chelsea live match page with full market accordions

Layout: Same 3-column grid

Main content:
1. **Match Header**:
   - Competition breadcrumb
   - Two team display with colored circle avatars
   - Large score (font-mono, very large) centered
   - Live badge + match clock
   - 5-column stats bar: Possession | Shots | Corners | On Target | Cards
   - Tab nav: [Markets] [Stats] [Lineups] [H2H]

2. **Market Accordions** (Markets tab) — in this order:
   1. Match Result (1X2) — default open
   2. Both Teams to Score
   3. Over/Under Goals (show 0.5 through 5.5)
   4. Asian Handicap (full range -3.5 to +3.5 in 0.25 steps)
   5. European Handicap
   6. Half Time Result
   7. Half Time / Full Time (9 outcome grid)
   8. Double Chance
   9. Draw No Bet
   10. First Goal Scorer (player list)
   11. Last Goal Scorer
   12. Anytime Goal Scorer
   13. Correct Score (full grid, 0-0 to 4-3+)
   14. First Team to Score
   15. Next Goal
   16. Winning Margin
   17. Clean Sheet Home/Away
   18. Total Corners Over/Under
   19. Total Cards Over/Under
   20. Scorecast
   21. Wincast
   22. To Win Both Halves
   23. Player to be Booked
   24. Time of First Goal
   25. Outright / To Qualify

Sport-specific pages follow same layout but with sport-specific markets:
- `/sports/tennis/[eventId]` → tennis markets (set betting, games handicap etc.)
- `/sports/basketball/[eventId]` → basketball markets (spread, quarters etc.)
- `/sports/cricket/[eventId]` → cricket markets (see Cricket design)
- `/sports/horse-racing/[eventId]` → horse racing layout (see Horse Racing design)

---

#### PAGE 4: In-Play Hub (`/in-play`)

**Design reference**: Two-column hub with score ticker

Layout: `grid grid-cols-[1fr_280px]`

Left (65%):
- Page title "⚡ In-Play" + pulsing count
- Horizontal scrollable sport filter pills with live counts
- Live event cards grouped by sport, each with colored left border:
  - Green = Football
  - Amber = Tennis  
  - Blue = Basketball
  - Purple = Cricket
  - Teal = Hockey
- Cards show: league, teams, score, clock, top odds, mini stats bar
- "Load More" button at bottom

Right (35%):
- "Score Updates" panel
- Compact scrolling list of all live scores
- Auto-refreshes every 5 seconds
- Green flash on score change

---

#### PAGE 5: Horse Racing (`/sports/horse-racing`)

**Design reference**: Cheltenham race card layout — completely unique

Layout: Full width, no bet slip column (bet slip slides in from right when selection made)

Top:
- Track header: "🏇 [Track Name]" with amber gradient accent
- Race metadata row: Race X of Y | Time | Distance | Grade | Going | Prize | Runners
- **Amber countdown box**: "STARTS IN MM:SS" in Roboto Mono, seconds ticking
- Race navigation pills: R1 ✅ R2 ✅ R3 ✅ R4 ⏰ R5 R6 R7

Bet type tabs: Win | Each Way | Place Only | Forecast | Reverse Forecast | Each Way Double

Runners table:
Columns: No. | Silk (colored circle) | Horse Name | Jockey | Trainer | Form | Win | EW | +

- Silk circles: unique color per runner (red, amber, blue, green, black, purple, pink)
- Form digits: green=1st, amber=2nd, grey=3rd, red=4th+
- FAV badge in amber on favourite runner
- Alternating row backgrounds
- [+] button adds to bet slip with horse name shown

Bottom info bar: EW Terms | SP available | Non-Runners | Rule 4

---

#### PAGE 6: My Bets (`/my-bets`)

**Design reference**: Open bets with accumulator + cash out

Tabs: Open Bets | Settled Bets | Cash Out Available

Bet card types:

**Single bet card**:
- Market, selection, odds, status badge
- Stake / Potential Return
- Cash Out button (if eligible)
- Partial cash out slider

**Accumulator card**:
- "ACCUMULATOR · N Selections" amber badge
- Selection list with status per row:
  - ✅ green row = won selection
  - 🔴 pulsing = live selection (shows current score)
  - ⏰ grey = pending selection
- Combined odds, stake, potential return
- Cash Out button

**Status badges**:
- OPEN: amber pill
- WON: green pill with ✅
- LOST: red pill with ❌
- VOID: grey pill
- CASHED OUT: blue pill

**Cash Out feature**:
- Full: green button "CASH OUT — X.XX CR"
- Partial: slider below, shows split in real time
- Disabled state when market suspended: grey "Cash Out Unavailable"

---

#### PAGE 7: My Account (`/account`)

**Design reference**: JK avatar, 3 stat cards, quick links, recent transactions

Header: Avatar circle | Member name | ID badge | Agent reference | Login info

3 cards:
- Credit Balance (green glow): balance, in-bets, available, total received, progress bar
- Total Bets (blue glow): count, won/lost/open breakdown, circular win rate arc
- P&L (green/red glow): total P&L large, 7-day mini bar chart

Quick actions 2×3 grid: My Bets | Transactions | Notifications | Settings | Help | Security

Recent Transactions table: icon | description | amount | running balance | time

---

#### PAGE 8: Agent Dashboard (`/agent/dashboard`)

**Design reference**: Agent_20 welcome, 4 stat cards, members table, create member modal

Sidebar nav: Dashboard | My Members | Sub-Agents | Credits | Reports | Settings
Agent ID badge at bottom of sidebar

Main:
- Greeting + date/time
- 4 stat cards: Total Credits | Distributed | Members | P&L
- Members table: ID | Nickname | Balance | Open Bets | P&L | Status | Actions
- "＋ Create Member" button → modal

Create Member modal:
- Optional nickname input
- "Generate Credentials" button
- Result box: username + password with copy buttons
- **Amber warning**: "These credentials will not be shown again. Save them immediately."
- Credentials shown ONCE only

---

#### PAGE 9: Agent Reports (`/agent/reports`)

**Design reference**: 4 KPI cards, area chart, donut chart, member table

- Date range picker
- Export CSV button
- 4 KPI cards: Distributed | Winnings | Losses | Net P&L
- Credit flow area chart (3 areas: given/won back/kept)
- Donut chart: bet type breakdown
- Member performance table with progress bar win rates
- Suspended member row in red tint
- Bottom: horizontal bar chart (sports) + daily sparkline

---

#### PAGE 10: Admin Dashboard (`/admin/dashboard`)

**Design reference**: Admin Control Center with 6 stat cards, hierarchy tree, logs

Header: Logo | "Admin Control Center" | "● X users online" live | Admin avatar

6 glowing stat cards: Credits Created | In Circulation | Agents | Members | Bets Today | P&L

Two columns:
- Left: 30-day line chart (green=volume, amber=P&L)
- Right: Credit hierarchy tree (crown icon, indented agents/sub-agents, suspended in red)

System Logs table:
- Columns: Timestamp | User | Action | IP | Result | Threat
- "Threats Only" amber toggle
- SQLi rows: `bg-arena-threat-bg border-l-4 border-arena-threat-border`
- Red 🚨 shield icon in threat column
- "BLOCKED" badge in red on threat rows

---

#### PAGE 11: Mobile Layout

**Design reference**: 3 mobile screens from Variant

Apply these mobile overrides (`@media (max-width: 768px)`):
- Hide left sidebar and right bet slip sidebar
- Show bottom tab bar: Home | Live | Sports | Bets | Account
- Event cards: full width single column
- Bet slip: bottom sheet (`position: fixed, bottom: 0`) with slide-up animation
- Floating bet slip trigger button: fixed center above tab bar
- Sport filter: horizontal scrollable pills at top of content
- Compact top bar: logo | notifications | balance pill | avatar

Bottom sheet behavior:
- Overlay: `bg-black/60 backdrop-blur-sm`
- Sheet: `bg-arena-bg-card rounded-t-2xl`
- Drag handle bar at top
- `animation: slide-up 300ms ease-out`
- Close on overlay click or drag down

---

## REAL-TIME BEHAVIOR — IMPLEMENT EXACTLY

### Odds Updates (WebSocket)
```typescript
// In useOdds.ts hook
socket.on('odds:update', (data: OddsUpdate) => {
  const prevOdds = oddsStore.getOdds(data.eventId, data.market)
  
  if (data.newOdds > prevOdds) {
    triggerFlash(data.selectionId, 'up')   // green flash
  } else if (data.newOdds < prevOdds) {
    triggerFlash(data.selectionId, 'down') // red flash
  }
  
  oddsStore.updateOdds(data)
})

// Flash function
const triggerFlash = (id: string, direction: 'up'|'down') => {
  const el = document.getElementById(`odds-${id}`)
  el?.classList.add(`odds-flash-${direction}`)
  setTimeout(() => el?.classList.remove(`odds-flash-${direction}`), 600)
}
```

### Bet Slip Recalculation
When odds change while a selection is in the bet slip:
- Show direction indicator on the affected selection
- Recalculate potential returns instantly
- Flash the potential returns number

### Live Score Updates
- Score number: brief `scale-110` bounce animation on change
- Minute counter: increment every real second for live matches

### Suspended Markets
When a market suspends:
- All OddsButtons in that market: fade to suspended state, show "SUSP"
- If a suspended selection is in the bet slip: show warning
- Cash Out button: grey out, show "Unavailable"

---

## STATE MANAGEMENT (Zustand stores)

### `authStore.ts`
```typescript
interface AuthStore {
  user: User | null
  role: 'admin' | 'agent' | 'member' | null
  token: string | null
  login: (credentials) => Promise<void>
  logout: () => void
}
```

### `betSlipStore.ts`
```typescript
interface BetSlipStore {
  selections: Selection[]
  mode: 'singles' | 'multiples' | 'system'
  stakes: Record<string, number>
  oddsFormat: 'decimal' | 'fractional' | 'american'
  addSelection: (selection: Selection) => void
  removeSelection: (id: string) => void
  updateStake: (id: string, amount: number) => void
  calculateReturns: () => number
  clearSlip: () => void
}
```

### `oddsStore.ts`
```typescript
interface OddsStore {
  odds: Record<string, OddsData>
  flashStates: Record<string, 'up' | 'down' | null>
  updateOdds: (data: OddsUpdate) => void
  getOdds: (eventId: string, market: string) => number
}
```

---

## API INTEGRATION

Base URL: `process.env.NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000`)

All requests via Axios instance in `lib/api.ts`:
- Attach JWT from cookie automatically
- On 401: redirect to `/login`
- On 403: show "Access denied" toast

Key endpoints to integrate:
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/sports
GET    /api/sports/:sport/events
GET    /api/events/:id/markets
GET    /api/events/live

POST   /api/bets
GET    /api/bets/my-bets
POST   /api/bets/:id/cashout

GET    /api/credits/balance
GET    /api/credits/transactions

GET    /api/agents/members          (agent only)
POST   /api/agents/members          (agent only)
GET    /api/agents/sub-agents       (master agent only)
POST   /api/credits/transfer        (agent only)

GET    /api/admin/dashboard         (admin only)
GET    /api/admin/agents            (admin only)
POST   /api/admin/agents            (admin only)
POST   /api/admin/credits/create    (admin only)
GET    /api/admin/logs              (admin only)
PATCH  /api/admin/agents/:id/privilege (admin only)
```

---

## ROUTING STRUCTURE

### Root Route Logic (IMPORTANT)
The Sports Lobby IS the home page for members — exactly like Bet365.
There is no separate marketing homepage. Everyone who visits is already
a member with credentials. The root `/` redirects based on role:

```
/ (root)
├── Not logged in  →  redirect to /login
└── Logged in:
    ├── role = admin   →  redirect to /admin/dashboard
    ├── role = agent   →  redirect to /agent/dashboard
    └── role = member  →  redirect to /sports  (Sports Lobby = Home)
```

### Full Route Map
```
── PUBLIC ──────────────────────────────────────────────────
/login                          → Login (only public route)

── MEMBER ──────────────────────────────────────────────────
/                               → Redirects to /sports
/sports                         → Home + Sports Lobby ← SAME PAGE
/sports/[sport]                 → Sport events list
/sports/football/[eventId]      → Football match page
/sports/tennis/[eventId]        → Tennis match page
/sports/basketball/[eventId]    → Basketball match page
/sports/cricket/[eventId]       → Cricket match page
/sports/horse-racing            → Horse racing card
/sports/golf/[eventId]          → Golf tournament
/sports/esports/[eventId]       → Esports match
/in-play                        → In-play hub
/my-bets                        → My bets + cash out
/account                        → My account overview
/account/transactions           → Transaction history
/account/settings               → Settings
/results                        → Past results

── AGENT ───────────────────────────────────────────────────
/agent/dashboard                → Agent home
/agent/members                  → Member list
/agent/members/[id]             → Individual member detail
/agent/sub-agents               → Sub-agent list (if privileged)
/agent/credits                  → Credit transfer
/agent/reports                  → Reports & analytics

── ADMIN ───────────────────────────────────────────────────
/admin/dashboard                → Admin home
/admin/users/agents             → All agents
/admin/users/agents/[id]        → Individual agent detail
/admin/users/members            → All members
/admin/credits                  → Credit management
/admin/logs                     → System logs + threat viewer
/admin/privileges               → Privilege management
/admin/settings                 → Platform settings
```

Route protection: `middleware.ts` in Next.js root checks the JWT 
cookie on every request. Wrong role accessing a protected route 
gets redirected to their correct home. No JWT at all redirects 
to `/login`.

---

## BUILD ORDER — FOLLOW THIS EXACTLY

Do NOT skip ahead. Complete each step fully before moving to the next.

```
Step 1:  Setup — install deps, tailwind tokens, globals.css animations,
         Zustand stores, lib/api.ts, lib/socket.ts, shared types,
         Next.js middleware.ts for route protection

Step 2:  Base components — OddsButton, LiveBadge, StatCard,
         MarketAccordion, BetSlip, MatchCard, SportSidebar, TopHeader
         (extract from Variant exports, make reusable)

Step 3:  Login page
         Source: variant_login.jsx → /app/(auth)/login/page.tsx
         Wire: POST /api/auth/login, role-based redirect

Step 4:  Home + Sports Lobby (SAME PAGE)
         Source: variant_home_sports_lobby.jsx
         → /app/page.tsx (redirects to /sports if logged in)
         → /app/(member)/sports/page.tsx (actual sports lobby)
         Wire: live events, pre-match events, sport filter pills,
         OddsButton → betSlipStore, WebSocket odds updates

Step 5:  Football Match page
         Source: variant_match_football.jsx
         → /app/(member)/sports/football/[eventId]/page.tsx
         Wire: all 25 market accordions from API, live score
         WebSocket, stats bar, tab navigation

Step 6:  In-Play Hub
         Source: variant_inplay.jsx
         → /app/(member)/in-play/page.tsx
         Wire: all live events, score ticker, sport filter

Step 7:  Horse Racing
         Source: variant_horse_racing.jsx
         → /app/(member)/sports/horse-racing/page.tsx
         Wire: race data, countdown timer, runner table,
         bet type tabs, EW toggle

Step 8:  Cricket Match
         Source: variant_cricket.jsx
         → /app/(member)/sports/cricket/[eventId]/page.tsx
         Wire: scorecard, ball-by-ball, cricket markets

Step 9:  My Bets
         Source: variant_my_bets.jsx
         → /app/(member)/my-bets/page.tsx
         Wire: open/settled bets, cash out, partial slider

Step 10: My Account
         Source: variant_my_account.jsx
         → /app/(member)/account/page.tsx
         Wire: member stats, recent transactions, P&L chart

Step 11: Agent Dashboard
         Source: variant_agent_dashboard.jsx
         → /app/(agent)/agent/dashboard/page.tsx
         Wire: stats, members table, create member modal,
         credit transfer, show credentials once only

Step 12: Agent Reports
         Source: variant_agent_reports.jsx
         → /app/(agent)/agent/reports/page.tsx
         Wire: charts with recharts + real data, export CSV

Step 13: Admin Dashboard
         Source: variant_admin_dashboard.jsx
         → /app/(admin)/admin/dashboard/page.tsx
         Wire: platform stats, hierarchy tree, system logs,
         threat rows, Threats Only toggle

Step 14: Mobile responsive
         Source: variant_mobile.jsx (reference for breakpoints)
         Apply mobile overrides to ALL pages:
         bottom tab bar, bet slip bottom sheet,
         floating bet slip button, full-width cards

Step 15: Tier 2 screens (no Variant export — use existing components)
         Tennis, Basketball, Golf, Esports match pages
         Results page, Transaction History, Settings,
         Admin: Agent Detail, Credit Management, Privileges

Step 16: Wire all WebSocket connections across every page
Step 17: Test all 3 roles end to end
Step 18: Final polish — all animations, skeletons, empty states
```

---

## LOADING & EMPTY STATES (required for every data-heavy component)

Every component that fetches data needs:

**Skeleton loader**: Use `animate-pulse` with `bg-arena-border` placeholder shapes
- Match cards: skeleton of the card layout
- Odds buttons: grey pill placeholders
- Tables: row skeletons

**Empty states**: When no data exists
- No live events: "⚡ No live events right now. Check back soon."
- No bets: "You haven't placed any bets yet. Head to Sports to get started."
- No members: "No members yet. Create your first member session."

**Error states**:
- API error: toast notification + "Something went wrong. Please refresh."
- Network error: banner "Connection issue. Trying to reconnect..."

---

## CRITICAL RULES — NEVER BREAK THESE

1. **No white backgrounds anywhere** — every surface uses arena dark colors
2. **Odds always font-mono** — prevents layout shift during live updates
3. **Never expose member nicknames to the member** — agent-only private field
4. **Never show register/signup links** — only login exists
5. **Role-based rendering** — check user role before rendering any admin/agent UI
6. **Bet slip state persists** across page navigation (Zustand, not component state)
7. **All forms have loading states** — disable submit button while API call in progress
8. **Odds direction flash max once** — debounce rapid updates, only flash on actual change
9. **Cash out value updates in real time** via WebSocket — not just on page load
10. **Mobile bet slip is a bottom sheet** — never a full page on mobile

---

## FINAL CHECKLIST BEFORE CALLING ANY PAGE "DONE"

- [ ] Works on desktop (1440px), laptop (1280px), tablet (768px), mobile (375px)
- [ ] All data loads from real API — no hardcoded mock data in production
- [ ] Loading skeleton shown while data fetches
- [ ] Empty state shown when no data
- [ ] Error state handles API failures gracefully
- [ ] All interactive elements have hover + active + disabled states
- [ ] Odds buttons flash correctly on price change
- [ ] Live badges are pulsing
- [ ] Bet slip updates in real time
- [ ] Role-based access enforced (wrong role gets redirected)
- [ ] No console errors
- [ ] Dark background on every single surface — no white screens
