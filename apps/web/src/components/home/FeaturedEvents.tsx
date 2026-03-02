'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useBetSlipStore } from '@/stores/betSlipStore';

type Selection = {
  id: string;
  name: string;
  odds: number;
};

type Market = {
  id: string;
  name: string;
  type: string;
  selections: Selection[];
};

export type HomeEvent = {
  id: number;
  sport?: string;
  league?: string;
  status?: string;
  startTime?: string;
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
  markets?: Market[];
};

function resolveEventHref(event: HomeEvent): string {
  const sport = String(event.sport || '').toLowerCase().trim();
  if (['tennis', 'basketball', 'golf', 'esports', 'cricket', 'football', 'horse-racing'].includes(sport)) {
    return `/sports/${sport}/${event.id}`;
  }
  return '/sports';
}

export function FeaturedEvents({ events }: { events: HomeEvent[] }) {
  const togglePick = useBetSlipStore((state) => state.togglePick);
  const picks = useBetSlipStore((state) => state.picks);

  const quickEvents = useMemo(() => events.slice(0, 6), [events]);

  return (
    <section className="rounded-xl border border-[#1E293B] bg-[#111827] p-4">
      <h2 className="text-lg font-bold text-white">Featured Events</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {quickEvents.map((event) => {
          const markets = event.markets || [];
          const primary = markets[0];
          const selections = (primary?.selections || []).slice(0, 3);

          return (
            <article key={event.id} className="rounded-lg border border-[#1E293B] bg-[#1A2235] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-[#64748B]">{event.sport || 'Sport'}</span>
                <span className="text-xs text-[#94A3B8]">{event.league || 'League'}</span>
              </div>
              <Link href={resolveEventHref(event)} className="mt-2 block text-sm font-semibold text-white hover:text-[#00C37B]">
                {event.homeTeam?.name || 'Home'} vs {event.awayTeam?.name || 'Away'}
              </Link>
              <div className="mt-1 text-xs text-[#94A3B8]">
                {event.startTime ? new Date(event.startTime).toLocaleString() : 'Starts soon'}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {selections.length === 0 ? (
                  <div className="col-span-3 rounded border border-dashed border-[#1E293B] px-2 py-2 text-center text-xs text-[#64748B]">
                    Odds unavailable
                  </div>
                ) : selections.map((selection) => {
                  const pickId = `${event.id}-${primary?.type || primary?.id}-${selection.id}`;
                  const isActive = picks.some((pick) => pick.id === pickId);
                  return (
                    <button
                      key={selection.id}
                      onClick={() => togglePick({
                        id: pickId,
                        eventId: event.id,
                        market: primary?.name || 'Market',
                        marketType: primary?.type || primary?.id || 'market',
                        selection: selection.name,
                        odds: selection.odds,
                      })}
                      className={`rounded border px-2 py-2 text-center ${
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
        })}
      </div>
    </section>
  );
}
