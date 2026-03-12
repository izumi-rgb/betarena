'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
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

type EsportsEvent = {
  id: number;
  league?: string;
  status?: string;
  startTime?: string;
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
  markets?: Market[];
  gameTag?: string;
};

async function fetchEsportsEvents(): Promise<EsportsEvent[]> {
  const response = await apiGet<EsportsEvent[]>('/api/sports/esports/events');
  return response.data || [];
}

export default function EsportsPage() {
  const togglePick = useBetSlipStore((state) => state.togglePick);
  const picks = useBetSlipStore((state) => state.picks);
  const query = useQuery({
    queryKey: ['sports', 'esports', 'events'],
    queryFn: fetchEsportsEvents,
    refetchInterval: 20_000,
  });

  return (
    <main className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 rounded-xl border border-[#1E293B] bg-[#111827] p-4">
          <h1 className="text-2xl font-bold">Esports</h1>
          <p className="text-sm text-[#94A3B8]">Browse live and upcoming esports matches.</p>
        </header>

        {query.isLoading ? (
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 text-[#94A3B8]">Loading esports events...</div>
        ) : null}

        {query.error ? (
          <div className="rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">
            Failed to load esports events.
            <button onClick={() => query.refetch()} className="ml-3 text-[#00C37B] hover:underline">Retry</button>
          </div>
        ) : null}

        {!query.isLoading && !query.error && (query.data || []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1E293B] bg-[#111827] p-8 text-center text-[#94A3B8]">
            No esports events available right now. Check back soon.
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {(query.data || []).map((event) => {
            const market = event.markets?.[0];
            const selections = market?.selections?.slice(0, 3) || [];
            return (
              <article key={event.id} className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>{event.league || 'Esports'}</span>
                  <div className="flex items-center gap-2">
                    {event.gameTag && <span className="rounded bg-[#111827] px-1.5 py-0.5 text-[10px] font-semibold text-[#00C37B]">{event.gameTag}</span>}
                    <span>{event.status || 'scheduled'}</span>
                  </div>
                </div>
                <Link href={`/sports/esports/${event.id}`} className="mt-2 block text-sm font-semibold text-white hover:text-[#00C37B]">
                  {event.homeTeam?.name || 'Team 1'} vs {event.awayTeam?.name || 'Team 2'}
                </Link>
                <div className="mt-1 text-xs text-[#94A3B8]">{event.startTime ? new Date(event.startTime).toLocaleString() : 'Starts soon'}</div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {selections.length === 0 ? (
                    <div className="col-span-3 rounded border border-dashed border-[#1E293B] px-2 py-2 text-center text-xs text-[#64748B]">Odds unavailable</div>
                  ) : selections.map((selection) => {
                    const pickId = `${event.id}-${market?.type || market?.id}-${selection.id}`;
                    const isActive = picks.some((pick) => pick.id === pickId);
                    return (
                      <button
                        key={selection.id}
                        onClick={() => togglePick({
                          id: pickId,
                          eventId: event.id,
                          market: market?.name || 'Market',
                          marketType: market?.type || market?.id || 'market',
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
          })}
        </div>
      </div>
    </main>
  );
}
