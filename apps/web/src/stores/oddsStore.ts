"use client";

import { create } from "zustand";

// ── Types ─────────────────────────────────────────────────────────
export type OddsFormat = "decimal" | "fractional" | "american";

export interface OddsData {
  [market: string]: Record<string, number>;
}

interface OddsState {
  oddsFormat: OddsFormat;
  liveOdds: Map<string, OddsData>;
}

interface OddsActions {
  setOddsFormat: (format: OddsFormat) => void;
  updateOdds: (eventId: string, odds: OddsData) => void;
  convertOdds: (decimal: number, format?: OddsFormat) => string;
}

// ── Conversion helpers ────────────────────────────────────────────
function gcd(a: number, b: number): number {
  a = Math.round(a);
  b = Math.round(b);
  return b === 0 ? a : gcd(b, a % b);
}

function decimalToFractional(decimal: number): string {
  if (decimal <= 1) return "0/1";
  const numerator = Math.round((decimal - 1) * 100);
  const denominator = 100;
  const d = gcd(numerator, denominator);
  return `${numerator / d}/${denominator / d}`;
}

function decimalToAmerican(decimal: number): string {
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  }
  return `${Math.round(-100 / (decimal - 1))}`;
}

// ── Store ─────────────────────────────────────────────────────────
export const useOddsStore = create<OddsState & OddsActions>((set, get) => ({
  oddsFormat: "decimal",
  liveOdds: new Map(),

  setOddsFormat: (oddsFormat) => set({ oddsFormat }),

  updateOdds: (eventId, odds) =>
    set((state) => {
      const next = new Map(state.liveOdds);
      next.set(eventId, odds);
      return { liveOdds: next };
    }),

  convertOdds: (decimal, format) => {
    const fmt = format ?? get().oddsFormat;
    switch (fmt) {
      case "decimal":
        return decimal.toFixed(2);
      case "fractional":
        return decimalToFractional(decimal);
      case "american":
        return decimalToAmerican(decimal);
      default:
        return decimal.toFixed(2);
    }
  },
}));
