'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { FeaturedEvents, type HomeEvent } from '@/components/home/FeaturedEvents';
import { LiveNow } from '@/components/home/LiveNow';

type SportSummary = {
  name: string;
  slug: string;
  eventsCount: number;
};

type SportEventsResponse = HomeEvent[];

async function fetchSports(): Promise<SportSummary[]> {
  const response = await apiGet<SportSummary[]>('/api/sports');
  return response.data || [];
}

async function fetchLiveEvents(): Promise<HomeEvent[]> {
  const response = await apiGet<HomeEvent[]>('/api/sports/live');
  return response.data || [];
}

async function fetchFeaturedEvents(sports: SportSummary[]): Promise<HomeEvent[]> {
  const topSports = sports.slice(0, 3);
  const responses = await Promise.all(
    topSports.map((sport) => apiGet<SportEventsResponse>(`/api/sports/${sport.slug}/events`)),
  );

  const events = responses.flatMap((response) => response.data || []);
  return events.slice(0, 12);
}

export default function HomePage() {
  const sportsQuery = useQuery({
    queryKey: ['home', 'sports'],
    queryFn: fetchSports,
  });

  const liveQuery = useQuery({
    queryKey: ['home', 'live'],
    queryFn: fetchLiveEvents,
    refetchInterval: 15_000,
  });

  const featuredQuery = useQuery({
    queryKey: ['home', 'featured', sportsQuery.data?.map((sport) => sport.slug).join(',') || 'none'],
    queryFn: () => fetchFeaturedEvents(sportsQuery.data || []),
    enabled: Boolean(sportsQuery.data && sportsQuery.data.length > 0),
  });

  const sportsLinks = [
    { href: '/sports', label: 'All Sports' },
    { href: '/sports/tennis', label: 'Tennis' },
    { href: '/sports/basketball', label: 'Basketball' },
    { href: '/sports/golf', label: 'Golf' },
    { href: '/sports/esports', label: 'Esports' },
    { href: '/sports/football', label: 'Football' },
  ];

  return (
    <main className="min-h-screen bg-[#0B0E1A] px-4 pb-8 pt-5 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 rounded-xl border border-[#1E293B] bg-[#111827] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                BET<span className="text-[#00C37B]">ARENA</span>
              </h1>
              <p className="mt-1 text-sm text-[#94A3B8]">
                Live odds, fast markets, and real-time in-play coverage.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/sports" className="rounded-lg bg-[#00C37B] px-4 py-2 text-sm font-bold text-[#0B0E1A]">
                Start Betting
              </Link>
              <Link href="/login" className="rounded-lg border border-[#1E293B] px-4 py-2 text-sm font-bold text-white">
                Log in
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sportsLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full border border-[#1E293B] px-3 py-1.5 text-xs text-[#CBD5E1] hover:border-[#00C37B] hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div>
            {featuredQuery.isLoading ? (
              <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-5 text-[#94A3B8]">Loading featured events...</div>
            ) : (
              <FeaturedEvents events={featuredQuery.data || []} />
            )}
          </div>
          <div>
            {liveQuery.isLoading ? (
              <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-5 text-[#94A3B8]">Loading live events...</div>
            ) : (
              <LiveNow events={liveQuery.data || []} />
            )}
          </div>
        </div>

        {(sportsQuery.error || featuredQuery.error || liveQuery.error) ? (
          <div className="mt-4 rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-3 text-sm text-[#FCA5A5]">
            Some sections could not be loaded from live APIs. Please refresh in a moment.
          </div>
        ) : null}
      </div>
    </main>
  );
}
