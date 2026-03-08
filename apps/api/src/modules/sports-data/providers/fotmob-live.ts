import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch } from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// Free API Live Football Data  (free-api-live-football-data.p.rapidapi.com)
// FotMob-based — free, no daily limit. Scores & live status only (no odds).
//
// Endpoints:
//   GET /football-current-live        → live matches with scores
//   GET /football-get-matches-by-date → all matches for a date (?date=YYYYMMDD)
//   GET /football-get-all-leagues     → league catalog
// ---------------------------------------------------------------------------

const PROVIDER = 'fotmob-live';
const BASE_URL = 'https://free-api-live-football-data.p.rapidapi.com';
const RAPIDAPI_HOST = 'free-api-live-football-data.p.rapidapi.com';

const LIVE_TTL = 60;           // 1 minute for live matches
const TODAY_MATCHES_TTL = 300; // 5 minutes for today's matches

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FotmobTeam {
  id: number;
  score: number;
  name: string;
  longName: string;
}

export interface FotmobStatus {
  ongoing: boolean;
  started: boolean;
  finished: boolean;
  scoreStr?: string;
  liveTime?: {
    short: string;  // e.g. "8'"
    long: string;   // e.g. "7:57"
  };
  reason?: { short?: string; long?: string };
}

export interface FotmobMatch {
  id: number;
  leagueId: number;
  leagueName?: string;
  home: FotmobTeam;
  away: FotmobTeam;
  statusId: number;
  status: FotmobStatus;
  tournamentStage?: string;
  time?: string; // kickoff time
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

function getRapidApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    logger.debug(`${PROVIDER}: RAPIDAPI_KEY is not set`);
    return '';
  }
  return key;
}

async function fetchFromApi<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  const apiKey = getRapidApiKey();
  if (!apiKey) return null;

  try {
    const response = await axios.get<T>(`${BASE_URL}${endpoint}`, {
      params,
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
      },
      timeout: 15_000,
    });
    return response.data;
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 429) {
      logger.info(`${PROVIDER}: rate limited (429)`);
    } else {
      logger.debug(`${PROVIDER}: API error`, { error: (err as Error).message });
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch currently live football matches. Cached 1 minute.
 */
export async function getLiveMatches(): Promise<FotmobMatch[]> {
  return getCachedOrFetch(
    `${PROVIDER}:live`,
    LIVE_TTL,
    async () => {
      const data = await fetchFromApi<{ response?: { matches?: FotmobMatch[] } }>(
        '/football-current-live',
      );

      // The API may return matches at top level or nested under response
      let matches: FotmobMatch[] = [];
      if (data) {
        if (Array.isArray(data)) {
          matches = data;
        } else if (data.response?.matches && Array.isArray(data.response.matches)) {
          matches = data.response.matches;
        } else if (typeof data === 'object') {
          // Try to find an array in the response
          for (const val of Object.values(data)) {
            if (Array.isArray(val)) {
              matches = val;
              break;
            }
          }
        }
      }

      logger.info(`${PROVIDER}: live → ${matches.length} matches`);
      return matches;
    },
  ) as Promise<FotmobMatch[]>;
}

/**
 * Fetch all matches for today. Cached 5 minutes.
 */
export async function getTodayMatches(): Promise<FotmobMatch[]> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  return getCachedOrFetch(
    `${PROVIDER}:today:${today}`,
    TODAY_MATCHES_TTL,
    async () => {
      const data = await fetchFromApi<{ response?: { matches?: FotmobMatch[] } }>(
        '/football-get-matches-by-date',
        { date: today },
      );

      let matches: FotmobMatch[] = [];
      if (data) {
        if (Array.isArray(data)) {
          matches = data;
        } else if (data.response?.matches && Array.isArray(data.response.matches)) {
          matches = data.response.matches;
        } else if (typeof data === 'object') {
          for (const val of Object.values(data)) {
            if (Array.isArray(val)) {
              matches = val;
              break;
            }
          }
        }
      }

      logger.info(`${PROVIDER}: today → ${matches.length} matches`);
      return matches;
    },
  ) as Promise<FotmobMatch[]>;
}
