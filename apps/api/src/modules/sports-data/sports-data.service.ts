import logger from '../../config/logger';
import redis from '../../config/redis';
import * as apiFootball from './providers/api-football';
import * as espn from './providers/espn-hidden';
import * as oddspapi from './providers/oddspapi';
import * as theOddsApi from './providers/the-odds-api';
import * as cricketData from './providers/cricket-data';
import * as theSportsDb from './providers/thesportsdb';
import { normalizeApiFootball, normalizeESPN, normalizeCricket, normalizeOddsMarkets } from './normalizer/normalizer';
import type { LiveEvent, Market } from './types';

// ---------------------------------------------------------------------------
// Display filtering constants
// ---------------------------------------------------------------------------

const MIN_EVENTS_TO_SHOW = 8;
const MAX_EVENTS_TO_SHOW = 20;

const TIER_1_LEAGUES = new Set([
  'premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1',
  'champions league', 'europa league',
  'nba', 'nfl', 'nhl', 'mlb',
  'atp', 'wta', 'grand slam',
  'ipl', 'big bash', 'test cricket',
]);

const TIER_2_LEAGUES = new Set([
  'mls', 'eredivisie', 'primeira liga', 'scottish premiership',
  'college basketball', 'college football',
]);

function getLeagueTier(event: LiveEvent): 1 | 2 | 3 {
  const name = (event.competition?.name ?? '').toLowerCase();
  for (const t1 of TIER_1_LEAGUES) if (name.includes(t1)) return 1;
  for (const t2 of TIER_2_LEAGUES) if (name.includes(t2)) return 2;
  return 3;
}

export function filterAndSortEvents(events: LiveEvent[]): LiveEvent[] {
  const hasOdds = events.filter((e) => e.markets.length > 0);
  const noOdds  = events.filter((e) => e.markets.length === 0);

  hasOdds.sort((a, b) => getLeagueTier(a) - getLeagueTier(b));

  let result: LiveEvent[];
  if (hasOdds.length >= MIN_EVENTS_TO_SHOW) {
    result = hasOdds;
  } else {
    noOdds.sort((a, b) => getLeagueTier(a) - getLeagueTier(b));
    result = [...hasOdds, ...noOdds];
  }

  return result.slice(0, MAX_EVENTS_TO_SHOW);
}

const DISPLAY_LIST_KEY = 'display:live:events';
const DISPLAY_LIST_TTL = 60; // seconds — longer than raw provider TTL (15s)

