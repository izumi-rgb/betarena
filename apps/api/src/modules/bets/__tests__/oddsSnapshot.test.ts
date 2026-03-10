import { validateBetInput } from '../bets.validator';

/**
 * Bet validation and odds snapshot tests.
 *
 * These tests validate the pure validation logic in bets.validator.ts,
 * covering bet types, stake validation, odds checks, and type-specific
 * constraints (single, accumulator, over/under, each-way, etc.).
 *
 * No database or Redis required — these are pure function tests.
 */

describe('validateBetInput', () => {
  // ─── Required fields ────────────────────────────────────────────────

  describe('required fields', () => {
    it('rejects missing type', () => {
      const result = validateBetInput({
        type: '',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 1.5 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/required/i);
    });

    it('rejects missing stake (zero)', () => {
      const result = validateBetInput({
        type: 'single',
        stake: 0,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 1.5 }],
      });
      expect(result.valid).toBe(false);
    });

    it('rejects missing selections', () => {
      const result = validateBetInput({
        type: 'single',
        stake: 10,
        selections: [],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/non-empty/i);
    });
  });

  // ─── Stake validation ──────────────────────────────────────────────

  describe('stake validation', () => {
    it('rejects negative stake', () => {
      const result = validateBetInput({
        type: 'single',
        stake: -5,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 1.5 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/positive/i);
    });
  });

  // ─── Odds validation ──────────────────────────────────────────────

  describe('odds validation', () => {
    it('rejects negative odds', () => {
      const result = validateBetInput({
        type: 'single',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: -1 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/odds/i);
    });

    it('rejects zero odds', () => {
      const result = validateBetInput({
        type: 'single',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 0 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/odds/i);
    });

    it('rejects NaN odds', () => {
      const result = validateBetInput({
        type: 'single',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: NaN }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/odds/i);
    });

    it('rejects selection missing event_id', () => {
      const result = validateBetInput({
        type: 'single',
        stake: 10,
        selections: [{ market_type: 'ml', selection_name: 'Home', odds: 1.5 }],
      });
      expect(result.valid).toBe(false);
    });

    it('rejects selection missing market_type', () => {
      const result = validateBetInput({
        type: 'single',
        stake: 10,
        selections: [{ event_id: 1, selection_name: 'Home', odds: 1.5 }],
      });
      expect(result.valid).toBe(false);
    });

    it('rejects selection missing selection_name', () => {
      const result = validateBetInput({
        type: 'single',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ml', odds: 1.5 }],
      });
      expect(result.valid).toBe(false);
    });
  });

  // ─── Single bet ────────────────────────────────────────────────────

  describe('single bet', () => {
    it('accepts valid single bet', () => {
      const result = validateBetInput({
        type: 'single',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 1.5 }],
      });
      expect(result.valid).toBe(true);
    });

    it('rejects single bet with multiple selections', () => {
      const result = validateBetInput({
        type: 'single',
        stake: 10,
        selections: [
          { event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 1.5 },
          { event_id: 2, market_type: 'ml', selection_name: 'Away', odds: 2.0 },
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/exactly 1/i);
    });
  });

  // ─── Accumulator ──────────────────────────────────────────────────

  describe('accumulator', () => {
    it('rejects accumulator with only 1 selection', () => {
      const result = validateBetInput({
        type: 'accumulator',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 1.5 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/at least 2/i);
    });

    it('accepts valid accumulator with 2 selections', () => {
      const result = validateBetInput({
        type: 'accumulator',
        stake: 10,
        selections: [
          { event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 1.5 },
          { event_id: 2, market_type: 'ml', selection_name: 'Away', odds: 2.0 },
        ],
      });
      expect(result.valid).toBe(true);
    });

    it('accepts accumulator with many selections', () => {
      const selections = Array.from({ length: 8 }, (_, i) => ({
        event_id: i + 1,
        market_type: 'ml',
        selection_name: 'Home',
        odds: 1.5 + i * 0.1,
      }));
      const result = validateBetInput({ type: 'accumulator', stake: 5, selections });
      expect(result.valid).toBe(true);
    });
  });

  // ─── Over/Under ───────────────────────────────────────────────────

  describe('over_under', () => {
    it('rejects over/under without total_line', () => {
      const result = validateBetInput({
        type: 'over_under',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ou', selection_name: 'Over', odds: 1.9 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/total_line/i);
    });

    it('rejects over/under with zero total_line', () => {
      const result = validateBetInput({
        type: 'over_under',
        stake: 10,
        total_line: 0,
        selections: [{ event_id: 1, market_type: 'ou', selection_name: 'Over', odds: 1.9 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/total_line/i);
    });

    it('accepts valid over/under bet', () => {
      const result = validateBetInput({
        type: 'over_under',
        stake: 10,
        total_line: 2.5,
        selections: [{ event_id: 1, market_type: 'ou', selection_name: 'Over', odds: 1.9 }],
      });
      expect(result.valid).toBe(true);
    });

    it('rejects over/under with multiple selections', () => {
      const result = validateBetInput({
        type: 'over_under',
        stake: 10,
        total_line: 2.5,
        selections: [
          { event_id: 1, market_type: 'ou', selection_name: 'Over', odds: 1.9 },
          { event_id: 2, market_type: 'ou', selection_name: 'Under', odds: 1.8 },
        ],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/exactly 1/i);
    });
  });

  // ─── Unsupported type ─────────────────────────────────────────────

  describe('unsupported bet type', () => {
    it('rejects unknown bet type', () => {
      const result = validateBetInput({
        type: 'parlay_plus',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 1.5 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/unsupported/i);
    });

    it('rejects fantasy bet type', () => {
      const result = validateBetInput({
        type: 'fantasy',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 1.5 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/unsupported/i);
    });
  });

  // ─── Each-way ─────────────────────────────────────────────────────

  describe('each_way', () => {
    it('rejects each-way without ew_fraction', () => {
      const result = validateBetInput({
        type: 'each_way',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 5.0 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/ew_fraction/i);
    });

    it('rejects each-way without ew_places', () => {
      const result = validateBetInput({
        type: 'each_way',
        stake: 10,
        ew_fraction: 4,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 5.0 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/ew_places/i);
    });

    it('accepts valid each-way bet', () => {
      const result = validateBetInput({
        type: 'each_way',
        stake: 10,
        ew_fraction: 4,
        ew_places: 3,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 5.0 }],
      });
      expect(result.valid).toBe(true);
    });

    it('rejects invalid ew_fraction', () => {
      const result = validateBetInput({
        type: 'each_way',
        stake: 10,
        ew_fraction: 3,
        ew_places: 3,
        selections: [{ event_id: 1, market_type: 'ml', selection_name: 'Home', odds: 5.0 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/ew_fraction/i);
    });
  });

  // ─── Asian handicap ──────────────────────────────────────────────

  describe('asian_handicap', () => {
    it('rejects asian handicap without handicap_line', () => {
      const result = validateBetInput({
        type: 'asian_handicap',
        stake: 10,
        selections: [{ event_id: 1, market_type: 'ah', selection_name: 'Home', odds: 1.9 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/handicap_line/i);
    });

    it('accepts valid asian handicap bet', () => {
      const result = validateBetInput({
        type: 'asian_handicap',
        stake: 10,
        handicap_line: -0.5,
        selections: [{ event_id: 1, market_type: 'ah', selection_name: 'Home', odds: 1.9 }],
      });
      expect(result.valid).toBe(true);
    });
  });
});
