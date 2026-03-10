import { createApiSportsProvider } from './api-sports-factory';

// ---------------------------------------------------------------------------
// API-Rugby provider  (v1.rugby.api-sports.io)
// ---------------------------------------------------------------------------

const provider = createApiSportsProvider({
  sport: 'api-rugby',
  baseUrl: 'https://v1.rugby.api-sports.io',
  dailyLimit: 100,
  warnThreshold: 80,
  softCap: 90,
  endpoints: { games: '/games' },
});

export const getTodayGames = provider.getTodayGames;
