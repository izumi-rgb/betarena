'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { useAuthStore } from '@/stores/authStore';
import { apiPost } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

function cx(...vals: Array<string | false | null | undefined>) {
  return vals.filter(Boolean).join(' ');
}

export function MemberGlobalChrome() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const picks = useBetSlipStore((s) => s.picks);
  const removePick = useBetSlipStore((s) => s.removePick);
  const isOpenMobile = useBetSlipStore((s) => s.isOpenMobile);
  const openMobile = useBetSlipStore((s) => s.openMobile);
  const closeMobile = useBetSlipStore((s) => s.closeMobile);
  const [stake, setStake] = useState('10');
  const [isPlacing, setIsPlacing] = useState(false);
  const clearPicks = useBetSlipStore((s) => s.clearPicks);

  const isMemberRoute = pathname?.startsWith('/sports') || pathname?.startsWith('/results') || pathname?.startsWith('/my-bets') || pathname?.startsWith('/account') || pathname === '/in-play' || pathname === '/live';

  const totalOdds = useMemo(() => picks.reduce((acc, p) => acc * p.odds, 1), [picks]);
  const potential = (Number(stake) || 0) * (picks.length ? totalOdds : 0);
  const triggerLoginForProtectedAction = () => {
    if (isAuthenticated) return false;
    const next = encodeURIComponent(pathname || '/sports');
    router.push(`/login?next=${next}`);
    return true;
  };

  if (!isMemberRoute) return null;

  return (
    <>
      <aside className="pointer-events-auto fixed right-0 top-0 z-40 hidden h-screen w-[320px] border-l border-[#1E293B] bg-[#111827]/95 p-4 backdrop-blur md:block">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Bet Slip</h3>
          <span className="rounded bg-[#1A2235] px-2 py-1 text-xs text-[#94A3B8]">{picks.length} picks</span>
        </div>
        <div className="space-y-2 overflow-y-auto pb-40">
          {picks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#1E293B] p-4 text-center text-sm text-[#64748B]">Select odds to add bet picks</div>
          ) : picks.map((p) => (
            <div key={p.id} className="rounded-lg border border-[#1E293B] bg-[#1A2235] p-3">
              <div className="text-xs text-[#94A3B8]">{p.market}</div>
              <div className="mt-1 text-sm font-semibold text-white">{p.selection}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-sm text-[#F59E0B]">{p.odds.toFixed(2)}</span>
                <button onClick={() => removePick(p.id)} className="text-xs text-[#EF4444]">Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#1E293B] bg-[#111827] p-4">
          <label className="mb-1 block text-xs text-[#94A3B8]">Stake</label>
          <input value={stake} onChange={(e) => setStake(e.target.value)} className="w-full rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-2 font-mono text-white" />
          <div className="mt-2 flex items-center justify-between text-xs text-[#94A3B8]"><span>Total Odds</span><span className="font-mono text-white">{picks.length ? totalOdds.toFixed(2) : '0.00'}</span></div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#94A3B8]"><span>Potential Return</span><span className="font-mono text-[#00C37B]">{potential.toFixed(2)}</span></div>
          <button
            disabled={isPlacing || picks.length === 0}
            onClick={async () => {
              if (triggerLoginForProtectedAction()) return;
              if (picks.length === 0 || isPlacing) return;

              const stakeNum = Number(stake);
              if (!stakeNum || stakeNum <= 0) {
                toast({ title: 'Invalid stake', description: 'Please enter a valid stake amount.', variant: 'destructive' });
                return;
              }

              setIsPlacing(true);
              try {
                const betType = picks.length === 1 ? 'single' : 'accumulator';
                const selections = picks.map((p) => ({
                  event_id: p.eventId,
                  market_type: p.marketType,
                  selection_name: p.selection,
                  odds: p.odds,
                }));

                await apiPost('/api/bets', { type: betType, stake: stakeNum, selections });

                toast({ title: 'Bet Placed!', description: `Your ${betType} bet of ${stakeNum.toFixed(2)} has been placed.` });
                clearPicks();
                router.push('/my-bets');
              } catch (err: unknown) {
                const msg = (err as any)?.response?.data?.message || 'Failed to place bet';
                const friendly: Record<string, string> = {
                  INSUFFICIENT_BALANCE: 'Insufficient balance. Please add credits.',
                  INVALID_STAKE: 'Invalid stake amount.',
                  NO_SELECTIONS: 'No selections in your bet slip.',
                  SINGLE_BET_ONE_SELECTION: 'Single bet requires exactly one selection.',
                  ACCUMULATOR_MIN_TWO: 'Accumulator requires at least two selections.',
                };
                toast({ title: 'Bet Failed', description: friendly[msg] || msg, variant: 'destructive' });
              } finally {
                setIsPlacing(false);
              }
            }}
            className="mt-3 w-full rounded-lg bg-[#00C37B] py-2.5 text-sm font-bold text-[#0B0E1A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPlacing ? 'Placing Bet...' : `Place Bet${picks.length > 0 ? ` (${picks.length})` : ''}`}
          </button>
        </div>
      </aside>

      <div className="fixed bottom-16 right-4 z-50 md:hidden">
        <button onClick={openMobile} className="min-h-11 rounded-full bg-[#00C37B] px-4 py-2 text-sm font-bold text-[#0B0E1A]">Bet Slip ({picks.length})</button>
      </div>

      {isOpenMobile ? (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={closeMobile}>
          <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-[#1E293B] bg-[#111827] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-white">Bet Slip</h3><button onClick={closeMobile} className="text-[#94A3B8]">Close</button></div>
            <div className="space-y-2">
              {picks.map((p) => (
                <div key={p.id} className="rounded-lg border border-[#1E293B] bg-[#1A2235] p-3">
                  <div className="text-xs text-[#94A3B8]">{p.market}</div>
                  <div className="mt-1 text-sm font-semibold text-white">{p.selection}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1E293B] bg-[#111827] md:hidden">
        <div className="grid grid-cols-5 text-xs">
          {[
            { href: '/sports', label: 'Sports' },
            { href: '/in-play', label: 'In-Play' },
            { href: '/live', label: 'Live' },
            { href: '/my-bets', label: 'My Bets' },
            { href: '/account', label: 'Account' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className={cx('flex min-h-11 items-center justify-center px-2 py-3', pathname === item.href && 'text-[#00C37B]')}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="pointer-events-none fixed right-4 top-4 z-50 rounded-full bg-[#00C37B] px-3 py-1 text-xs font-bold text-[#0B0E1A] shadow md:right-[336px]">
        {picks.length} picks
      </div>
    </>
  );
}
