import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch, CACHE_TTL } from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// TheSportsDB provider  (thesportsdb.com)
// Static data: teams, badges, past results, upcoming fixtures.
// Free tier with key=123 (no signup required).
// Rate limit: 100 ms between calls.
// ---------------------------------------------------------------------------

const PROVIDER = 'thesportsdb';
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/123';
const RATE_LIMIT_MS = 100;

// Simple serial rate limiter: each call waits until at least RATE_LIMIT_MS
// has elapsed since the previous call resolved.
let lastCallTime = 0;

async function rateLimitedFetch<T>(path: string): Promise<T> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }

  const response = await axios.get<T>(`${BASE_URL}${path}`, { timeout: 10_000 });
  lastCallTime = Date.now();
  return response.data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for a team by name. Cache: 24 h.
 */
export async function searchTeam(name: string): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:search-team:${name.toLowerCase().trim()}`,
    CACHE_TTL.TEAM,
    async () => {
      const data = await rateLimitedFetch<{ teams: unknown[] | null }>(
        `/searchteams.php?t=${encodeURIComponent(name)}`,
      );
      return data.teams ?? [];
    },
  );
}

/**
 * Fetch a team by ID. Cache: 24 h.
 */
export async function getTeam(id: string | number): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:team:${id}`,
    CACHE_TTL.TEAM,
    async () => {
      const data = await rateLimitedFetch<{ teams: unknown[] | null }>(
        `/lookupteam.php?id=${id}`,
      );
      return data.teams?.[0] ?? null;
    },
  );
}

/**
 * Fetch league/competition details by ID. Cache: 2 h.
 */
export async function getLeague(id: string | number): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:league:${id}`,
    CACHE_TTL.COMPETITION,
    async () => {
      const data = await rateLimitedFetch<{ leagues: unknown[] | null }>(
        `/lookupleague.php?id=${id}`,
      );
      return data.leagues?.[0] ?? null;
    },
  );
}

/**
 * Fetch past 15 results for a league. Cache: 7 d.
 */
export async function getPastResults(leagueId: string | number): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:past-results:${leagueId}`,
    CACHE_TTL.RESULTS,
    async () => {
      const data = await rateLimitedFetch<{ events: unknown[] | null }>(
        `/eventspastleague.php?id=${leagueId}`,
      );
      return data.events ?? [];
    },
  );
}

/**
 * Fetch next 15 upcoming fixtures for a league. Cache: 2 h.
 */
export async function getUpcomingFixtures(leagueId: string | number): Promise<unknown> {
  return getCachedOrFetch(
    `${PROVIDER}:upcoming:${leagueId}`,
    CACHE_TTL.COMPETITION,
    async () => {
      const data = await rateLimitedFetch<{ events: unknown[] | null }>(
        `/eventsnextleague.php?id=${leagueId}`,
      );
      return data.events ?? [];
    },
  );
}
