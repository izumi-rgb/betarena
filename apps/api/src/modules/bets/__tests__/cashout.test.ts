import { calculateCashoutOffer } from '../bets.service';

/**
 * Unit tests for the cashout offer formula.
 *
 * calculateCashoutOffer is a pure function that computes an offer amount
 * based on stake, potential win, bet type, and number of selections.
 * No DB or Redis dependency.
 */

function makeBet(overrides: Record<string, unknown> = {}) {
  return {
    stake: '100',
    potential_win: '190',
    type: 'single',
    selections: JSON.stringify([{ event_id: 1 }]),
    ...overrides,
  };
}

describe('calculateCashoutOffer', () => {
  test('single bet cashout is within expected range', () => {
    const offer = calculateCashoutOffer(makeBet());
    // typeFactor=0.86, complexityFactor=1.0, gross=190*0.86=163.4
    // floor=100*0.65=65, ceiling=190*0.92=174.8
    // capped = min(174.8, max(65, 163.4)) = 163.4
    expect(offer).toBeGreaterThan(0);
    expect(offer).toBeLessThanOrEqual(190 * 0.92);
    expect(offer).toBeGreaterThanOrEqual(100 * 0.65);
  });

  test('accumulator cashout uses lower type factor than single', () => {
    const single = calculateCashoutOffer(makeBet({
      potential_win: '500',
      type: 'single',
      selections: JSON.stringify([{ event_id: 1 }]),
    }));
    const acca = calculateCashoutOffer(makeBet({
      potential_win: '500',
      type: 'accumulator',
      selections: JSON.stringify([{ event_id: 1 }, { event_id: 2 }]),
    }));
    expect(acca).toBeLessThan(single);
  });

  test('more selections reduces cashout offer', () => {
    const two = calculateCashoutOffer(makeBet({
      potential_win: '500',
      type: 'accumulator',
      selections: JSON.stringify([{ event_id: 1 }, { event_id: 2 }]),
    }));
    const five = calculateCashoutOffer(makeBet({
      potential_win: '500',
      type: 'accumulator',
      selections: JSON.stringify([
        { event_id: 1 },
        { event_id: 2 },
        { event_id: 3 },
        { event_id: 4 },
        { event_id: 5 },
      ]),
    }));
    expect(five).toBeLessThan(two);
  });

  test('floor: never below 65% of stake', () => {
    // Low potential win relative to stake => gross would be low
    const offer = calculateCashoutOffer(makeBet({
      stake: '100',
      potential_win: '101',
      type: 'single',
    }));
    expect(offer).toBeGreaterThanOrEqual(65);
  });

  test('ceiling: never above 92% of potential win', () => {
    const offer = calculateCashoutOffer(makeBet({
      stake: '100',
      potential_win: '10000',
      type: 'single',
    }));
    expect(offer).toBeLessThanOrEqual(9200);
  });

  test('system bet type uses lowest type factor (0.68)', () => {
    const systemOffer = calculateCashoutOffer(makeBet({
      potential_win: '500',
      type: 'system',
      selections: JSON.stringify([{ event_id: 1 }, { event_id: 2 }, { event_id: 3 }]),
    }));
    const accaOffer = calculateCashoutOffer(makeBet({
      potential_win: '500',
      type: 'accumulator',
      selections: JSON.stringify([{ event_id: 1 }, { event_id: 2 }, { event_id: 3 }]),
    }));
    expect(systemOffer).toBeLessThan(accaOffer);
  });

  test('returns a number with at most 2 decimal places', () => {
    const offer = calculateCashoutOffer(makeBet({ potential_win: '333.33' }));
    const decimals = offer.toString().split('.')[1];
    expect(!decimals || decimals.length <= 2).toBe(true);
  });

  test('handles string selections field (JSON parsing)', () => {
    const offer = calculateCashoutOffer({
      stake: '50',
      potential_win: '100',
      type: 'single',
      selections: '[{"event_id":1}]',
    });
    expect(offer).toBeGreaterThan(0);
  });

  test('handles already-parsed array selections', () => {
    const offer = calculateCashoutOffer({
      stake: '50',
      potential_win: '100',
      type: 'single',
      selections: [{ event_id: 1 }],
    });
    expect(offer).toBeGreaterThan(0);
  });
});
