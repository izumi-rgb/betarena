import type { LiveEvent, Market, Selection, EventStatus, SportKey } from '../types';

// ---------------------------------------------------------------------------
// Helpers – safely extract nested values from unknown API payloads
// ---------------------------------------------------------------------------

/** Traverse a dotted path on an unknown object, returning `fallback` on any miss. */
function get(obj: unknown, path: string, fallback: unknown = undefined): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return fallback;
    current = (current as Record<string, unknown>)[key];
  }
  return current ?? fallback;
}

/** Coerce to string (never returns `null`/`undefined`). */
function str(val: unknown, fallback = ''): string {
  return val != null ? String(val) : fallback;
}

/** Coerce to number (returns `fallback` when the value is NaN). */
function num(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}

// ---------------------------------------------------------------------------
// API-Football  (v3.football.api-sports.io)
// Docs: https://www.api-football.com/documentation-v3
// Each element inside `response[]` has { fixture, league, teams, goals, … }
// ---------------------------------------------------------------------------

export function normalizeApiFootball(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  const r = raw as Record<string, unknown>;
  const fixture = r.fixture as Record<string, unknown> | undefined;
  const league = r.league as Record<string, unknown> | undefined;
  const teams = r.teams as Record<string, unknown> | undefined;
  const goals = r.goals as Record<string, unknown> | undefined;

  if (!fixture) return null;

  const statusShort = str(get(fixture, 'status.short'));

  const statusMap: Record<string, EventStatus> = {
    NS: 'pre',
    '1H': 'live',
    '2H': 'live',
    HT: 'ht',
    FT: 'ft',
    AET: 'ft',
    PEN: 'ft',
  };

  return {
    id: str(get(fixture, 'id')),
    sport: 'football',
    competition: {
      id: str(get(league, 'id')),
      name: str(get(league, 'name'), 'Unknown League'),
      logo: str(get(league, 'logo')) || undefined,
    },
    homeTeam: {
      id: str(get(teams, 'home.id')),
      name: str(get(teams, 'home.name'), 'Home'),
      badge: str(get(teams, 'home.logo')) || undefined,
    },
    awayTeam: {
      id: str(get(teams, 'away.id')),
      name: str(get(teams, 'away.name'), 'Away'),
      badge: str(get(teams, 'away.logo')) || undefined,
    },
    score: {
      home: num(get(goals, 'home')),
      away: num(get(goals, 'away')),
    },
    clock: str(get(fixture, 'status.elapsed'), '0') + "'",
    status: statusMap[statusShort] || 'pre',
    startTime: new Date(str(get(fixture, 'date'))),
    markets: [],
    source: 'api-football',
    lastUpdated: new Date(),
  };
}

// ---------------------------------------------------------------------------
// ESPN Hidden API
// Endpoint example: https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard
// Each event object has { id, competitions[], status, … }
// ---------------------------------------------------------------------------

export function normalizeESPN(raw: unknown, sport: string): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  const r = raw as Record<string, unknown>;
  const competitions = get(r, 'competitions') as unknown[] | undefined;
  const comp = competitions?.[0] as Record<string, unknown> | undefined;
  if (!comp) return null;

  const competitors = comp.competitors as unknown[] | undefined;
  const home = (competitors || []).find(
    (c: unknown) => get(c, 'homeAway') === 'home',
  ) as Record<string, unknown> | undefined;
  const away = (competitors || []).find(
    (c: unknown) => get(c, 'homeAway') === 'away',
  ) as Record<string, unknown> | undefined;

  const statusType = str(get(r, 'status.type.name'));

  const sportMap: Record<string, SportKey> = {
    nba: 'basketball',
    nfl: 'football',
    nhl: 'ice_hockey',
    mlb: 'baseball',
    epl: 'football',
    ucl: 'football',
  };

  const statusMap: Record<string, EventStatus> = {
    STATUS_SCHEDULED: 'pre',
    STATUS_IN_PROGRESS: 'live',
    STATUS_HALFTIME: 'ht',
    STATUS_FINAL: 'ft',
  };

  return {
    id: str(get(r, 'id')),
    sport: sportMap[sport] || 'football',
    competition: {
      id: str(get(r, 'season.type')),
      name: str(get(r, 'name'), 'Unknown'),
    },
    homeTeam: {
      id: str(get(home, 'id')),
      name: str(get(home, 'team.displayName'), 'Home'),
      badge: str(get(home, 'team.logo')) || undefined,
    },
    awayTeam: {
      id: str(get(away, 'id')),
      name: str(get(away, 'team.displayName'), 'Away'),
      badge: str(get(away, 'team.logo')) || undefined,
    },
    score: {
      home: num(get(home, 'score')),
      away: num(get(away, 'score')),
    },
    clock: str(get(r, 'status.displayClock'), '0:00'),
    status: statusMap[statusType] || 'pre',
    startTime: new Date(str(get(r, 'date'))),
    markets: [],
    source: 'espn',
    lastUpdated: new Date(),
  };
}

