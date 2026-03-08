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

  let status: EventStatus = statusMap[statusType] || 'pre';
  const startTime = new Date(str(get(r, 'date')));

  // Safety: if startTime is > 6 hours ago and has a non-zero score, treat as finished
  const ageMs = Date.now() - startTime.getTime();
  const homeScore = num(get(home, 'score'));
  const awayScore = num(get(away, 'score'));
  if (ageMs > 6 * 60 * 60 * 1000 && (homeScore > 0 || awayScore > 0) && status !== 'ft') {
    status = 'ft';
  }

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
      home: homeScore,
      away: awayScore,
    },
    clock: str(get(r, 'status.displayClock'), '0:00'),
    status,
    startTime,
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

  // Determine status: check matchEnded first
  let eventStatus: EventStatus = 'pre';
  if (r.matchEnded) {
    eventStatus = 'ft';
  } else if (r.matchStarted) {
    const statusStr = str(r.status, '').toLowerCase();
    // Finished states that API may not flag via matchEnded
    if (statusStr.includes('match drawn') || statusStr.includes('match ended') ||
        statusStr.includes('won by') || statusStr.includes('no result')) {
      eventStatus = 'ft';
    // Paused states — still in-progress but not actively playing
    } else if (statusStr.includes('innings break') || statusStr.includes('stumps') ||
               statusStr.includes('rain') || statusStr.includes('delayed') ||
               statusStr.includes('tea') || statusStr.includes('lunch') ||
               statusStr.includes('dinner') || statusStr.includes('bad light')) {
      eventStatus = 'ht'; // treat as half-time equivalent
    } else {
      eventStatus = 'live';
    }
  }

  // Align scores to teams by matching inning strings to team names
  const homeName = str(get(home, 'name'), '');
  const awayName = str(get(away, 'name'), '');
  let homeRuns = 0;
  let awayRuns = 0;

  if (Array.isArray(scoreArr)) {
    for (const inn of scoreArr) {
      const inning = inn as Record<string, unknown>;
      const inningLabel = str(inning.inning, '').toLowerCase();
      const runs = num(inning.r);
      // Match inning label to team — take the latest (highest) runs per team
      if (homeName && inningLabel.includes(homeName.toLowerCase().split(' ')[0])) {
        homeRuns = Math.max(homeRuns, runs);
      } else if (awayName && inningLabel.includes(awayName.toLowerCase().split(' ')[0])) {
        awayRuns = Math.max(awayRuns, runs);
      } else {
        // Fallback: assign by position
        if (homeRuns === 0) homeRuns = runs;
        else if (awayRuns === 0) awayRuns = runs;
      }
    }
  }

  return {
    id: str(r.id),
    sport: 'cricket',
    competition: {
      id: str(r.series_id),
      name: str(r.name, 'Cricket Match'),
    },
    homeTeam: {
      id: str(get(home, 'shortname')),
      name: homeName || 'Team A',
      badge: str(get(home, 'img')) || undefined,
    },
    awayTeam: {
      id: str(get(away, 'shortname')),
      name: awayName || 'Team B',
      badge: str(get(away, 'img')) || undefined,
    },
    score: {
      home: homeRuns,
      away: awayRuns,
    },
    clock: str(r.status, ''),
    status: eventStatus,
    startTime: new Date(str(r.dateTimeGMT)),
    markets: [],
    source: 'cricketdata',
    lastUpdated: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Cricbuzz (via RapidAPI scraper)
// Each match: { id, title, teams: [{team, run}], overview, timeAndPlace }
// overview contains live status text from Cricbuzz
// ---------------------------------------------------------------------------

export function normalizeCricbuzz(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  const title = str(r.title, 'Cricket Match');
  const teams = r.teams as Array<{ team?: string; run?: string }> | undefined;
  const overview = str(r.overview, '').toLowerCase();

  if (!teams || teams.length < 2) return null;

  const homeName = str(teams[0]?.team, 'Team A');
  const awayName = str(teams[1]?.team, 'Team B');

  // Parse runs from strings like "256/4" or "125" → extract the number before /
  function parseRuns(runStr?: string): number {
    if (!runStr) return 0;
    const match = runStr.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  const homeRuns = parseRuns(teams[0]?.run);
  const awayRuns = parseRuns(teams[1]?.run);

  // Status detection from overview text
  let eventStatus: EventStatus = 'live';
  if (overview.includes('won by') || overview.includes('match drawn') ||
      overview.includes('match ended') || overview.includes('no result') ||
      overview.includes('abandoned')) {
    eventStatus = 'ft';
  } else if (overview.includes('stumps') || overview.includes('innings break') ||
             overview.includes('rain') || overview.includes('delayed') ||
             overview.includes('tea') || overview.includes('lunch') ||
             overview.includes('dinner') || overview.includes('bad light')) {
    eventStatus = 'ht';
  } else if (!overview || overview.includes('yet to bat') || overview.includes('toss')) {
    eventStatus = 'pre';
  }

  const timeAndPlace = r.timeAndPlace as Record<string, string> | undefined;

  return {
    id: `cb-${id}`,
    sport: 'cricket',
    competition: {
      id: `cb-${id}`,
      name: title,
    },
    homeTeam: {
      id: homeName.substring(0, 3).toUpperCase(),
      name: homeName,
    },
    awayTeam: {
      id: awayName.substring(0, 3).toUpperCase(),
      name: awayName,
    },
    score: {
      home: homeRuns,
      away: awayRuns,
    },
    clock: str(r.overview, ''),
    status: eventStatus,
    startTime: timeAndPlace?.date ? new Date(timeAndPlace.date) : new Date(),
    markets: [],
    source: 'cricbuzz',
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
// API-Rugby  (v1.rugby.api-sports.io)
// Same structure as hockey: { id, date, status, league, teams, scores }
// status.short: NS, 1H, 2H, HT, FT, AET, AP
// scores.home/away: number
// ---------------------------------------------------------------------------

export function normalizeApiRugby(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const status = r.status as Record<string, unknown> | undefined;
  const league = r.league as Record<string, unknown> | undefined;
  const teams = r.teams as Record<string, unknown> | undefined;
  const scores = r.scores as Record<string, unknown> | undefined;
  if (!teams) return null;

  const statusShort = str(get(status, 'short'));
  const statusMap: Record<string, EventStatus> = {
    NS: 'pre', '1H': 'live', '2H': 'live', HT: 'ht',
    FT: 'ft', AET: 'ft', AP: 'ft',
  };

  return {
    id: `rg-${str(r.id)}`,
    sport: 'rugby',
    competition: {
      id: str(get(league, 'id')),
      name: str(get(league, 'name'), 'Rugby'),
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
    score: { home: num(scores?.home), away: num(scores?.away) },
    clock: str(get(status, 'long')) || statusShort,
    status: statusMap[statusShort] || 'pre',
    startTime: new Date(str(r.date)),
    markets: [],
    source: 'api-rugby',
    lastUpdated: new Date(),
  };
}

// ---------------------------------------------------------------------------
// API-Handball  (v1.handball.api-sports.io)
// status.short: NS, 1H, 2H, HT, FT, AET, AP, POST
// scores.home/away: number
// ---------------------------------------------------------------------------

export function normalizeApiHandball(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const status = r.status as Record<string, unknown> | undefined;
  const league = r.league as Record<string, unknown> | undefined;
  const teams = r.teams as Record<string, unknown> | undefined;
  const scores = r.scores as Record<string, unknown> | undefined;
  if (!teams) return null;

  const statusShort = str(get(status, 'short'));
  const statusMap: Record<string, EventStatus> = {
    NS: 'pre', '1H': 'live', '2H': 'live', HT: 'ht',
    FT: 'ft', AET: 'ft', AP: 'ft', POST: 'ft',
  };

  return {
    id: `hb-${str(r.id)}`,
    sport: 'handball',
    competition: {
      id: str(get(league, 'id')),
      name: str(get(league, 'name'), 'Handball'),
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
    score: { home: num(scores?.home), away: num(scores?.away) },
    clock: str(get(status, 'long')) || statusShort,
    status: statusMap[statusShort] || 'pre',
    startTime: new Date(str(r.date)),
    markets: [],
    source: 'api-handball',
    lastUpdated: new Date(),
  };
}

// ---------------------------------------------------------------------------
// API-Volleyball  (v1.volleyball.api-sports.io)
// status.short: NS, S1, S2, S3, S4, S5, FT, POST, CANC
// scores.home/away: number (sets won)
// ---------------------------------------------------------------------------

export function normalizeApiVolleyball(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const status = r.status as Record<string, unknown> | undefined;
  const league = r.league as Record<string, unknown> | undefined;
  const teams = r.teams as Record<string, unknown> | undefined;
  const scores = r.scores as Record<string, unknown> | undefined;
  if (!teams) return null;

  const statusShort = str(get(status, 'short'));
  const isSet = /^S\d$/.test(statusShort);
  let eventStatus: EventStatus = 'pre';
  if (statusShort === 'NS') eventStatus = 'pre';
  else if (isSet) eventStatus = 'live';
  else if (['FT', 'POST', 'AWD'].includes(statusShort)) eventStatus = 'ft';
  else if (['CANC', 'PST'].includes(statusShort)) eventStatus = 'pre';
  else eventStatus = 'live';

  return {
    id: `vb-${str(r.id)}`,
    sport: 'volleyball',
    competition: {
      id: str(get(league, 'id')),
      name: str(get(league, 'name'), 'Volleyball'),
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
    score: { home: num(scores?.home), away: num(scores?.away) },
    clock: str(get(status, 'long')) || statusShort,
    status: eventStatus,
    startTime: new Date(str(r.date)),
    markets: [],
    source: 'api-volleyball',
    lastUpdated: new Date(),
  };
}

// ---------------------------------------------------------------------------
// FotMob Live Football Data  (free-api-live-football-data.p.rapidapi.com)
// Each match: { id, leagueId, home, away, statusId, status }
// ---------------------------------------------------------------------------

export function normalizeFotmob(raw: unknown): LiveEvent | null {
  if (!raw || typeof raw !== 'object') return null;

  const r = raw as Record<string, unknown>;
  const home = r.home as Record<string, unknown> | undefined;
  const away = r.away as Record<string, unknown> | undefined;
  const status = r.status as Record<string, unknown> | undefined;

  if (!home || !away) return null;

  const homeName = str(get(home, 'longName') || get(home, 'name'), 'Home');
  const awayName = str(get(away, 'longName') || get(away, 'name'), 'Away');

  // Skip matches with no team names
  if (homeName === 'Home' && awayName === 'Away') return null;

  // Determine status
  let eventStatus: EventStatus = 'pre';
  if (status) {
    const finished = status.finished as boolean | undefined;
    const started = status.started as boolean | undefined;
    const ongoing = status.ongoing as boolean | undefined;

    if (finished) {
      eventStatus = 'ft';
    } else if (ongoing) {
      eventStatus = 'live';
    } else if (started && !ongoing) {
      eventStatus = 'ht'; // started but not ongoing = halftime/break
    }
  }

  // Extract clock from liveTime
  const liveTime = get(status, 'liveTime') as Record<string, unknown> | undefined;
  let clock = '';
  if (liveTime) {
    clock = str(liveTime.short, '');
  }
  if (!clock && status) {
    const reason = status.reason as Record<string, unknown> | undefined;
    if (reason) clock = str(reason.short, '');
  }

  const leagueName = str(r.leagueName, '');

  return {
    id: `fm-${str(r.id)}`,
    sport: 'football',
    competition: {
      id: str(r.leagueId),
      name: leagueName || 'Football',
    },
    homeTeam: {
      id: str(get(home, 'id')),
      name: homeName,
    },
    awayTeam: {
      id: str(get(away, 'id')),
      name: awayName,
    },
    score: {
      home: num(home.score),
      away: num(away.score),
    },
    clock,
    status: eventStatus,
    startTime: r.time ? new Date(str(r.time)) : new Date(),
    markets: [],
    source: 'fotmob-live',
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
