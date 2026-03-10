'use client';

import { useState } from 'react';
import type { UserBet } from '@/components/bets/BetCard';

function parseOffer(bet: UserBet): number {
  const offer = bet.cashout_offer ?? 0;
  const parsed = typeof offer === 'number' ? offer : Number.parseFloat(String(offer));
  return Number.isFinite(parsed) ? parsed : 0;
}

import { formatCurrency } from '@/lib/format';

export function CashoutModal({
  bet,
  isSubmitting,
  onClose,
  onSubmitFull,
  onSubmitPartial,
}: {
  bet: UserBet;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmitFull: () => Promise<void>;
  onSubmitPartial: (percent: number) => Promise<void>;
}) {
  const [percent, setPercent] = useState(50);
  const offer = parseOffer(bet);
  const partialAmount = (offer * percent) / 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#1E293B] bg-[#111827] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Cashout {bet.bet_uid}</h2>
          <button onClick={onClose} className="text-[#94A3B8]">Close</button>
        </div>

        <p className="mt-3 text-sm text-[#94A3B8]">
          Full cashout offer: <span className="font-mono text-[#00C37B]">{formatCurrency(offer)}</span>
        </p>

        <div className="mt-4 rounded-lg border border-[#1E293B] bg-[#1A2235] p-3">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Partial Cashout</span>
            <span>{percent}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={percent}
            onChange={(event) => setPercent(Number(event.target.value))}
            className="mt-2 w-full"
          />
          <div className="mt-2 text-sm text-white">
            Estimated payout: <span className="font-mono text-[#F59E0B]">{formatCurrency(partialAmount)}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            disabled={isSubmitting}
            onClick={() => void onSubmitFull()}
            className="rounded-lg bg-[#00C37B] px-3 py-2 text-sm font-bold text-[#0B0E1A] disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Full Cashout'}
          </button>
          <button
            disabled={isSubmitting}
            onClick={() => void onSubmitPartial(percent)}
            className="rounded-lg border border-[#F59E0B] px-3 py-2 text-sm font-bold text-[#F59E0B] disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Partial Cashout'}
          </button>
        </div>
      </div>
    </div>
  );
}
