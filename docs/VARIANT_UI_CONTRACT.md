# BetArena — Variant UI Contract

**Purpose:** Document the contract between variant exports and API/data so both UI systems (variant vs Next-native) render correctly. See also [ARCHITECTURE_AND_FLOWS.md](ARCHITECTURE_AND_FLOWS.md) section 10.

---

## Odds Shape

Odds can appear in two forms:

1. **Object:** `{ label: string, value: string }` — e.g. `{ label: '1', value: '2.10' }` for 1X2 markets.
2. **Primitive:** `string` or `number` — direct odds value.

**Rule:** Components must never render the odds object itself as a React child. Always extract the display value:

```javascript
// Correct
const displayValue = (typeof odd === 'object' && odd !== null && 'value' in odd) ? odd.value : odd;

// Incorrect — causes "Objects are not valid as a React child"
value={odd}  // when odd is { label, value }
```

**Example:** In `variant_home.js`, `OddsCellButton` receives `value={displayValue}` and `addToSlip` uses the string odds value, not the object.

---

## API Response Shape — Sports / Live

### GET `/api/sports/live`

**Response:** `{ success: true, data: { live: Event[], upcoming: Event[] } }`

- `live` — events with `status: 'live'` from providers or DB fallback.
- `upcoming` — scheduled events; from API when available, otherwise from DB.

**Legacy (deprecated):** `data` may have been a plain array (live only). Current API always returns `{ live, upcoming }`.

**Frontend handling:**
```javascript
const live = Array.isArray(res.data) ? res.data : (res.data?.live || []);
const upcoming = Array.isArray(res.data) ? [] : (res.data?.upcoming || []);
```

### Event Shape (normalized)

- `id`, `sport`, `competition` (or `league`), `homeTeam`, `awayTeam`, `score`, `status`, `clock`, `startTime`, `markets`, `source`.

---

## Variant Files and Pages

| Variant File | Route(s) | Notes |
|--------------|----------|-------|
| `variant_login.js` | `/login` | Login form |
| `variant_home.js` | `/sports` | Sports lobby, In-Play Now, Upcoming Today |
| `variant_inplay.js` | `/in-play` | In-Play grid, score updates, bet slip |
| `variant_my_account.js` | `/account` | Account overview |
| `variant_my_bets.js` | `/my-bets` | Wrapper around Next-native `MyBetsPage` |
| `variant_admin_dashboard.js` | Admin routes | Admin dashboards (if used) |
| `variant_agent_dashboard.js` | Agent routes | Agent dashboards (if used) |
| `variant_agent_reports.js` | Agent reports | Reports (if used) |
| `variant_match_football.js` | Football match detail | Match page with LoginCard overlay |
| `variant_results.js` | `/results` | May be superseded by Next-native ResultsPage |
| `variant_cricket.js` | Cricket match | Cricket match view |
| `variant_horse_racing.js` | Horse racing | Horse racing card |
| `variant_mobile.js` | — | Mobile breakpoint reference |

---

## React Router Shims

Variants use `Link`, `useNavigate`, `useLocation` from `@/shims/react-router-dom`, which map to Next.js `Link` and `useRouter`. Do not import from `react-router-dom` directly in variants.

---

## Adding or Modifying Variants

1. Ensure odds are never passed as objects to `value` props; extract `odd.value` when needed.
2. Handle both `{ live, upcoming }` and legacy array response from `/api/sports/live`.
3. Use the shim for navigation; avoid `window.location` for in-app routing.
4. Match the API response shape documented in [ARCHITECTURE_AND_FLOWS.md](ARCHITECTURE_AND_FLOWS.md) section 5.3.
