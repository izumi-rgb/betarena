import { createApiSportsProvider } from './api-sports-factory';

// ---------------------------------------------------------------------------
// API-Basketball provider  (v1.basketball.api-sports.io)
// ---------------------------------------------------------------------------

const provider = createApiSportsProvider({
  sport: 'api-basketball',
  baseUrl: 'https://v1.basketball.api-sports.io',
  dailyLimit: 100,
  warnThreshold: 80,
  softCap: 90,
  endpoints: { games: '/games' },
});

export const getTodayGames = provider.getTodayGames;
export const getGame = provider.getGame;
