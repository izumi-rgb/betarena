'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiGet } from '@/lib/api';

type ResultRow = {
  id: string;
  competition: string;
  countryFlag?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  kickoff: string;
  marketsHref?: string;
  sport?: string;
};

type ResultsApiItem = {
  id?: string | number;
  competition?: string;
  countryFlag?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  kickoff?: string;
  marketsHref?: string;
  sport?: string;
};

const MEMBER_NAV_LINKS = [
  { href: '/sports', label: 'Sports' },
  { href: '/in-play', label: 'In-Play' },
  { href: '/live', label: 'Live Stream' },
  { href: '/my-bets', label: 'My Bets' },
  { href: '/results', label: 'Results' },
  { href: '/account', label: 'Account' },
];

function TopHeader() {
  const pathname = usePathname();
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#1E293B] bg-[#111827]/80 px-6 backdrop-blur">
      <nav className="flex gap-1">
        {MEMBER_NAV_LINKS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              pathname === t.href
                ? 'bg-[#1A2235] text-white'
                : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <div className="rounded-full border border-[#1E293B] bg-[#0B0E1A] px-3 py-1.5 font-mono text-[13px] font-bold text-[#00C37B]">$2,450.50</div>
        <div className="h-9 w-9 rounded-full border-2 border-[#1A2235] bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6]" />
      </div>
    </header>
  );
}

function SportSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] shrink-0 border-r border-[#1E293B] bg-[#111827]">
      <div className="flex h-16 items-center gap-2 border-b border-[#1E293B] px-6">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B]">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
        </svg>
        <span className="text-[20px] font-extrabold tracking-tight text-white">BET<span className="text-[#00C37B]">ARENA</span></span>
      </div>
      <nav className="space-y-1 p-3">
        {MEMBER_NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block rounded-md px-3 py-2.5 text-sm transition-colors ${
              pathname === l.href
                ? 'bg-[#1A2235] text-white'
                : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

const FALLBACK_RESULTS: ResultRow[] = [
  {
    id: 'r1',
    competition: 'Premier League',
    countryFlag: '🏴',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeScore: 2,
    awayScore: 1,
    kickoff: new Date().toISOString(),
    marketsHref: '/sports',
    sport: 'football',
  },
  {
    id: 'r2',
    competition: 'La Liga',
    countryFlag: '🇪🇸',
    homeTeam: 'Real Madrid',
    awayTeam: 'Atletico',
    homeScore: 3,
    awayScore: 1,
    kickoff: new Date().toISOString(),
    marketsHref: '/sports',
    sport: 'football',
  },
  {
    id: 'r3',
    competition: 'NBA',
    countryFlag: '🇺🇸',
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    homeScore: 101,
    awayScore: 98,
    kickoff: new Date().toISOString(),
    marketsHref: '/sports/basketball',
    sport: 'basketball',
  },
  {
    id: 'r4',
    competition: 'ATP 500 Dubai',
    countryFlag: '🇦🇪',
    homeTeam: 'Djokovic',
    awayTeam: 'Alcaraz',
    homeScore: 2,
    awayScore: 1,
    kickoff: new Date().toISOString(),
    marketsHref: '/sports/tennis',
    sport: 'tennis',
  },
];

function resolveMarketsHref(rawHref: string | undefined, sport?: string): string {
  const href = (rawHref || '').trim();

  // Prevent sending users into unstable legacy dynamic sports id routes.
  if (/^\/sports\/\d+$/i.test(href)) {
    if (sport === 'tennis') return '/sports/tennis';
    if (sport === 'basketball') return '/sports/basketball';
    if (sport === 'esports') return '/sports/esports';
    if (sport === 'golf') return '/sports/golf';
    return '/sports';
  }

  if (href) return href;

  if (sport === 'tennis') return '/sports/tennis';
  if (sport === 'basketball') return '/sports/basketball';
  if (sport === 'esports') return '/sports/esports';
  if (sport === 'golf') return '/sports/golf';
  return '/sports';
}

export default function ResultsPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [sport, setSport] = useState('');
  const [date, setDate] = useState(today);
  const [competition, setCompetition] = useState('');
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams({
      sport,
      date,
      competition,
      ts: String(Date.now()),
    });

    try {
      const res = await apiGet<ResultsApiItem[]>(`/api/results?${qs.toString()}`, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });

      const data = (res.data ?? []).map((it, idx): ResultRow => ({
        id: String(it.id ?? `result-${idx}`),
        competition: it.competition ?? 'Competition',
        countryFlag: it.countryFlag ?? '🏳️',
        homeTeam: it.homeTeam ?? 'Home',
        awayTeam: it.awayTeam ?? 'Away',
        homeScore: Number(it.homeScore ?? 0),
        awayScore: Number(it.awayScore ?? 0),
        kickoff: it.kickoff ?? new Date().toISOString(),
        marketsHref: resolveMarketsHref(it.marketsHref, it.sport ?? 'football'),
        sport: it.sport ?? 'football',
      }));

      setRows(data);
    } catch {
      const filtered = FALLBACK_RESULTS.filter((r) => {
        const sportOk = sport ? r.sport === sport : true;
        const compOk = competition
          ? r.competition.toLowerCase().includes(competition.toLowerCase())
          : true;
        return sportOk && compOk;
      });
      setRows(filtered);
      setError('Live results endpoint unavailable, showing demo results');
    } finally {
      setLoading(false);
    }
  }, [competition, date, sport]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const grouped = useMemo(() => {
    const map = new Map<string, { flag: string; rows: ResultRow[] }>();
    for (const row of rows) {
      const key = row.competition;
      if (!map.has(key)) {
        map.set(key, { flag: row.countryFlag || '🏳️', rows: [] });
      }
      map.get(key)!.rows.push(row);
    }
    return Array.from(map.entries()).map(([name, v]) => ({ name, flag: v.flag, rows: v.rows }));
  }, [rows]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0E1A] text-[#F1F5F9]">
      <SportSidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <TopHeader />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-2xl font-bold tracking-tight text-white">Results</h1>
            <p className="mt-1 text-sm text-[#94A3B8]">Finalized matches grouped by competition</p>

            <section className="mt-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
              <div className="grid gap-3 md:grid-cols-[180px_170px_1fr_auto]">
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-2 text-sm text-white"
                >
                  <option value="">All Sports</option>
                  <option value="football">Football</option>
                  <option value="tennis">Tennis</option>
                  <option value="basketball">Basketball</option>
                  <option value="esports">Esports</option>
                  <option value="golf">Golf</option>
                </select>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-2 text-sm text-white"
                />

                <input
                  type="text"
                  value={competition}
                  onChange={(e) => setCompetition(e.target.value)}
                  placeholder="Search competition"
                  className="rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-2 text-sm text-white placeholder:text-[#64748B]"
                />

                <button
                  onClick={loadResults}
                  className="rounded-lg border border-[#00C37B] px-4 py-2 text-sm font-semibold text-[#00C37B] hover:bg-[#00C37B]/10"
                >
                  Apply
                </button>
              </div>
              {error ? <p className="mt-2 text-xs text-[#94A3B8]">{error}</p> : null}
            </section>

            <section className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-8 text-center text-[#94A3B8]">Loading results...</div>
              ) : grouped.length === 0 ? (
                <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-8 text-center text-[#94A3B8]">
                  No results for this date. Try selecting a different date.
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.name} className="overflow-hidden rounded-xl border border-[#1E293B] bg-[#1A2235]">
                    <div className="flex items-center gap-2 border-b border-[#1E293B] px-4 py-3">
                      <span>{group.flag}</span>
                      <h2 className="text-sm font-bold text-white">{group.name}</h2>
                    </div>

                    <div className="divide-y divide-[#1E293B]">
                      {group.rows.map((r) => (
                        <div key={r.id} className="grid grid-cols-[70px_1fr_auto_1fr_140px_140px] items-center gap-3 px-4 py-3">
                          <div>
                            <span className="rounded bg-[#334155] px-2 py-0.5 text-[10px] font-bold uppercase text-[#CBD5E1]">FT</span>
                          </div>
                          <div className="text-sm font-semibold text-white">{r.homeTeam}</div>
                          <div className="min-w-[72px] text-center font-mono text-xl font-bold text-white">{r.homeScore} - {r.awayScore}</div>
                          <div className="text-sm font-semibold text-white">{r.awayTeam}</div>
                          <div className="text-xs text-[#94A3B8]">{new Date(r.kickoff).toLocaleString()}</div>
                          <div className="text-right">
                            <Link href={r.marketsHref || '/sports'} className="text-sm font-semibold text-[#00C37B] hover:underline">
                              View Markets →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
