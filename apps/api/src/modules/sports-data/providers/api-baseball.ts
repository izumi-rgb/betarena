import { createApiSportsProvider } from './api-sports-factory';

// ---------------------------------------------------------------------------
// API-Baseball provider  (v1.baseball.api-sports.io)
// ---------------------------------------------------------------------------

const provider = createApiSportsProvider({
  sport: 'api-baseball',
  baseUrl: 'https://v1.baseball.api-sports.io',
  dailyLimit: 100,
  warnThreshold: 80,
  softCap: 90,
  endpoints: { games: '/games' },
});

export const getTodayGames = provider.getTodayGames;
export const getGame = provider.getGame;
