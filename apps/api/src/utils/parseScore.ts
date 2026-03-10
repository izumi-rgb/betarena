export interface ParsedScore {
  home: number;
  away: number;
  total: number;
}

/**
 * Parse a score object (or JSON string) into numeric home/away/total values.
 * Returns null if scoreData is falsy.
 */
export function parseScore(scoreData: unknown): ParsedScore | null {
  if (!scoreData) return null;

  const score = typeof scoreData === 'string' ? JSON.parse(scoreData) : scoreData;
  const home = parseInt((score as Record<string, unknown>)?.home as string, 10) || 0;
  const away = parseInt((score as Record<string, unknown>)?.away as string, 10) || 0;
  return { home, away, total: home + away };
}
