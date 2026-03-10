'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { LiveMatchCard } from '@/components/live/LiveMatchCard';

function SkeletonMatchCard() {
  return (
    <div className="animate-pulse rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="h-3 w-28 rounded bg-[#1E293B]" />
        <div className="h-5 w-12 rounded bg-[#1E293B]" />
      </div>
      <div className="h-5 w-2/3 rounded bg-[#1E293B]" />
      <div className="mt-1 h-4 w-16 rounded bg-[#1E293B]" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="h-12 rounded bg-[#1E293B]" />
        <div className="h-12 rounded bg-[#1E293B]" />
        <div className="h-12 rounded bg-[#1E293B]" />
      </div>
    </div>
  );
}

export function LiveEventsPage() {
  const [sportFilter, setSportFilter] = useState<string>('all');
  const { data, isLoading, error } = useLiveEvents();

  const sports = useMemo(() => {
    const countMap = new Map<string, number>();
    (data || []).forEach((event) => {
      if (event.sport) {
        const key = String(event.sport).toLowerCase();
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    });
    const entries: { key: string; label: string; count: number }[] = [
      { key: 'all', label: 'All Sports', count: data?.length || 0 },
    ];
    countMap.forEach((count, key) => {
      entries.push({ key, label: key.charAt(0).toUpperCase() + key.slice(1), count });
    });
    return entries;
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
                key={sport.key}
                onClick={() => setSportFilter(sport.key)}
                className={`rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 ${
                  sportFilter === sport.key
                    ? 'bg-[#00C37B] text-[#0B0E1A]'
                    : 'bg-[#1A2235] text-[#94A3B8] hover:text-white'
                }`}
              >
                {sport.label}
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 min-w-[20px] text-[10px] font-bold ${
                  sportFilter === sport.key
                    ? 'bg-[#0B0E1A]/20 text-[#0B0E1A]'
                    : 'bg-[#0B0E1A] text-[#94A3B8]'
                }`}>
                  {sport.count}
                </span>
              </button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <SkeletonMatchCard />
            <SkeletonMatchCard />
            <SkeletonMatchCard />
            <SkeletonMatchCard />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">
            Failed to load live events.
          </div>
        ) : null}

        {!isLoading && !error && filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1E293B] bg-[#111827] p-8 text-center text-[#94A3B8]">
            No live matches right now — check back soon
          </div>
        ) : null}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((event) => (
              <LiveMatchCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
