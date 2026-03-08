import axios from 'axios';
import logger from '../../../config/logger';
import { getCachedOrFetch, CACHE_TTL } from '../cache/redis-strategy';

// ---------------------------------------------------------------------------
// Cricbuzz provider via RapidAPI (free-cricbuzz-cricket-api)
// Scrapes live cricket data from Cricbuzz. No daily limit, rate-limited only.
// Auth: X-RapidAPI-Key header.
// ---------------------------------------------------------------------------

const PROVIDER = 'cricbuzz';
const BASE_URL = 'https://free-cricbuzz-cricket-api.p.rapidapi.com';

function getApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    logger.warn(`${PROVIDER}: RAPIDAPI_KEY is not set`);
    return '';
  }
  return key;
}

async function fetchFromApi<T>(endpoint: string): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const response = await axios.get<T>(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-rapidapi-host': 'free-cricbuzz-cricket-api.p.rapidapi.com',
      'x-rapidapi-key': apiKey,
    },
    timeout: 10_000,
  });

  return response.data;
}

// ---------------------------------------------------------------------------
// Types matching the Cricbuzz API response shape
// ---------------------------------------------------------------------------

export interface CricbuzzMatch {
  id: string;
  title: string;
  teams: Array<{ team: string; run?: string }>;
  timeAndPlace?: { date?: string; time?: string; place?: string };
  overview?: string; // e.g. "India lead by 50 runs", "Match drawn", etc.
}

export interface CricbuzzLiveScore {
  title?: string;
  update?: string;
  liveScore?: string;
  runRate?: string;
  batsmanOne?: { name: string; runs: string; balls: string; strikeRate: string };
  batsmanTwo?: { name: string; runs: string; balls: string; strikeRate: string };
  bowlerOne?: { name: string; overs: string; runs: string; wickets: string; economy: string };
  bowlerTwo?: { name: string; overs: string; runs: string; wickets: string; economy: string };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch live cricket matches. Cache: 30 s.
 * Returns matches with type filtering (international by default).
 */
export async function getLiveMatches(type: string = 'international'): Promise<CricbuzzMatch[]> {
  return getCachedOrFetch(
    `${PROVIDER}:live:${type}`,
    CACHE_TTL.LIVE_CRICKET,
    async () => {
      const data = await fetchFromApi<{ data?: { matches?: CricbuzzMatch[] } }>(
        `/cricket-match/live-scores?type=${type}`,
      );
      return data?.data?.matches ?? [];
    },
  ) as Promise<CricbuzzMatch[]>;
}

/**
 * Fetch all live matches across all types. Cache: 30 s.
 */
export async function getAllLiveMatches(): Promise<CricbuzzMatch[]> {
  const types = ['international', 'league', 'domestic', 'women'];
  const results = await Promise.allSettled(types.map(t => getLiveMatches(t)));

  const all: CricbuzzMatch[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      for (const m of result.value) {
        if (m.id && !seen.has(m.id)) {
          seen.add(m.id);
          all.push(m);
        }
      }
    }
  }
  return all;
}

/**
 * Fetch detailed live score for a specific match. Cache: 30 s.
 */
export async function getLiveScore(matchId: string): Promise<CricbuzzLiveScore | null> {
  return getCachedOrFetch(
    `${PROVIDER}:score:${matchId}`,
    CACHE_TTL.LIVE_CRICKET,
    async () => {
      const data = await fetchFromApi<{ data?: CricbuzzLiveScore }>(
        `/cricket-match/cricket-live-match-score?matchId=${matchId}`,
      );
      return data?.data ?? null;
    },
  ) as Promise<CricbuzzLiveScore | null>;
}
