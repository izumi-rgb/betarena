import { createApiSportsProvider } from './api-sports-factory';

// ---------------------------------------------------------------------------
// API-Handball provider  (v1.handball.api-sports.io)
// ---------------------------------------------------------------------------

const provider = createApiSportsProvider({
  sport: 'api-handball',
  baseUrl: 'https://v1.handball.api-sports.io',
  dailyLimit: 100,
  warnThreshold: 80,
  softCap: 90,
  endpoints: { games: '/games' },
});

export const getTodayGames = provider.getTodayGames;
