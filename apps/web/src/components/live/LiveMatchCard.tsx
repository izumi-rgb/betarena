'use client';

import Link from 'next/link';
import { useBetSlipStore } from '@/stores/betSlipStore';
import type { LiveEvent } from '@/hooks/useLiveEvents';

function eventHref(event: LiveEvent): string {
  const sport = String(event.sport || '').toLowerCase().trim();
  if (['tennis', 'basketball', 'golf', 'esports', 'cricket', 'football', 'horse-racing', 'ice_hockey', 'baseball'].includes(sport)) {
    return `/sports/${sport}/${event.id}`;
  }
  return '/sports';
}

function statusBadge(status?: string) {
  switch (status) {
    case 'pre':
      return { label: 'UPCOMING', bg: 'bg-[#F59E0B]/20', text: 'text-[#F59E0B]' };
    case 'ht':
      return { label: 'HT', bg: 'bg-[#F59E0B]/20', text: 'text-[#F59E0B]' };
    case 'ft':
      return { label: 'FT', bg: 'bg-[#64748B]/20', text: 'text-[#94A3B8]' };
    default:
      return { label: 'LIVE', bg: 'bg-[#EF4444]/20', text: 'text-[#EF4444]' };
  }
}

export function LiveMatchCard({ event }: { event: LiveEvent }) {
  const togglePick = useBetSlipStore((state) => state.togglePick);
  const picks = useBetSlipStore((state) => state.picks);
  const primaryMarket = event.markets?.[0];
  const selections = primaryMarket?.selections?.slice(0, 3) || [];

  return (
    <article className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-[#64748B]">
          {event.sport || 'Sport'} · {event.league || 'League'}
        </div>
        <span className={`rounded ${statusBadge(event.status).bg} px-2 py-0.5 text-[10px] font-bold ${statusBadge(event.status).text}`}>
          {statusBadge(event.status).label}
        </span>
      </div>
      <Link href={eventHref(event)} className="text-sm font-semibold text-white hover:text-[#00C37B]">
        {event.homeTeam?.name || 'Home'} vs {event.awayTeam?.name || 'Away'}
      </Link>
      <div className="mt-1 text-sm text-[#94A3B8]">
        {Number(event.homeScore ?? 0)} - {Number(event.awayScore ?? 0)}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {selections.length === 0 ? (
          <div className="col-span-3 rounded border border-dashed border-[#1E293B] px-2 py-2 text-center text-xs text-[#64748B]">
            Odds unavailable
          </div>
        ) : selections.map((selection) => {
          const pickId = `${event.id}-${primaryMarket?.type || primaryMarket?.id}-${selection.id}`;
          const isActive = picks.some((pick) => pick.id === pickId);

          return (
            <button
              key={selection.id}
              onClick={() => togglePick({
                id: pickId,
                eventId: event.id,
                market: primaryMarket?.name || 'Market',
                marketType: primaryMarket?.type || primaryMarket?.id || 'market',
                selection: selection.name,
                odds: selection.odds,
              })}
              className={`rounded border px-2 py-2 ${
                isActive
                  ? 'border-[#00C37B] bg-[#00C37B]/15 text-[#00C37B]'
                  : 'border-[#1E293B] bg-[#0B0E1A] text-white hover:border-[#00C37B]/60'
              }`}
            >
              <div className="truncate text-[10px] uppercase tracking-wide text-[#94A3B8]">{selection.name}</div>
              <div className="font-mono text-sm font-bold text-[#F59E0B]">{selection.odds.toFixed(2)}</div>
            </button>
          );
        })}
      </div>
    </article>
  );
}
