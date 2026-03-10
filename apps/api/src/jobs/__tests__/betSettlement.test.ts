import { didSelectionWin, settleAsianHandicap, settleOverUnder } from '../betSettlement';

/**
 * Unit tests for pure settlement logic functions.
 *
 * These functions are deterministic — they take a selection + event result
 * and return a win/loss/void determination with no DB or Redis dependency.
 */

const makeResult = (home: number, away: number) => ({
  id: 1,
  score: { home, away },
  home_score: home,
  away_score: away,
  total_goals: home + away,
});

// ---------------------------------------------------------------------------
// didSelectionWin
// ---------------------------------------------------------------------------
describe('didSelectionWin', () => {
  describe('Match Result / 1X2', () => {
    test('home win with "Home" label', () => {
      expect(didSelectionWin({ selection_name: 'Home', market_type: '' }, makeResult(2, 1))).toBe(true);
    });

    test('home win with "1" label', () => {
      expect(didSelectionWin({ selection_name: '1', market_type: '' }, makeResult(2, 1))).toBe(true);
    });

    test('home does not win when away leads', () => {
      expect(didSelectionWin({ selection_name: 'Home', market_type: '' }, makeResult(1, 2))).toBe(false);
    });

    test('away win with "Away" label', () => {
      expect(didSelectionWin({ selection_name: 'Away', market_type: '' }, makeResult(1, 2))).toBe(true);
    });

    test('away win with "2" label', () => {
      expect(didSelectionWin({ selection_name: '2', market_type: '' }, makeResult(1, 2))).toBe(true);
    });

    test('away does not win when home leads', () => {
      expect(didSelectionWin({ selection_name: 'Away', market_type: '' }, makeResult(2, 1))).toBe(false);
    });

    test('draw with "Draw" label', () => {
      expect(didSelectionWin({ selection_name: 'Draw', market_type: '' }, makeResult(1, 1))).toBe(true);
    });

    test('draw with "X" label', () => {
      expect(didSelectionWin({ selection_name: 'X', market_type: '' }, makeResult(1, 1))).toBe(true);
    });

    test('draw does not win when scores differ', () => {
      expect(didSelectionWin({ selection_name: 'Draw', market_type: '' }, makeResult(2, 1))).toBe(false);
    });
  });

  describe('Both Teams to Score (BTTS)', () => {
    test('BTTS Yes wins when both teams scored', () => {
      expect(didSelectionWin({ selection_name: 'Yes', market_type: 'btts' }, makeResult(1, 1))).toBe(true);
    });

    test('BTTS Yes loses when only one team scored', () => {
      expect(didSelectionWin({ selection_name: 'Yes', market_type: 'btts' }, makeResult(1, 0))).toBe(false);
    });

    test('BTTS Yes loses on 0-0', () => {
      expect(didSelectionWin({ selection_name: 'Yes', market_type: 'btts' }, makeResult(0, 0))).toBe(false);
    });

    test('BTTS No wins when one team did not score', () => {
      expect(didSelectionWin({ selection_name: 'No', market_type: 'btts' }, makeResult(1, 0))).toBe(true);
    });

    test('BTTS No loses when both scored', () => {
      expect(didSelectionWin({ selection_name: 'No', market_type: 'btts' }, makeResult(2, 1))).toBe(false);
    });

    test('also works with "both_teams_to_score" market type', () => {
      expect(didSelectionWin({ selection_name: 'Yes', market_type: 'both_teams_to_score' }, makeResult(3, 2))).toBe(true);
    });
  });

  describe('Correct Score', () => {
    test('correct score matches', () => {
      expect(didSelectionWin({ selection_name: '2-1', market_type: 'correct_score' }, makeResult(2, 1))).toBe(true);
    });

    test('correct score does not match', () => {
      expect(didSelectionWin({ selection_name: '1-0', market_type: 'correct_score' }, makeResult(2, 1))).toBe(false);
    });

    test('0-0 correct score', () => {
      expect(didSelectionWin({ selection_name: '0-0', market_type: 'correct_score' }, makeResult(0, 0))).toBe(true);
    });

    test('works with "correct score" (space) market type', () => {
      expect(didSelectionWin({ selection_name: '3-1', market_type: 'correct score' }, makeResult(3, 1))).toBe(true);
    });
  });

  describe('Unknown / edge cases', () => {
    test('unknown market returns null', () => {
      expect(didSelectionWin({ selection_name: 'something_weird', market_type: 'exotic_market' }, makeResult(1, 0))).toBeNull();
    });

    test('case-insensitive selection names', () => {
      expect(didSelectionWin({ selection_name: 'HOME', market_type: '' }, makeResult(2, 0))).toBe(true);
      expect(didSelectionWin({ selection_name: 'away', market_type: '' }, makeResult(0, 1))).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// settleAsianHandicap
// ---------------------------------------------------------------------------
describe('settleAsianHandicap', () => {
  test('whole line - win (home -1, score 2-0)', () => {
    const result = settleAsianHandicap({ selection_name: 'Home' }, makeResult(2, 0), -1, 100, 1.9);
    expect(result.status).toBe('won');
    expect(result.payout).toBe(190);
  });

  test('whole line - loss (home -1, score 0-1)', () => {
    const result = settleAsianHandicap({ selection_name: 'Home' }, makeResult(0, 1), -1, 100, 1.9);
    expect(result.status).toBe('lost');
    expect(result.payout).toBe(0);
  });

  test('whole line - push/void (home -1, score 1-0)', () => {
    const result = settleAsianHandicap({ selection_name: 'Home' }, makeResult(1, 0), -1, 100, 1.9);
    expect(result.status).toBe('void');
    expect(result.payout).toBe(100);
  });

  test('half line - no push possible, win (home -0.5, score 1-0)', () => {
    const result = settleAsianHandicap({ selection_name: 'Home' }, makeResult(1, 0), -0.5, 100, 1.9);
    expect(result.status).toBe('won');
    expect(result.payout).toBe(190);
  });

  test('half line - loss (home -0.5, score 0-0)', () => {
    const result = settleAsianHandicap({ selection_name: 'Home' }, makeResult(0, 0), -0.5, 100, 1.9);
    expect(result.status).toBe('lost');
    expect(result.payout).toBe(0);
  });

  test('quarter line - split result (home -0.75, score 1-0)', () => {
    const result = settleAsianHandicap({ selection_name: 'Home' }, makeResult(1, 0), -0.75, 100, 1.9);
    // goalDiff=1, lowerLine=-1, upperLine=-0.5
    // lower half: adj=1+(-1)=0 -> push -> 50
    // upper half: adj=1+(-0.5)=0.5 -> win -> 50*1.9=95
    // total = 145
    expect(result.payout).toBe(145);
    expect(result.status).toBe('half_won');
  });

  test('quarter line - full loss (home -0.75, score 0-1)', () => {
    const result = settleAsianHandicap({ selection_name: 'Home' }, makeResult(0, 1), -0.75, 100, 1.9);
    expect(result.status).toBe('lost');
    expect(result.payout).toBe(0);
  });

  test('away selection flips goal difference', () => {
    // Away -1 with score 0-2 => away goalDiff = 2, adjusted = 2 + (-1) = 1 > 0 => won
    const result = settleAsianHandicap({ selection_name: 'Away' }, makeResult(0, 2), -1, 100, 1.9);
    expect(result.status).toBe('won');
    expect(result.payout).toBe(190);
  });

  test('positive handicap - win (home +1, score 0-0)', () => {
    // goalDiff=0, adjusted=0+1=1 > 0 => won
    const result = settleAsianHandicap({ selection_name: 'Home' }, makeResult(0, 0), 1, 100, 1.9);
    expect(result.status).toBe('won');
    expect(result.payout).toBe(190);
  });
});

// ---------------------------------------------------------------------------
// settleOverUnder
// ---------------------------------------------------------------------------
describe('settleOverUnder', () => {
  test('over 2.5 - win (3 goals)', () => {
    const result = settleOverUnder({ selection_name: 'Over 2.5' }, makeResult(2, 1), 2.5, 100, 1.9);
    expect(result.status).toBe('won');
    expect(result.payout).toBe(190);
  });

  test('over 2.5 - loss (2 goals)', () => {
    const result = settleOverUnder({ selection_name: 'Over 2.5' }, makeResult(1, 1), 2.5, 100, 1.9);
    expect(result.status).toBe('lost');
    expect(result.payout).toBe(0);
  });

  test('under 2.5 - win (1 goal)', () => {
    const result = settleOverUnder({ selection_name: 'Under 2.5' }, makeResult(1, 0), 2.5, 100, 1.9);
    expect(result.status).toBe('won');
    expect(result.payout).toBe(190);
  });

  test('under 2.5 - loss (3 goals)', () => {
    const result = settleOverUnder({ selection_name: 'Under 2.5' }, makeResult(2, 1), 2.5, 100, 1.9);
    expect(result.status).toBe('lost');
    expect(result.payout).toBe(0);
  });

  test('push/void on exact whole line - over 2 with 2 goals', () => {
    const result = settleOverUnder({ selection_name: 'Over 2' }, makeResult(1, 1), 2, 100, 1.9);
    expect(result.status).toBe('void');
    expect(result.payout).toBe(100);
  });

  test('push/void on exact whole line - under 2 with 2 goals', () => {
    const result = settleOverUnder({ selection_name: 'Under 2' }, makeResult(1, 1), 2, 100, 1.9);
    expect(result.status).toBe('void');
    expect(result.payout).toBe(100);
  });

  test('over 2 - win (3 goals)', () => {
    const result = settleOverUnder({ selection_name: 'Over 2' }, makeResult(2, 1), 2, 100, 1.9);
    expect(result.status).toBe('won');
    expect(result.payout).toBe(190);
  });

  test('under 2 - win (1 goal)', () => {
    const result = settleOverUnder({ selection_name: 'Under 2' }, makeResult(1, 0), 2, 100, 1.9);
    expect(result.status).toBe('won');
    expect(result.payout).toBe(190);
  });
});
