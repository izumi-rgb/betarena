export type SportKey = 'football' | 'basketball' | 'tennis' | 'cricket' | 'golf' | 'esports';

export type EventStatus = 'pre' | 'live' | 'ht' | 'ft';

export interface LiveEvent {
  id: string;
  sport: SportKey;
  competition: { id: string; name: string; logo?: string };
  homeTeam: { id: string; name: string; badge?: string };
  awayTeam: { id: string; name: string; badge?: string };
  score: { home: number; away: number };
  clock: string;
  status: EventStatus;
  startTime: Date;
  stats?: Record<string, string>;
  markets: Market[];
  source: string;
  lastUpdated: Date;
}

export interface Market {
  id: string;
  name: string;
  selections: Selection[];
}

export interface Selection {
  id: string;
  name: string;
  odds: number;
  bookmaker: string;
  suspended: boolean;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  dailyLimit?: number;
  rateLimitMs?: number;
}
