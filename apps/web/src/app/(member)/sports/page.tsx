'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type EventRow = { id: number; homeTeam?: { name: string }; awayTeam?: { name: string }; league?: string; status?: string; sport?: string };

const sportRoutes: Record<string, string> = {
  football: '/sports/1',
  tennis: '/sports/tennis',
  basketball: '/sports/basketball',
  golf: '/sports/golf',
  esports: '/sports/esports',
};

export default function SportsLobbyPage() {
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<EventRow[]>('/api/sports/live');
        setEvents((res.data || []).slice(0, 10));
      } catch {
        setEvents([]);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E1A] text-white">
      <div className="flex">
        <aside className="hidden w-64 shrink-0 border-r border-[#1E293B] bg-[#111827] p-4 md:block">
          <div className="mb-6 text-2xl font-extrabold text-[#00C37B]">BETARENA</div>
          <nav className="space-y-1">
            <Link href="/sports" className="block rounded bg-[#1A2235] px-3 py-2">Sports</Link>
            <Link href="/in-play" className="block rounded px-3 py-2 hover:bg-[#1A2235]">In-Play</Link>
            <Link href="/live" className="block rounded px-3 py-2 hover:bg-[#1A2235]">Live Stream</Link>
            <Link href="/my-bets" className="block rounded px-3 py-2 hover:bg-[#1A2235]">My Bets</Link>
            <Link href="/results" className="block rounded px-3 py-2 hover:bg-[#1A2235]">Results</Link>
            <Link href="/account" className="block rounded px-3 py-2 hover:bg-[#1A2235]">Account</Link>
          </nav>
          <div className="mt-6 space-y-1 text-sm text-[#94A3B8]">
            <Link href="/sports/tennis" className="block rounded px-3 py-2 hover:bg-[#1A2235]">Tennis</Link>
            <Link href="/sports/basketball" className="block rounded px-3 py-2 hover:bg-[#1A2235]">Basketball</Link>
            <Link href="/sports/golf" className="block rounded px-3 py-2 hover:bg-[#1A2235]">Golf</Link>
            <Link href="/sports/esports" className="block rounded px-3 py-2 hover:bg-[#1A2235]">Esports</Link>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <div className="mb-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
            <h1 className="text-xl font-bold">In-Play Now</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {Object.entries(sportRoutes).map(([sport, href]) => (
                <Link key={sport} href={href} className="rounded-full border border-[#1E293B] px-3 py-1 hover:border-[#00C37B]">{sport}</Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {events.map((e) => {
              const sport = (e.sport || 'football').toLowerCase();
              const href = sportRoutes[sport] || '/sports';
              return (
                <Link key={e.id} href={href} className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4 hover:border-[#00C37B]">
                  <div className="text-xs text-[#94A3B8]">{e.league || 'Live Event'}</div>
                  <div className="mt-2 text-sm font-semibold">{e.homeTeam?.name || 'Team A'} vs {e.awayTeam?.name || 'Team B'}</div>
                </Link>
              );
            })}
            {events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#1E293B] bg-[#1A2235] p-8 text-center text-[#94A3B8]">No live events right now.</div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
