import logger from '../../config/logger';
import * as apiFootball from './providers/api-football';
import * as espn from './providers/espn-hidden';
import * as oddspapi from './providers/oddspapi';
import * as theOddsApi from './providers/the-odds-api';
import * as cricketData from './providers/cricket-data';
import * as theSportsDb from './providers/thesportsdb';
import { normalizeApiFootball, normalizeESPN, normalizeCricket, normalizeOddsMarkets } from './normalizer/normalizer';
import type { LiveEvent, Market } from './types';

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

  return events;
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
