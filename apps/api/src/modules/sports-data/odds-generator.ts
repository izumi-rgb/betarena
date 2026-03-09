import type { LiveEvent, Market, Selection } from './types';

// ---------------------------------------------------------------------------
// Synthetic odds generator for events without external odds.
// Produces realistic house odds based on sport type and live score.
// ---------------------------------------------------------------------------

// Sports that use 3-way (1X2) markets
const THREE_WAY_SPORTS = new Set(['football', 'handball', 'ice_hockey', 'rugby']);

/**
 * Deterministic seed from event ID — ensures same event gets
 * consistent odds across refreshes (avoids flickering).
 */
function seedFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Small deterministic variance so odds don't all look identical.
 * Returns a value between -range and +range.
 */
function variance(seed: number, index: number, range: number): number {
  const x = Math.sin(seed * 9301 + index * 49297) * 0.5 + 0.5; // 0..1
  return (x * 2 - 1) * range;
}

/**
 * Round odds to 2 decimal places, minimum 1.01.
 */
function clampOdds(v: number): number {
  return Math.max(1.01, Math.round(v * 100) / 100);
}

function makeSelection(name: string, odds: number, index: number): Selection {
  return {
    id: `syn-${index}`,
    name,
    odds: clampOdds(odds),
    bookmaker: 'house',
    suspended: false,
  };
}

/**
 * Generate synthetic odds for a live event based on sport and score.
 */
export function generateOdds(event: LiveEvent): Market[] {
  const seed = seedFromId(event.id);
  const diff = (event.score?.home ?? 0) - (event.score?.away ?? 0);
  const isThreeWay = THREE_WAY_SPORTS.has(event.sport);

  if (isThreeWay) {
    return [make1X2Market(event, seed, diff)];
  }
  return [makeMoneylineMarket(event, seed, diff)];
}

/**
 * 1X2 market (football, handball, etc.)
 * Base odds ~2.50/3.20/2.80, shifted by score difference.
 */
function make1X2Market(event: LiveEvent, seed: number, diff: number): Market {
  // Base: slight home advantage
  let home = 2.40 + variance(seed, 0, 0.30);
  let draw = 3.20 + variance(seed, 1, 0.25);
  let away = 2.80 + variance(seed, 2, 0.30);

  // Shift by score — leading team gets lower odds
  if (diff > 0) {
    // Home leading
    const shift = Math.min(diff * 0.6, 1.5);
    home -= shift;
    draw += shift * 0.4;
    away += shift * 0.8;
  } else if (diff < 0) {
    // Away leading
    const shift = Math.min(Math.abs(diff) * 0.6, 1.5);
    away -= shift;
    draw += shift * 0.4;
    home += shift * 0.8;
  }

  return {
    id: 'h2h',
    name: 'Match Result',
    selections: [
      makeSelection(event.homeTeam.name, home, 0),
      makeSelection('Draw', draw, 1),
      makeSelection(event.awayTeam.name, away, 2),
    ],
  };
}

/**
 * Moneyline / head-to-head market (tennis, basketball, esports, etc.)
 * Base odds ~1.85/1.95, shifted by score difference.
 */
function makeMoneylineMarket(event: LiveEvent, seed: number, diff: number): Market {
  let home = 1.85 + variance(seed, 0, 0.25);
  let away = 1.95 + variance(seed, 1, 0.25);

  // Scale shift by sport — basketball scores are larger than tennis
  const scale = ['basketball', 'baseball', 'volleyball'].includes(event.sport) ? 0.15 : 0.4;

  if (diff > 0) {
    const shift = Math.min(diff * scale, 1.2);
    home -= shift;
    away += shift;
  } else if (diff < 0) {
    const shift = Math.min(Math.abs(diff) * scale, 1.2);
    away -= shift;
    home += shift;
  }

  return {
    id: 'h2h',
    name: 'Match Result',
    selections: [
      makeSelection(event.homeTeam.name, home, 0),
      makeSelection(event.awayTeam.name, away, 1),
    ],
  };
}
