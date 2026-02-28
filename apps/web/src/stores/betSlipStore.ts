'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BetSlipPick {
  id: string;
  market: string;
  selection: string;
  odds: number;
}

interface BetSlipState {
  picks: BetSlipPick[];
  isOpenMobile: boolean;
  togglePick: (pick: BetSlipPick) => void;
  removePick: (id: string) => void;
  clearPicks: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

export const useBetSlipStore = create<BetSlipState>()(
  persist(
    (set) => ({
      picks: [],
      isOpenMobile: false,
      togglePick: (pick) => set((state) => ({
        picks: state.picks.some((p) => p.id === pick.id)
          ? state.picks.filter((p) => p.id !== pick.id)
          : [...state.picks, pick],
      })),
      removePick: (id) => set((state) => ({ picks: state.picks.filter((p) => p.id !== id) })),
      clearPicks: () => set({ picks: [] }),
      openMobile: () => set({ isOpenMobile: true }),
      closeMobile: () => set({ isOpenMobile: false }),
    }),
    {
      name: 'betarena-betslip-v1',
      partialize: (state) => ({ picks: state.picks }),
    },
  ),
);
