'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

type RaceEvent = {
  id: number;
  league?: string;
  status?: string;
  startTime?: string;
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
};

async function fetchRaceEvents(): Promise<RaceEvent[]> {
  const response = await apiGet<RaceEvent[]>('/api/sports/horse-racing/events');
  return response.data || [];
}

export default function HorseRacingPage() {
  const query = useQuery({
    queryKey: ['sports', 'horse-racing', 'events'],
    queryFn: fetchRaceEvents,
    refetchInterval: 30_000,
  });

  const events = query.data || [];

  return (
    <main className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 rounded-xl border border-[#1E293B] bg-[#111827] p-4">
          <h1 className="text-2xl font-bold">Horse Racing</h1>
          <p className="text-sm text-[#94A3B8]">Upcoming race meetings and race cards.</p>
        </header>

        {query.isLoading ? (
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 text-[#94A3B8]">Loading race meetings...</div>
        ) : null}

        {query.error ? (
          <div className="rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">Failed to load horse racing data.</div>
        ) : null}

        {!query.isLoading && !query.error && events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1E293B] bg-[#111827] p-8 text-center text-[#94A3B8]">
            Horse racing markets are coming soon for your region.
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {events.map((event) => (
            <Link key={event.id} href={`/sports/horse-racing/${event.id}`} className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4 hover:border-[#00C37B]/60">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>{event.league || 'Race Meeting'}</span>
                <span>{event.status || 'scheduled'}</span>
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                {event.homeTeam?.name || 'Race'} {event.awayTeam?.name ? `· ${event.awayTeam.name}` : ''}
              </div>
              <div className="mt-1 text-xs text-[#94A3B8]">{event.startTime ? new Date(event.startTime).toLocaleString() : 'Starts soon'}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
