'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { LiveMatchCard } from '@/components/live/LiveMatchCard';

export function LiveEventsPage() {
  const [sportFilter, setSportFilter] = useState<string>('all');
  const { data, isLoading, error } = useLiveEvents();

  const sports = useMemo(() => {
    const set = new Set<string>();
    (data || []).forEach((event) => {
      if (event.sport) {
        set.add(String(event.sport).toLowerCase());
      }
    });
    return ['all', ...Array.from(set)];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (sportFilter === 'all') return data;
    return data.filter((event) => String(event.sport || '').toLowerCase() === sportFilter);
  }, [data, sportFilter]);

  return (
    <main className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 rounded-xl border border-[#1E293B] bg-[#111827] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">In-Play</h1>
              <p className="text-sm text-[#94A3B8]">Live matches updating in real time.</p>
            </div>
            <Link href="/sports" className="rounded border border-[#1E293B] px-3 py-2 text-sm text-[#CBD5E1] hover:border-[#00C37B]">
              Browse Sports
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  sportFilter === sport
                    ? 'bg-[#00C37B] text-[#0B0E1A]'
                    : 'bg-[#1A2235] text-[#94A3B8] hover:text-white'
                }`}
              >
                {sport === 'all' ? 'All Sports' : sport}
              </button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 text-[#94A3B8]">Loading live events...</div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">
            Failed to load live events.
          </div>
        ) : null}

        {!isLoading && !error && filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1E293B] bg-[#111827] p-8 text-center text-[#94A3B8]">
            No live matches found for this filter.
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((event) => (
            <LiveMatchCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </main>
  );
}
