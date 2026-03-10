'use client';

export type BetSelectionItem = {
  event_id?: number;
  market_type?: string;
  selection_name?: string;
  odds_at_placement?: number;
  odds?: number;
};

export type UserBet = {
  id: number;
  bet_uid: string;
  type: string;
  status: string;
  stake: number | string;
  potential_win: number | string;
  actual_win?: number | string;
  created_at: string;
  selections: string | BetSelectionItem[];
  cashout_offer?: number;
  cashout_available?: boolean;
};

import { formatCurrency } from '@/lib/format';

function parseNumber(value: number | string | undefined): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrencyValue(value: number | string | undefined): string {
  return formatCurrency(parseNumber(value));
}

function normalizeSelections(rawSelections: UserBet['selections']): BetSelectionItem[] {
  if (!rawSelections) {
    return [];
  }
  if (typeof rawSelections === 'string') {
    try {
      const parsed = JSON.parse(rawSelections);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(rawSelections) ? rawSelections : [];
}

export function BetCard({
  bet,
  onCashout,
}: {
  bet: UserBet;
  onCashout: (bet: UserBet) => void;
}) {
  const selections = normalizeSelections(bet.selections);

  return (
    <article className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs text-[#94A3B8]">{bet.bet_uid}</div>
          <h3 className="text-sm font-bold text-white">{bet.type.toUpperCase()} Bet</h3>
        </div>
        <span className="rounded bg-[#0B0E1A] px-2 py-1 text-xs uppercase tracking-wide text-[#94A3B8]">{bet.status}</span>
      </div>

      <div className="mt-3 space-y-2">
        {selections.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">No selection details available.</p>
        ) : selections.map((selection, index) => (
          <div key={`${bet.bet_uid}-${index}`} className="rounded-lg border border-[#1E293B] bg-[#111827] px-3 py-2">
            <div className="text-xs uppercase text-[#64748B]">{selection.market_type || 'market'}</div>
            <div className="text-sm text-white">{selection.selection_name || 'Selection'}</div>
            <div className="font-mono text-xs text-[#F59E0B]">{(selection.odds_at_placement || selection.odds || 0).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-[#1E293B] bg-[#111827] p-3 text-xs">
        <div className="text-[#94A3B8]">
          Stake
          <div className="mt-1 font-mono text-sm text-white">{formatCurrencyValue(bet.stake)}</div>
        </div>
        <div className="text-[#94A3B8]">
          Potential Payout
          <div className="mt-1 font-mono text-sm text-[#00C37B]">{formatCurrencyValue(bet.potential_win)}</div>
        </div>
        <div className="text-[#94A3B8]">
          Placed
          <div className="mt-1 text-sm text-white">{new Date(bet.created_at).toLocaleString()}</div>
        </div>
        <div className="text-[#94A3B8]">
          Current Return
          <div className="mt-1 font-mono text-sm text-white">{formatCurrencyValue(bet.actual_win)}</div>
        </div>
      </div>

      {bet.status === 'open' && bet.cashout_available ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-xs text-[#94A3B8]">
            Cashout Offer
            <div className="mt-1 font-mono text-sm text-[#00C37B]">{formatCurrencyValue(bet.cashout_offer)}</div>
          </div>
          <button
            onClick={() => onCashout(bet)}
            className="rounded-lg bg-[#00C37B] px-3 py-2 text-sm font-bold text-[#0B0E1A]"
          >
            Cashout
          </button>
        </div>
      ) : null}
    </article>
  );
}
