import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch, CACHE_TTL } from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// ESPN Hidden API provider  (site.api.espn.com)
// Free, no auth required. US sports scoreboards.
// Cache: 30 s (live score cadence).
// ---------------------------------------------------------------------------

const PROVIDER = 'espn';
const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

/**
 * Supported sport keys and their ESPN path segments.
 */
const SPORT_PATHS: Record<string, string> = {
  nba: '/basketball/nba/scoreboard',
  nfl: '/football/nfl/scoreboard',
  nhl: '/hockey/nhl/scoreboard',
  mlb: '/baseball/mlb/scoreboard',
  epl: '/soccer/eng.1/scoreboard',
  ucl: '/soccer/uefa.champions/scoreboard',
};

async function fetchScoreboard(path: string): Promise<unknown> {
  const response = await axios.get(`${BASE_URL}${path}`, { timeout: 10_000 });
  return response.data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the scoreboard for a single sport. Cache: 30 s.
 *
 * @param sport  One of: nba, nfl, nhl, mlb, epl, ucl
 */
export async function getScoreboard(sport: string): Promise<unknown> {
  const path = SPORT_PATHS[sport];
  if (!path) {
    logger.warn(`${PROVIDER}: unknown sport key "${sport}"`);
    return null;
  }

  return getCachedOrFetch(
    `${PROVIDER}:scoreboard:${sport}`,
    CACHE_TTL.LIVE_SCORE,
    async () => {
      const data = await fetchScoreboard(path);
      return data;
    },
  );
}

/**
 * Fetch scoreboards for every supported US sport in parallel. Cache: 30 s per sport.
 *
 * Returns a record keyed by sport (e.g. `{ nba: {...}, nfl: {...}, ... }`).
 */
export async function getAllUSScoreboards(): Promise<Record<string, unknown>> {
  const keys = Object.keys(SPORT_PATHS);
  const results = await Promise.allSettled(keys.map((sport) => getScoreboard(sport)));

  const out: Record<string, unknown> = {};
  for (let i = 0; i < keys.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      out[keys[i]] = result.value;
    } else {
      logger.warn(`${PROVIDER}: failed to fetch ${keys[i]}`, {
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
      out[keys[i]] = null;
    }
  }

  return out;
}
