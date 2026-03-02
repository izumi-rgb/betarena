'use client';

import Link from 'next/link';
import type { HomeEvent } from '@/components/home/FeaturedEvents';

function eventHref(event: HomeEvent): string {
  const sport = String(event.sport || '').toLowerCase().trim();
  if (['tennis', 'basketball', 'golf', 'esports', 'cricket', 'football', 'horse-racing'].includes(sport)) {
    return `/sports/${sport}/${event.id}`;
  }
  return '/in-play';
}

export function LiveNow({ events }: { events: HomeEvent[] }) {
  const liveEvents = events.slice(0, 8);

  return (
    <section className="rounded-xl border border-[#1E293B] bg-[#111827] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Live Now</h2>
        <Link href="/in-play" className="text-sm text-[#00C37B] hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {liveEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#1E293B] px-3 py-4 text-sm text-[#94A3B8]">
            No live events at the moment.
          </div>
        ) : liveEvents.map((event) => (
          <Link
            key={event.id}
            href={eventHref(event)}
            className="flex items-center justify-between rounded-lg border border-[#1E293B] bg-[#1A2235] px-3 py-3 hover:border-[#00C37B]/60"
          >
            <div>
              <div className="text-xs uppercase tracking-wide text-[#64748B]">
                {event.sport || 'Sport'} · {event.league || 'League'}
              </div>
              <div className="text-sm font-semibold text-white">
                {event.homeTeam?.name || 'Home'} vs {event.awayTeam?.name || 'Away'}
              </div>
            </div>
            <span className="rounded bg-[#EF4444]/20 px-2 py-1 text-xs font-bold text-[#EF4444]">
              LIVE
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