// ---------------------------------------------------------------------------
// CricketData.org
// Docs: https://cricketdata.org/
// Each match has { id, name, series_id, teamInfo[], score[], … }
// ---------------------------------------------------------------------------

export function normalizeCricket(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  const r = raw as Record<string, unknown>;
  const teamInfo = r.teamInfo as unknown[] | undefined;
  const home = teamInfo?.[0] as Record<string, unknown> | undefined;
  const away = teamInfo?.[1] as Record<string, unknown> | undefined;
  const scoreArr = r.score as unknown[] | undefined;

  return {
    id: str(r.id),
    sport: 'cricket',
    competition: {
      id: str(r.series_id),
      name: str(r.name, 'Cricket Match'),
    },
    homeTeam: {
      id: str(get(home, 'shortname')),
      name: str(get(home, 'name'), 'Team A'),
      badge: str(get(home, 'img')) || undefined,
    },
    awayTeam: {
      id: str(get(away, 'shortname')),
      name: str(get(away, 'name'), 'Team B'),
      badge: str(get(away, 'img')) || undefined,
    },
    score: {
      home: num(get(scoreArr?.[0], 'r')),
      away: num(get(scoreArr?.[1], 'r')),
    },
    clock: str(r.status, ''),
    status: r.matchStarted ? 'live' : 'pre',
    startTime: new Date(str(r.dateTimeGMT)),
    markets: [],
    source: 'cricketdata',
    lastUpdated: new Date(),
  };
}

// ---------------------------------------------------------------------------
// API-Basketball  (v1.basketball.api-sports.io)
// Each game has { id, date, status, league, country, teams, scores }
// status.short: NS, Q1, Q2, Q3, Q4, HT, OT, BT, AOT, FT, POST
// scores.home/away: { quarter_1..4, over_time, total }
// ---------------------------------------------------------------------------

export function normalizeApiBasketball(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  const r = raw as Record<string, unknown>;
  const status = r.status as Record<string, unknown> | undefined;
  const league = r.league as Record<string, unknown> | undefined;
  const teams = r.teams as Record<string, unknown> | undefined;
  const scores = r.scores as Record<string, unknown> | undefined;

  if (!teams) return null;

  const statusShort = str(get(status, 'short'));

  const statusMap: Record<string, EventStatus> = {
    NS: 'pre',
    Q1: 'live', Q2: 'live', Q3: 'live', Q4: 'live',
    OT: 'live', BT: 'live',
    HT: 'ht',
    AOT: 'ft', FT: 'ft', POST: 'ft',
  };

  const homeScore = scores?.home as Record<string, unknown> | undefined;
  const awayScore = scores?.away as Record<string, unknown> | undefined;

  const timer = str(get(status, 'timer'));
  const statusLong = str(get(status, 'long'));
  let clock = '';
  if (timer) clock = `${timer}'`;
  else if (statusLong) clock = statusLong;
  else clock = statusShort;

  return {
    id: `bb-${str(r.id)}`,
    sport: 'basketball',
    competition: {
      id: str(get(league, 'id')),
      name: str(get(league, 'name'), 'Basketball'),
      logo: str(get(league, 'logo')) || undefined,
    },
    homeTeam: {
      id: str(get(teams, 'home.id')),
      name: str(get(teams, 'home.name'), 'Home'),
      badge: str(get(teams, 'home.logo')) || undefined,
    },
    awayTeam: {
      id: str(get(teams, 'away.id')),
      name: str(get(teams, 'away.name'), 'Away'),
      badge: str(get(teams, 'away.logo')) || undefined,
    },
    score: {
      home: num(get(homeScore, 'total')),
      away: num(get(awayScore, 'total')),
    },
    clock,
    status: statusMap[statusShort] || 'pre',
    startTime: new Date(str(r.date)),
    markets: [],
    source: 'api-basketball',
    lastUpdated: new Date(),
  };
}

