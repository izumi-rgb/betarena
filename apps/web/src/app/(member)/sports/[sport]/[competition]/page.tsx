'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { SportSidebar, TopHeader } from '@/components/app/SportSidebar';

type OutrightSelection = {
  id: string;
  name: string;
  odds: number;
};

type Fixture = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'live' | 'scheduled' | 'finished';
  league?: string;
  odds?: [number, number, number?];
  marketsCount?: number;
};

type CompetitionPageData = {
  competitionName: string;
  countryFlag?: string;
  logoUrl?: string;
  outright?: OutrightSelection[];
  fixtures: Fixture[];
};

function OddsCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#1E293B] bg-[#0B0E1A] px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-[#64748B]">{label}</div>
      <div className="font-mono text-sm font-bold text-[#F59E0B]">{value.toFixed(2)}</div>
    </div>
  );
}

function daySectionLabel(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() === today.getTime()) return 'Today';
  if (target.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return target.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

const FALLBACK_DATA: CompetitionPageData = {
  competitionName: 'Premier League',
  countryFlag: '🏴',
  outright: [
    { id: 'o1', name: 'Arsenal', odds: 2.8 },
    { id: 'o2', name: 'Man City', odds: 2.95 },
    { id: 'o3', name: 'Liverpool', odds: 3.25 },
    { id: 'o4', name: 'Chelsea', odds: 7.5 },
    { id: 'o5', name: 'Tottenham', odds: 12.0 },
    { id: 'o6', name: 'Newcastle', odds: 14.0 },
  ],
  fixtures: [
    {
      id: 'f1',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      startTime: new Date().toISOString(),
      status: 'live',
      odds: [1.75, 3.65, 4.3],
      marketsCount: 142,
    },
    {
      id: 'f2',
      homeTeam: 'Man City',
      awayTeam: 'Liverpool',
      startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      odds: [2.05, 3.4, 3.7],
      marketsCount: 128,
    },
    {
      id: 'f3',
      homeTeam: 'Tottenham',
      awayTeam: 'Aston Villa',
      startTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      odds: [2.4, 3.3, 2.9],
      marketsCount: 115,
    },
  ],
};

export default function CompetitionLeaguePage() {
  const params = useParams<{ sport: string; competition: string }>();
  const sport = params?.sport || 'football';
  const competition = params?.competition || 'premier-league';

  const [data, setData] = useState<CompetitionPageData>(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompetition = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `/api/sports/${sport}/competitions/${competition}/events?ts=${Date.now()}`;
      const res = await apiGet<CompetitionPageData>(url, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });

      if (res.success && res.data) {
        setData({
          competitionName: res.data.competitionName || FALLBACK_DATA.competitionName,
          countryFlag: res.data.countryFlag || FALLBACK_DATA.countryFlag,
          logoUrl: res.data.logoUrl,
          outright: (res.data.outright && res.data.outright.length ? res.data.outright : FALLBACK_DATA.outright) || [],
          fixtures: (res.data.fixtures && res.data.fixtures.length ? res.data.fixtures : FALLBACK_DATA.fixtures) || [],
        });
      } else {
        setData(FALLBACK_DATA);
      }
    } catch {
      setData(FALLBACK_DATA);
      setError('Using demo competition data');
    } finally {
      setLoading(false);
    }
  }, [competition, sport]);

  useEffect(() => {
    loadCompetition();
  }, [loadCompetition]);

  const grouped = useMemo(() => {
    const live = data.fixtures.filter((f) => f.status === 'live');
    const upcoming = data.fixtures
      .filter((f) => f.status !== 'live')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const map = new Map<string, Fixture[]>();

    if (live.length) {
      map.set('Live', live);
    }

    for (const item of upcoming) {
      const key = daySectionLabel(item.startTime);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    return Array.from(map.entries()).map(([label, fixtures]) => ({ label, fixtures }));
  }, [data.fixtures]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0E1A] text-[#F1F5F9]">
      <SportSidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <TopHeader />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">
            <section className="mb-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{data.countryFlag || '🏳️'}</span>
                <div>
                  <h1 className="text-xl font-bold text-white">{data.competitionName}</h1>
                  <p className="text-sm text-[#94A3B8]">{sport.replace('-', ' ')} competition</p>
                </div>
                {data.logoUrl ? (
                  <Image
                    src={data.logoUrl}
                    alt="Competition logo"
                    width={40}
                    height={40}
                    className="ml-auto rounded-full border border-[#1E293B]"
                  />
                ) : null}
              </div>
            </section>

            <section className="mb-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#94A3B8]">Outright Winner</h2>
                <button className="text-xs font-semibold text-[#00C37B] hover:underline">View All</button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(data.outright || []).slice(0, 6).map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-[#1E293B] bg-[#111827] px-3 py-2">
                    <span className="text-sm font-semibold text-white">{o.name}</span>
                    <span className="font-mono text-sm font-bold text-[#F59E0B]">{o.odds.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              {loading ? (
                <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-8 text-center text-[#94A3B8]">Loading fixtures...</div>
              ) : (
                grouped.map((group) => (
                  <div key={group.label} className="overflow-hidden rounded-xl border border-[#1E293B] bg-[#1A2235]">
                    <div className="border-b border-[#1E293B] px-4 py-3 text-sm font-bold text-white">
                      {group.label}
                    </div>
                    <div className="divide-y divide-[#1E293B]">
                      {group.fixtures.map((fx) => (
                        <div key={fx.id} className="grid grid-cols-[160px_1fr_auto_1fr_220px_120px] items-center gap-3 px-4 py-3">
                          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                            {fx.status === 'live' ? <span className="rounded bg-[#EF4444]/20 px-2 py-0.5 text-[10px] font-bold text-[#EF4444]">LIVE</span> : null}
                            <span>{new Date(fx.startTime).toLocaleString()}</span>
                          </div>
                          <div className="text-sm font-semibold text-white">{fx.homeTeam}</div>
                          <div className="text-xs text-[#64748B]">vs</div>
                          <div className="text-sm font-semibold text-white">{fx.awayTeam}</div>

                          <div className="grid grid-cols-3 gap-1">
                            <OddsCell label="1" value={fx.odds?.[0] ?? 1.95} />
                            <OddsCell label="X" value={fx.odds?.[1] ?? 3.4} />
                            <OddsCell label="2" value={fx.odds?.[2] ?? 3.9} />
                          </div>

                          <div className="text-right text-xs font-semibold text-[#94A3B8]">+{fx.marketsCount ?? 120}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>

            {error ? <p className="mt-3 text-xs text-[#94A3B8]">{error}</p> : null}
          </div>
        </div>
      </main>
    </div>
  );
}
