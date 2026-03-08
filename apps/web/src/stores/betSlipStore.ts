'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BetSlipPick {
  id: string;
  eventId: number | string;
  market: string;
  marketType: string;
  selection: string;
  odds: number;
}

interface BetSlipState {
  picks: BetSlipPick[];
  stake: string;
  isOpenMobile: boolean;
  togglePick: (pick: BetSlipPick) => void;
  removePick: (id: string) => void;
  clearPicks: () => void;
  setStake: (v: string) => void;
  openMobile: () => void;
  closeMobile: () => void;
}

export const useBetSlipStore = create<BetSlipState>()(
  persist(
    (set) => ({
      picks: [],
      stake: '10',
      isOpenMobile: false,
      togglePick: (pick) =>
        set((state) => {
          const exists = state.picks.some((p) => p.id === pick.id);
          const nextPicks = exists
            ? state.picks.filter((p) => p.id !== pick.id)
            : [...state.picks, pick];
          return {
            picks: nextPicks,
            stake: nextPicks.length === 0 ? '0' : state.stake,
          };
        }),
      removePick: (id) =>
        set((state) => {
          const nextPicks = state.picks.filter((p) => p.id !== id);
          return {
            picks: nextPicks,
            stake: nextPicks.length === 0 ? '0' : state.stake,
          };
        }),
      clearPicks: () => set({ picks: [], stake: '0' }),
      setStake: (v) => set({ stake: v }),
      openMobile: () => set({ isOpenMobile: true }),
      closeMobile: () => set({ isOpenMobile: false }),
    }),
    {
      name: 'betarena-betslip-v2',
      partialize: (state) => ({ picks: state.picks, stake: state.stake }),
    },
  ),
);