// ---------------------------------------------------------------------------
// API-Hockey  (v1.hockey.api-sports.io)
// Each game has { id, date, status, league, country, teams, scores, periods }
// status.short: NS, P1, P2, P3, OT, PT, BT, FT, AOT, AP
// scores.home/away: number (total)
// ---------------------------------------------------------------------------

export function normalizeApiHockey(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  const r = raw as Record<string, unknown>;
  const status = r.status as Record<string, unknown> | undefined;
  const league = r.league as Record<string, unknown> | undefined;
  const teams = r.teams as Record<string, unknown> | undefined;
  const scores = r.scores as Record<string, unknown> | undefined;

  if (!teams) return null;

  const statusShort = str(get(status, 'short'));

  const statusMap: Record<string, EventStatus> = {
    NS: 'pre',
    P1: 'live', P2: 'live', P3: 'live',
    OT: 'live', PT: 'live', BT: 'ht',
    FT: 'ft', AOT: 'ft', AP: 'ft',
  };

  const timer = str(r.timer);
  const statusLong = str(get(status, 'long'));
  let clock = '';
  if (timer) clock = `${timer}'`;
  else if (statusLong) clock = statusLong;
  else clock = statusShort;

  return {
    id: `hk-${str(r.id)}`,
    sport: 'ice_hockey',
    competition: {
      id: str(get(league, 'id')),
      name: str(get(league, 'name'), 'Hockey'),
      logo: str(get(league, 'logo')) || undefined,
    },
    homeTeam: {
      id: str(get(teams, 'home.id')),
      name: str(get(teams, 'home.name'), 'Home'),
      badge: str(get(teams, 'home.logo')) || undefined,
    },
    awayTeam: {
      id: str(get(teams, 'away.id')),
      name: str(get(teams, 'away.name'), 'Away'),
      badge: str(get(teams, 'away.logo')) || undefined,
    },
    score: {
      home: num(scores?.home),
      away: num(scores?.away),
    },
    clock,
    status: statusMap[statusShort] || 'pre',
    startTime: new Date(str(r.date)),
    markets: [],
    source: 'api-hockey',
    lastUpdated: new Date(),
  };
}

// ---------------------------------------------------------------------------
// API-Baseball  (v1.baseball.api-sports.io)
// Each game has { id, date, status, league, country, teams, scores }
// status.short: NS, IN1-IN9, FT, POST, CANC, PST, AWD, WO
// scores.home/away: { hits, errors, innings: {...}, total }
// ---------------------------------------------------------------------------

