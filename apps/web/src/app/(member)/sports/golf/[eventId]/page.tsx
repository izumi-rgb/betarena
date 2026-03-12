'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { BalanceBadge } from '@/components/app/BalanceBadge';
import { LiveBadge, OddsButton, MarketAccordion } from '@/components/sports/EventDetailComponents';
import { useEventSocket } from '@/hooks/useEventSocket';

type MarketSelection = {
  id: string;
  name: string;
  odds: number;
  line?: string;
  suspended?: boolean;
};

type Market = {
  id: string;
  name: string;
  type: string;
  selections: MarketSelection[];
};

type LeaderboardRow = {
  id: string;
  pos: number;
  trend: 'up' | 'down' | 'same';
  player: string;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  total: number;
  odds: number;
};

type GolfEvent = {
  id: string;
  league: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  homeTeam: { name: string };
  awayTeam: { name: string };
  markets: Market[];
  tournamentName?: string;
  course?: string;
  round?: string;
  leaderboard?: LeaderboardRow[];
};

type EventMarketsResponse = {
  event: Omit<GolfEvent, 'markets'>;
  markets: Market[];
};

function trendArrow(trend: LeaderboardRow['trend']) {
  if (trend === 'up') return '\u2191';
  if (trend === 'down') return '\u2193';
  return '\u2192';
}

function scoreClass(score: number) {
  if (score < 70) return 'text-[#EF4444]';
  if (score > 72) return 'text-[#0F172A]';
  return 'text-[#E2E8F0]';
}

