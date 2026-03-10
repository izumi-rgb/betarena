'use client';

import React, { useMemo } from 'react';
import { SportSidebar, TopHeader } from '@/components/app/SportSidebar';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { useAuthStore } from '@/stores/authStore';
import { usePlaceBet } from '@/hooks/usePlaceBet';
import { formatCurrency } from '@/lib/format';

function DesktopBetSlip() {
  const picks = useBetSlipStore((s) => s.picks);
  const removePick = useBetSlipStore((s) => s.removePick);
  const clearPicks = useBetSlipStore((s) => s.clearPicks);
  const stake = useBetSlipStore((s) => s.stake);
  const setStake = useBetSlipStore((s) => s.setStake);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { placeBet, isPlacing, balance } = usePlaceBet();

  const totalOdds = useMemo(() => picks.reduce((acc, p) => acc * p.odds, 1), [picks]);
  const potential = (Number(stake) || 0) * (picks.length ? totalOdds : 0);
  const enoughBalance = (balance ?? 0) >= (Number(stake) || 0);

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-[#1E293B] bg-[#111827] md:flex">
      <div className="flex h-14 items-center justify-between border-b border-[#1E293B] px-4">
        <h3 className="font-bold text-white">Bet Slip</h3>
        {picks.length > 0 && (
          <button onClick={clearPicks} className="text-xs text-[#94A3B8] hover:text-[#EF4444]">Clear all</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {picks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#1E293B] p-6 text-center text-sm text-[#64748B]">
            Select odds to add picks
          </div>
        ) : picks.map((p) => (
          <div key={p.id} className="rounded-lg border border-[#1E293B] bg-[#1A2235] p-3">
            <div className="text-xs text-[#94A3B8]">{p.market}</div>
            <div className="mt-1 text-sm font-semibold text-white">{p.selection}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-sm text-[#F59E0B]">{p.odds.toFixed(2)}</span>
              <button onClick={() => removePick(p.id)} className="text-xs text-[#EF4444] hover:underline">Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#1E293B] p-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs text-[#94A3B8]">Stake</label>
          <input
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="w-full rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-2 font-mono text-white"
          />
        </div>
        {isAuthenticated && (
          <div className="space-y-1 text-xs text-[#94A3B8]">
            <div className="flex justify-between"><span>Balance</span><span className="font-mono text-white">{formatCurrency(balance ?? 0)}</span></div>
            <div className="flex justify-between"><span>Total Odds</span><span className="font-mono text-white">{picks.length ? totalOdds.toFixed(2) : '0.00'}</span></div>
            <div className="flex justify-between"><span>Potential Return</span><span className="font-mono text-[#00C37B]">{potential.toFixed(2)}</span></div>
          </div>
        )}
        <button
          disabled={isPlacing || picks.length === 0 || (isAuthenticated && !enoughBalance)}
          onClick={placeBet}
          className="w-full rounded-lg bg-[#00C37B] py-2.5 text-sm font-bold text-[#0B0E1A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPlacing ? 'Placing Bet...' : picks.length > 0 ? `Place Bet (${picks.length})` : 'Place Bet'}
        </button>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Desktop layout: sidebar + top header + content + bet slip */}
      <div className="hidden md:flex md:h-screen md:overflow-hidden bg-[#0B0E1A] text-[#F1F5F9]">
        <SportSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopHeader />
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
            <DesktopBetSlip />
          </div>
        </div>
      </div>

      {/* Mobile layout: just render children, MemberGlobalChrome handles nav */}
      <div className="md:hidden">
        {children}
      </div>
    </>
  );
}