export function normalizeApiBaseball(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  const r = raw as Record<string, unknown>;
  const status = r.status as Record<string, unknown> | undefined;
  const league = r.league as Record<string, unknown> | undefined;
  const teams = r.teams as Record<string, unknown> | undefined;
  const scores = r.scores as Record<string, unknown> | undefined;

  if (!teams) return null;

  const statusShort = str(get(status, 'short'));

  // IN1..IN9 and extra innings are live
  const isInning = /^IN\d+$/.test(statusShort);
  let eventStatus: EventStatus = 'pre';
  if (statusShort === 'NS') eventStatus = 'pre';
  else if (isInning) eventStatus = 'live';
  else if (['FT', 'POST', 'AWD', 'WO'].includes(statusShort)) eventStatus = 'ft';
  else if (['CANC', 'PST'].includes(statusShort)) eventStatus = 'pre';
  else eventStatus = 'live'; // default to live for unknown active statuses

  const homeScore = scores?.home as Record<string, unknown> | undefined;
  const awayScore = scores?.away as Record<string, unknown> | undefined;

  const statusLong = str(get(status, 'long'));

  return {
    id: `bs-${str(r.id)}`,
    sport: 'baseball',
    competition: {
      id: str(get(league, 'id')),
      name: str(get(league, 'name'), 'Baseball'),
      logo: str(get(league, 'logo')) || undefined,
    },
    homeTeam: {
      id: str(get(teams, 'home.id')),
      name: str(get(teams, 'home.name'), 'Home'),
      badge: str(get(teams, 'home.logo')) || undefined,
    },
    awayTeam: {
      id: str(get(teams, 'away.id')),
      name: str(get(teams, 'away.name'), 'Away'),
      badge: str(get(teams, 'away.logo')) || undefined,
    },
    score: {
      home: num(get(homeScore, 'total')),
      away: num(get(awayScore, 'total')),
    },
    clock: statusLong || statusShort,
    status: eventStatus,
    startTime: new Date(str(r.date)),
    markets: [],
    source: 'api-baseball',
    lastUpdated: new Date(),
  };
}

// ---------------------------------------------------------------------------
// OddsPapi / The Odds API
// Docs: https://the-odds-api.com/liveapi/guides/v4/
// Each event has { bookmakers: [{ title, markets: [{ key, outcomes }] }] }
// ---------------------------------------------------------------------------

export function normalizeOddsMarkets(raw: unknown, _source: string): Market[] {
  if (!raw || typeof raw !== 'object') return [];

  const r = raw as Record<string, unknown>;
  const homeTeam = str(r.home_team);
  const awayTeam = str(r.away_team);
  const bookmakers = r.bookmakers as unknown[] | undefined;
  if (!Array.isArray(bookmakers) || bookmakers.length === 0) return [];

  const MARKET_LABELS: Record<string, string> = {
    h2h: 'Match Result',
    spreads: 'Spread',
    totals: 'Over/Under',
  };

  // Collect all prices per market+outcome across bookmakers, then average
  const collector = new Map<string, Map<string, number[]>>();

  for (const bm of bookmakers) {
    const b = bm as Record<string, unknown>;
    const bmMarkets = b.markets as unknown[] | undefined;
    if (!Array.isArray(bmMarkets)) continue;

    for (const m of bmMarkets) {
      const market = m as Record<string, unknown>;
      const marketKey = str(market.key);
      if (!collector.has(marketKey)) collector.set(marketKey, new Map());
      const outcomeMap = collector.get(marketKey)!;

      const outcomes = market.outcomes as unknown[] | undefined;
      if (!Array.isArray(outcomes)) continue;

      for (const o of outcomes) {
        const outcome = o as Record<string, unknown>;
        const outcomeName = str(outcome.name);
        if (!outcomeMap.has(outcomeName)) outcomeMap.set(outcomeName, []);
        const price = num(outcome.price, 0);
        if (price > 0) outcomeMap.get(outcomeName)!.push(price);
      }
    }
  }

  const markets: Market[] = [];

  for (const [marketKey, outcomeMap] of collector) {
    const selections: Selection[] = [];

    for (const [outcomeName, prices] of outcomeMap) {
      if (prices.length === 0) continue;
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const rounded = Math.round(avg * 100) / 100;

      let displayName = outcomeName;
      if (marketKey === 'h2h') {
        if (outcomeName === homeTeam) displayName = 'Home';
        else if (outcomeName === awayTeam) displayName = 'Away';
        else if (outcomeName.toLowerCase() === 'draw') displayName = 'Draw';
      }

      selections.push({
        id: `${marketKey}-${outcomeName}`,
        name: displayName,
        odds: rounded,
        bookmaker: `avg(${prices.length})`,
        suspended: false,
      });
    }

    if (selections.length > 0) {
      const label = MARKET_LABELS[marketKey] || marketKey
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      markets.push({
        id: marketKey,
        name: label,
        selections,
      });
    }
  }

  return markets;
}
