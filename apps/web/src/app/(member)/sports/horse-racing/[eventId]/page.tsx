'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { BalanceBadge } from '@/components/app/BalanceBadge';

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

type EventMarketsResponse = {
  event: {
    id: number;
    league?: string;
    status?: string;
    startTime?: string;
    homeTeam?: { name?: string };
    awayTeam?: { name?: string };
  };
  markets: Market[];
};

async function fetchRaceCard(eventId: string): Promise<EventMarketsResponse> {
  const response = await apiGet<EventMarketsResponse>(`/api/sports/events/${eventId}/markets`);
  return response.data;
}

export default function HorseRacingEventPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = String(params?.eventId || '');
  const togglePick = useBetSlipStore((state) => state.togglePick);
  const picks = useBetSlipStore((state) => state.picks);

  const query = useQuery({
    queryKey: ['sports', 'horse-racing', 'event', eventId],
    queryFn: () => fetchRaceCard(eventId),
    enabled: Boolean(eventId),
    refetchInterval: 15_000,
  });

  const event = query.data?.event;
  const markets = query.data?.markets || [];

  return (
    <main className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/sports/horse-racing" className="rounded border border-[#1E293B] px-3 py-2 text-sm text-[#CBD5E1] hover:border-[#00C37B]">
            Back to Horse Racing
          </Link>
          <BalanceBadge />
        </div>

        {query.isLoading ? (
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 text-[#94A3B8]">Loading race card...</div>
        ) : null}

        {query.error ? (
          <div className="rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">Failed to load race card.</div>
        ) : null}

        {event ? (
          <header className="mb-4 rounded-xl border border-[#1E293B] bg-[#111827] p-4">
            <div className="text-xs uppercase tracking-wide text-[#64748B]">{event.league || 'Horse Racing'} · {event.status || 'scheduled'}</div>
            <h1 className="mt-1 text-2xl font-bold text-white">
              {event.homeTeam?.name || 'Race Card'} {event.awayTeam?.name ? `· ${event.awayTeam.name}` : ''}
            </h1>
          </header>
        ) : null}

        {markets.length === 0 && !query.isLoading ? (
          <div className="rounded-xl border border-dashed border-[#1E293B] bg-[#111827] p-8 text-center text-[#94A3B8]">
            Race card details are coming soon.
          </div>
        ) : null}

        <div className="space-y-3">
          {markets.map((market) => (
            <section key={market.id} className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
              <h2 className="text-sm font-bold text-white">{market.name}</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(market.selections || []).map((selection) => {
                  const pickId = `${eventId}-${market.type || market.id}-${selection.id}`;
                  const isActive = picks.some((pick) => pick.id === pickId);
                  return (
                    <button
                      key={selection.id}
                      onClick={() => togglePick({
                        id: pickId,
                        eventId: Number(eventId),
                        market: market.name,
                        marketType: market.type || market.id || 'market',
                        selection: selection.name,
                        odds: selection.odds,
                      })}
                      className={`rounded-lg border px-3 py-2 text-left ${
                        isActive
                          ? 'border-[#00C37B] bg-[#00C37B]/15 text-[#00C37B]'
                          : 'border-[#1E293B] bg-[#0B0E1A] text-white hover:border-[#00C37B]/60'
                      }`}
                    >
                      <div className="text-xs text-[#94A3B8]">{selection.name}</div>
                      <div className="font-mono text-base font-bold text-[#F59E0B]">{selection.odds.toFixed(2)}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
