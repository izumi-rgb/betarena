import { describe, it, expect, beforeEach } from 'vitest';
import { useBetSlipStore } from '@/stores/betSlipStore';
import type { BetSlipPick } from '@/stores/betSlipStore';

const mockPick: BetSlipPick = {
  id: 'test-1',
  eventId: 100,
  market: 'Match Result',
  marketType: 'match_result',
  selection: 'Arsenal',
  odds: 2.5,
};

const mockPick2: BetSlipPick = {
  id: 'test-2',
  eventId: 101,
  market: 'Over/Under',
  marketType: 'over_under',
  selection: 'Over 2.5',
  odds: 1.85,
};

describe('betSlipStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useBetSlipStore.setState({ picks: [], isOpenMobile: false });
  });

  it('starts with empty picks', () => {
    const { picks } = useBetSlipStore.getState();
    expect(picks).toEqual([]);
  });

  it('togglePick adds a new pick', () => {
    useBetSlipStore.getState().togglePick(mockPick);
    const { picks } = useBetSlipStore.getState();
    expect(picks).toHaveLength(1);
    expect(picks[0].id).toBe('test-1');
    expect(picks[0].selection).toBe('Arsenal');
  });

  it('togglePick removes existing pick', () => {
    useBetSlipStore.getState().togglePick(mockPick);
    useBetSlipStore.getState().togglePick(mockPick);
    const { picks } = useBetSlipStore.getState();
    expect(picks).toHaveLength(0);
  });

  it('removePick removes specific pick by id', () => {
    useBetSlipStore.getState().togglePick(mockPick);
    useBetSlipStore.getState().togglePick(mockPick2);
    useBetSlipStore.getState().removePick('test-1');
    const { picks } = useBetSlipStore.getState();
    expect(picks).toHaveLength(1);
    expect(picks[0].id).toBe('test-2');
  });

  it('clearPicks removes all picks', () => {
    useBetSlipStore.getState().togglePick(mockPick);
    useBetSlipStore.getState().togglePick(mockPick2);
    useBetSlipStore.getState().clearPicks();
    const { picks } = useBetSlipStore.getState();
    expect(picks).toHaveLength(0);
  });

  it('multiple picks accumulate', () => {
    useBetSlipStore.getState().togglePick(mockPick);
    useBetSlipStore.getState().togglePick(mockPick2);
    const { picks } = useBetSlipStore.getState();
    expect(picks).toHaveLength(2);
  });

  it('openMobile and closeMobile toggle state', () => {
    expect(useBetSlipStore.getState().isOpenMobile).toBe(false);
    useBetSlipStore.getState().openMobile();
    expect(useBetSlipStore.getState().isOpenMobile).toBe(true);
    useBetSlipStore.getState().closeMobile();
    expect(useBetSlipStore.getState().isOpenMobile).toBe(false);
  });
});