export default function GolfTournamentPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params?.eventId ?? '';
  const togglePick = useBetSlipStore((s) => s.togglePick);
  const picks = useBetSlipStore((s) => s.picks);

  const [event, setEvent] = useState<GolfEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setError(null);

    try {
      const res = await apiGet<EventMarketsResponse | GolfEvent>(`/api/sports/events/${eventId}/markets`);
      if (!res.success || !res.data) {
        setError('No golf tournament data available');
        return;
      }

      const payload = res.data as EventMarketsResponse | GolfEvent;
      const normalized = 'event' in payload ? { ...payload.event, markets: payload.markets ?? [] } : payload;

      setEvent((prev) => ({
        ...(prev ?? {}),
        ...normalized,
        id: String(normalized.id ?? eventId),
        league: normalized.league || 'Golf',
        status: normalized.status || 'upcoming',
        leaderboard: normalized.leaderboard ?? [],
        markets: normalized.markets ?? [],
      } as GolfEvent));
    } catch {
      try {
        const uncachedEventsUrl = `/api/sports/golf/events?ts=${Date.now()}`;
        const listRes = await apiGet<Array<{ id: number | string }>>(uncachedEventsUrl, {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        const first = listRes.data?.[0];
        if (first && String(first.id) !== String(eventId)) {
          router.replace(`/sports/golf/${first.id}`);
          return;
        }
      } catch {
        // Ignore fallback error.
      }
      setError('No live golf tournaments right now. Check back later.');
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEventSocket(eventId, {
    onEventUpdate: (data: Partial<GolfEvent>) => {
      setEvent((prev) => (prev ? { ...prev, ...data } : prev));
    },
    onOddsUpdate: (data: { markets?: Array<{ marketId?: string; selections: MarketSelection[] }> }) => {
      setEvent((prev) => {
        if (!prev || !Array.isArray(data.markets)) return prev;
        return {
          ...prev,
          markets: prev.markets.map((m) => {
            const incoming = data.markets?.find((im) => (im.marketId ?? '') === m.id);
            return incoming ? { ...m, selections: incoming.selections } : m;
          }),
        };
      });
    },
  });

  const marketGroups = useMemo(
    () => [
      { key: 'tournament_winner', title: 'Tournament Winner' },
      { key: 'top_5_finish', title: 'Top 5 Finish' },
      { key: 'top_10_finish', title: 'Top 10 Finish' },
      { key: 'top_20_finish', title: 'Top 20 Finish' },
      { key: 'make_miss_cut', title: 'Make/Miss The Cut' },
      { key: 'head_to_head', title: 'Head to Head Matchups' },
      { key: 'winning_score_ou', title: 'Winning Score Over/Under' },
      { key: 'country_winner', title: 'Country of Winner' },
    ],
    [],
  );

  if (loading) {
    return <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 text-[#94A3B8]">Loading golf tournament...</div>;
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-sm">
          <div className="mb-3 text-3xl">&#x26F3;</div>
          <div className="font-semibold text-white">No live golf tournaments right now</div>
          <div className="mt-2 text-sm text-[#94A3B8]">Check back later for live tournaments and betting markets.</div>
        </div>
      </div>
    );
  }

  const leaderboard = event.leaderboard ?? [];
  const top3 = leaderboard.slice(0, 3);
  const marketByType = new Map((event.markets ?? []).map((m) => [m.type || m.name.toLowerCase().replace(/\s+/g, '_'), m]));
  const numEventId = Number(eventId);

  return (
    <main className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/sports/golf" className="rounded border border-[#1E293B] px-3 py-2 text-sm text-[#CBD5E1] hover:border-[#00C37B]">
            Back to Golf
          </Link>
          <BalanceBadge />
        </div>

        <section className="mb-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">{event.tournamentName}</h1>
              <div className="mt-1 text-sm text-[#94A3B8]">{event.course} • {event.round}</div>
            </div>
            {event.status === 'live' ? <LiveBadge /> : null}
          </div>

          {top3.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {top3.map((r) => (
                <div key={r.id} className="rounded-lg border border-[#1E293B] bg-[#111827] p-3">
                  <div className="text-xs text-[#64748B]">#{r.pos}</div>
                  <div className="mt-1 font-semibold text-white">{r.player}</div>
                  <div className="mt-1 font-mono text-sm text-[#00C37B]">{r.total > 0 ? `+${r.total}` : r.total}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 xl:grid-cols-[65%_35%]">
          <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#94A3B8]">Tournament Leaderboard</h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-[#1E293B] text-xs uppercase tracking-wide text-[#64748B]">
                    <th className="px-2 py-2 text-left">Pos</th>
                    <th className="px-2 py-2 text-left">Player</th>
                    <th className="px-2 py-2 text-center">R1</th>
                    <th className="px-2 py-2 text-center">R2</th>
                    <th className="px-2 py-2 text-center">R3</th>
                    <th className="px-2 py-2 text-center">R4</th>
                    <th className="px-2 py-2 text-center">Total</th>
                    <th className="px-2 py-2 text-center">Odds</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-2 py-8 text-center text-sm text-[#64748B]">
                        Leaderboard data not yet available
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((row) => {
                      const pickId = `${numEventId}-tournament_winner-lb_${row.id}`;
                      return (
                        <tr key={row.id} className="border-b border-[#1E293B]/50">
                          <td className="px-2 py-2">
                            <span className="mr-1 text-[#94A3B8]">{trendArrow(row.trend)}</span>
                            <span className="font-semibold text-white">{row.pos}</span>
                          </td>
                          <td className="px-2 py-2 font-semibold text-white">{row.player}</td>
                          <td className={`px-2 py-2 text-center font-mono ${scoreClass(row.r1)}`}>{row.r1 || '-'}</td>
                          <td className={`px-2 py-2 text-center font-mono ${scoreClass(row.r2)}`}>{row.r2 || '-'}</td>
                          <td className={`px-2 py-2 text-center font-mono ${scoreClass(row.r3)}`}>{row.r3 || '-'}</td>
                          <td className={`px-2 py-2 text-center font-mono ${scoreClass(row.r4)}`}>{row.r4 || '-'}</td>
                          <td className="px-2 py-2 text-center font-mono text-lg font-bold text-[#00C37B]">{row.total > 0 ? `+${row.total}` : row.total}</td>
                          <td className="px-2 py-2">
                            <OddsButton
                              label="Outright"
                              odds={row.odds}
                              active={picks.some((p) => p.id === pickId)}
                              onClick={() => togglePick({ id: pickId, eventId: numEventId, market: 'Tournament Winner', marketType: 'tournament_winner', selection: row.player, odds: row.odds })}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            {marketGroups.map((g) => {
              const market = marketByType.get(g.key);
              const selections = market?.selections ?? [];

              if (!selections.length) return null;

              return (
                <MarketAccordion key={g.key} title={g.title} defaultOpen={g.key === 'tournament_winner'}>
                  <div className="grid grid-cols-1 gap-2">
                    {selections.map((s) => {
                      const pickId = `${numEventId}-${g.key}-${s.id}`;
                      return (
                        <OddsButton
                          key={s.id}
                          label={s.name}
                          odds={s.odds}
                          active={picks.some((p) => p.id === pickId)}
                          disabled={s.suspended}
                          onClick={() => togglePick({ id: pickId, eventId: numEventId, market: g.title, marketType: g.key, selection: s.name, odds: s.odds })}
                        />
                      );
                    })}
                  </div>
                </MarketAccordion>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