async function mergeWithDisplayList(fresh: LiveEvent[]): Promise<LiveEvent[]> {
  let existing: LiveEvent[] = [];

  try {
    const cached = await redis.get(DISPLAY_LIST_KEY);
    if (cached) {
      existing = JSON.parse(cached) as LiveEvent[];
      // Restore Date objects serialised as strings by JSON
      for (const e of existing) {
        e.startTime = new Date(e.startTime);
        e.lastUpdated = new Date(e.lastUpdated);
      }
    }
  } catch (err) {
    logger.warn('mergeWithDisplayList: Redis read failed (non-fatal)', {
      error: (err as Error).message,
    });
  }

  const freshById = new Map<string, LiveEvent>(fresh.map((e) => [e.id, e]));

  // 1. Update-in-place for events already in the display list
  const merged: LiveEvent[] = [];
  for (const old of existing) {
    if (old.status === 'ft') continue; // remove finished events
    const updated = freshById.get(old.id);
    merged.push(updated ?? old); // keep position; use fresh data if available
  }

  // 2. Append genuinely new events (not in the existing list)
  const existingIds = new Set(existing.map((e) => e.id));
  const newEvents = fresh.filter((e) => !existingIds.has(e.id));
  newEvents.sort((a, b) => getLeagueTier(a) - getLeagueTier(b));
  merged.push(...newEvents);

  const result = merged.slice(0, MAX_EVENTS_TO_SHOW);

  try {
    await redis.setex(DISPLAY_LIST_KEY, DISPLAY_LIST_TTL, JSON.stringify(result));
  } catch (err) {
    logger.warn('mergeWithDisplayList: Redis write failed (non-fatal)', {
      error: (err as Error).message,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Team-name matching for odds enrichment
// ---------------------------------------------------------------------------

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(fc|sc|cf|afc|ac|as|us|ss|rc|rcd|cd|ud|sd|fk|sk|bk|if|bv|sv|tsv|vfb|vfl)\b/g, '')
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function teamNamesMatch(a: string, b: string): boolean {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  if (na === nb) return true;
  if (na.length > 2 && nb.length > 2 && (na.includes(nb) || nb.includes(na))) return true;

  const wordsA = na.split(' ').filter(w => w.length > 2);
  const wordsB = nb.split(' ').filter(w => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const shared = wordsA.filter(w => wordsB.some(wb => wb.includes(w) || w.includes(wb)));
  const threshold = Math.min(wordsA.length, wordsB.length);
  return shared.length >= 1 && shared.length >= Math.max(threshold * 0.3, 1);
}

/**
 * Build a lookup of odds keyed by normalized team-name pairs.
 * Uses The Odds API "upcoming" bulk endpoint (single call, cached 30 min).
 */
async function buildOddsLookup(): Promise<Map<string, Market[]>> {
  const lookup = new Map<string, Market[]>();
  try {
    const upcoming = await theOddsApi.getUpcomingOdds();
    if (!Array.isArray(upcoming)) return lookup;

    for (const item of upcoming) {
      const r = item as Record<string, unknown>;
      const home = String(r.home_team || '');
      const away = String(r.away_team || '');
      if (!home || !away) continue;

      const markets = normalizeOddsMarkets(r, 'the-odds-api');
      if (markets.length === 0) continue;

      const key = `${normalizeTeamName(home)}||${normalizeTeamName(away)}`;
      lookup.set(key, markets);
    }
    logger.info(`Odds lookup built: ${lookup.size} events with odds`);
  } catch (err) {
    logger.warn('Failed to build odds lookup from The Odds API', {
      error: (err as Error).message,
    });
  }
  return lookup;
}

function findOddsForEvent(event: LiveEvent, lookup: Map<string, Market[]>): Market[] {
  const homeNorm = normalizeTeamName(event.homeTeam.name);
  const awayNorm = normalizeTeamName(event.awayTeam.name);
  const directKey = `${homeNorm}||${awayNorm}`;
  if (lookup.has(directKey)) return lookup.get(directKey)!;

  for (const [key, markets] of lookup) {
    const [h, a] = key.split('||');
    if (teamNamesMatch(event.homeTeam.name, h) && teamNamesMatch(event.awayTeam.name, a)) {
      return markets;
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Main aggregation
// ---------------------------------------------------------------------------

export async function getLiveEvents(): Promise<LiveEvent[]> {
  const events: LiveEvent[] = [];

  try {
    const footballFixtures = await apiFootball.getLiveFixtures();
    if (Array.isArray(footballFixtures)) {
      for (const raw of footballFixtures) {
        const event = normalizeApiFootball(raw);
        if (event) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch live football', { error: (err as Error).message });
  }

  try {
    const espnData = await espn.getAllUSScoreboards();
    for (const [sport, data] of Object.entries(espnData)) {
      if (!data || typeof data !== 'object') continue;
      const espnEvents = (data as Record<string, unknown>).events as unknown[] | undefined;
      if (!Array.isArray(espnEvents)) continue;
      for (const raw of espnEvents) {
        const event = normalizeESPN(raw, sport);
        if (event) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch ESPN data', { error: (err as Error).message });
  }

  try {
    const cricketMatches = await cricketData.getCurrentMatches();
    if (Array.isArray(cricketMatches)) {
      for (const raw of cricketMatches) {
        const event = normalizeCricket(raw);
        if (event) events.push(event);
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch cricket data', { error: (err as Error).message });
  }

  // Enrich events with real odds from The Odds API
  try {
    const oddsLookup = await buildOddsLookup();
    let enriched = 0;
    for (const event of events) {
      const markets = findOddsForEvent(event, oddsLookup);
      if (markets.length > 0) {
        event.markets = markets;
        enriched++;
      }
    }
    if (enriched > 0) {
      logger.info(`Enriched ${enriched}/${events.length} events with odds`);
    }
  } catch (err) {
    logger.warn('Odds enrichment failed (non-fatal)', { error: (err as Error).message });
  }

  const filtered = filterAndSortEvents(events);
  const stable = await mergeWithDisplayList(filtered);
  logger.info(`getLiveEvents: ${events.length} raw → ${filtered.length} filtered → ${stable.length} stable`);
  return stable;
}

export async function getEvent(eventId: string): Promise<LiveEvent | null> {
  try {
    const raw = await apiFootball.getFixture(eventId);
    if (raw) {
      const event = normalizeApiFootball(raw);
      if (event) {
        // Enrich with odds
        const markets = await getMarkets(eventId);
        return { ...event, markets };
      }
    }
  } catch (err) {
    logger.warn('Failed to fetch event from API-Football', { eventId, error: (err as Error).message });
  }
  return null;
}

export async function getMarkets(eventId: string): Promise<Market[]> {
  try {
    const raw = await oddspapi.getEventOdds(eventId);
    if (raw) {
      return normalizeOddsMarkets(raw, 'oddspapi');
    }
  } catch (err) {
    logger.warn('OddsPapi failed, trying backup', { eventId, error: (err as Error).message });
  }

  // Fallback to The Odds API
  try {
    const raw = await theOddsApi.getOddsForSport('upcoming');
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const r = item as Record<string, unknown>;
        if (String(r.id) === eventId) {
          return normalizeOddsMarkets(r, 'the-odds-api');
        }
      }
    }
  } catch (err) {
    logger.warn('The Odds API backup also failed', { eventId, error: (err as Error).message });
  }

  return [];
}

export async function getTeamInfo(teamName: string) {
  return theSportsDb.searchTeam(teamName);
}

export async function getCompetitionInfo(leagueId: string) {
  return theSportsDb.getLeague(leagueId);
}

export async function getResults(leagueId: string) {
  return theSportsDb.getPastResults(leagueId);
}
