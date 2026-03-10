import { createApiSportsProvider } from './api-sports-factory';

// ---------------------------------------------------------------------------
// API-Hockey provider  (v1.hockey.api-sports.io)
// ---------------------------------------------------------------------------

const provider = createApiSportsProvider({
  sport: 'api-hockey',
  baseUrl: 'https://v1.hockey.api-sports.io',
  dailyLimit: 100,
  warnThreshold: 80,
  softCap: 90,
  endpoints: { games: '/games' },
});

export const getTodayGames = provider.getTodayGames;
export const getGame = provider.getGame;
