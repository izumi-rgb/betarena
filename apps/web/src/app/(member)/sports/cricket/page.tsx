'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

type CricketEvent = {
  id: number;
  league?: string;
  status?: string;
  startTime?: string;
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
};

async function fetchCricketEvents(): Promise<CricketEvent[]> {
  const response = await apiGet<CricketEvent[]>('/api/sports/cricket/events');
  return response.data || [];
}

export default function CricketPage() {
  const query = useQuery({
    queryKey: ['sports', 'cricket', 'events'],
    queryFn: fetchCricketEvents,
    refetchInterval: 20_000,
  });

  return (
    <main className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 rounded-xl border border-[#1E293B] bg-[#111827] p-4">
          <h1 className="text-2xl font-bold">Cricket</h1>
          <p className="text-sm text-[#94A3B8]">Browse live and upcoming cricket fixtures.</p>
        </header>

        {query.isLoading ? (
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 text-[#94A3B8]">Loading cricket events...</div>
        ) : null}

        {query.error ? (
          <div className="rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">Failed to load cricket events.</div>
        ) : null}

        {!query.isLoading && !query.error && (query.data || []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1E293B] bg-[#111827] p-8 text-center text-[#94A3B8]">
            No cricket events available right now.
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {(query.data || []).map((event) => (
            <Link key={event.id} href={`/sports/cricket/${event.id}`} className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4 hover:border-[#00C37B]/60">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>{event.league || 'Cricket'}</span>
                <span>{event.status || 'scheduled'}</span>
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                {event.homeTeam?.name || 'Home'} vs {event.awayTeam?.name || 'Away'}
              </div>
              <div className="mt-1 text-xs text-[#94A3B8]">{event.startTime ? new Date(event.startTime).toLocaleString() : 'Starts soon'}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
