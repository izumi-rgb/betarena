import { createApiSportsProvider } from './api-sports-factory';

// ---------------------------------------------------------------------------
// API-Volleyball provider  (v1.volleyball.api-sports.io)
// ---------------------------------------------------------------------------

const provider = createApiSportsProvider({
  sport: 'api-volleyball',
  baseUrl: 'https://v1.volleyball.api-sports.io',
  dailyLimit: 100,
  warnThreshold: 80,
  softCap: 90,
  endpoints: { games: '/games' },
});

export const getTodayGames = provider.getTodayGames;
