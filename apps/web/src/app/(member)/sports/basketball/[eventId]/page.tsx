'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { BalanceBadge } from '@/components/app/BalanceBadge';
import { LiveBadge, OddsButton, StatCard, MarketAccordion } from '@/components/sports/EventDetailComponents';
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

type BasketballEvent = {
  id: string;
  league: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  homeTeam: { name: string };
  awayTeam: { name: string };
  markets: Market[];
  score?: {
    home: number;
    away: number;
  };
  period?: string;
  clock?: string;
  stats?: {
    fgPercent?: [number, number];
    threePtPercent?: [number, number];
    rebounds?: [number, number];
    assists?: [number, number];
    turnovers?: [number, number];
  };
};

type EventMarketsResponse = {
  event: Omit<BasketballEvent, 'markets'>;
  markets: Market[];
};

function MatchCard({ event, eventId }: { event: BasketballEvent; eventId: number }) {
  const togglePick = useBetSlipStore((s) => s.togglePick);
  const picks = useBetSlipStore((s) => s.picks);
  const stats = event.stats ?? {};

  const marketGroups = useMemo(
    () => [
      { key: 'match_winner_ot', title: 'Match Winner (Including Overtime)' },
      { key: 'point_spread', title: 'Point Spread / Handicap' },
      { key: 'total_points_ou', title: 'Total Points Over/Under' },
      { key: 'moneyline', title: 'Moneyline' },
      { key: 'first_quarter_winner', title: 'First Quarter Winner' },
      { key: 'first_half_winner', title: 'First Half Winner' },
      { key: 'each_quarter_winner', title: 'Each Quarter Winner' },
      { key: 'first_half_total_points', title: 'First Half Total Points O/U' },
      { key: 'winning_margin', title: 'Winning Margin' },
      { key: 'player_points_ou', title: 'Player Points Over/Under (Top 5)' },
      { key: 'player_assists_ou', title: 'Player Assists Over/Under' },
      { key: 'player_rebounds_ou', title: 'Player Rebounds Over/Under' },
      { key: 'race_to_points', title: 'Race to 10/20 Points' },
    ],
    [],
  );

  const marketByType = new Map(event.markets.map((m) => [m.type || m.name.toLowerCase().replace(/\s+/g, '_'), m]));

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {event.status === 'live' ? <LiveBadge /> : null}
            <span className="text-xs text-[#94A3B8]">{event.league}</span>
          </div>
          <span className="text-xs text-[#64748B]">{new Date(event.startTime).toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="text-right">
            <div className="inline-flex items-center gap-2 text-xl font-bold text-white">{event.homeTeam.name}</div>
          </div>

          <div className="rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-6 py-3 text-center">
            <div className="font-mono text-[28px] font-bold text-white">
              {event.score?.home ?? 0} — {event.score?.away ?? 0}
            </div>
            <div className="mt-1 font-mono text-sm text-[#94A3B8]">
              {event.period ?? ''} • {event.clock ?? ''}
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 text-xl font-bold text-white">{event.awayTeam.name}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2">
          <StatCard label="FG%" home={stats.fgPercent?.[0] ?? 0} away={stats.fgPercent?.[1] ?? 0} />
          <StatCard label="3PT%" home={stats.threePtPercent?.[0] ?? 0} away={stats.threePtPercent?.[1] ?? 0} />
          <StatCard label="Rebounds" home={stats.rebounds?.[0] ?? 0} away={stats.rebounds?.[1] ?? 0} />
          <StatCard label="Assists" home={stats.assists?.[0] ?? 0} away={stats.assists?.[1] ?? 0} />
          <StatCard label="Turnovers" home={stats.turnovers?.[0] ?? 0} away={stats.turnovers?.[1] ?? 0} />
        </div>
      </section>

      {marketGroups.map((g) => {
        const m = marketByType.get(g.key);
        const selections = m?.selections ?? [];
        return (
          <MarketAccordion key={g.key} title={g.title}>
            {selections.length === 0 ? (
              <div className="py-3 text-center text-sm text-[#64748B]">No odds available</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {selections.map((s) => {
                  const pickId = `${eventId}-${g.key}-${s.id}`;
                  const active = picks.some((p) => p.id === pickId);
                  return (
                    <OddsButton
                      key={s.id}
                      label={s.name}
                      odds={s.odds}
                      active={active}
                      disabled={s.suspended}
                      onClick={() => togglePick({ id: pickId, eventId, market: g.title, marketType: g.key, selection: s.name, odds: s.odds })}
                    />
                  );
                })}
              </div>
            )}
          </MarketAccordion>
        );
      })}
    </div>
  );
}

export default function BasketballMatchPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params?.eventId ?? '';
  const [event, setEvent] = useState<BasketballEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setError(null);
    try {
      const res = await apiGet<EventMarketsResponse | BasketballEvent>(`/api/sports/events/${eventId}/markets`);
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to load basketball match');
        return;
      }

      const payload = res.data as EventMarketsResponse | BasketballEvent;
      const normalized = 'event' in payload
        ? { ...payload.event, markets: payload.markets ?? [] }
        : payload;

      setEvent((prev) => ({
        ...(prev ?? {}),
        ...normalized,
        id: String(normalized.id ?? eventId),
        league: normalized.league || 'NBA',
        status: normalized.status || 'scheduled',
        score: normalized.score ?? { home: 0, away: 0 },
        period: normalized.period ?? '—',
        clock: normalized.clock ?? '—',
        stats: normalized.stats ?? {
          fgPercent: [0, 0],
          threePtPercent: [0, 0],
          rebounds: [0, 0],
          assists: [0, 0],
          turnovers: [0, 0],
        },
        markets: normalized.markets ?? [],
      } as BasketballEvent));
    } catch (e) {
      try {
        const uncachedEventsUrl = `/api/sports/basketball/events?ts=${Date.now()}`;
        const listRes = await apiGet<Array<{ id: number | string }>>(uncachedEventsUrl, {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        const first = listRes.data?.[0];
        if (first && String(first.id) !== String(eventId)) {
          router.replace(`/sports/basketball/${first.id}`);
          return;
        }
      } catch {
        // Ignore and show error below.
      }
      setError((e as Error).message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEventSocket(eventId, {
    onEventUpdate: (data: Partial<BasketballEvent>) => {
      setEvent((prev) => (prev ? ({ ...prev, ...data }) : prev));
    },
    onOddsUpdate: (data: { marketId?: string; markets?: Array<{ marketId?: string; selections: MarketSelection[] }> }) => {
      setEvent((prev) => {
        if (!prev) return prev;
        if (Array.isArray(data.markets)) {
          return {
            ...prev,
            markets: prev.markets.map((m) => {
              const incoming = data.markets!.find((im) => (im.marketId ?? '') === m.id);
              return incoming ? { ...m, selections: incoming.selections } : m;
            }),
          };
        }
        return prev;
      });
    },
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 text-[#94A3B8]">Loading basketball event...</div>
    );
  }

  if (!event) {
    return (
      <div className="rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">
        {error ?? 'Basketball event not found'}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/sports/basketball" className="rounded border border-[#1E293B] px-3 py-2 text-sm text-[#CBD5E1] hover:border-[#00C37B]">
            Back to Basketball
          </Link>
          <BalanceBadge />
        </div>
        <MatchCard event={event} eventId={Number(eventId)} />
      </div>
    </main>
  );
}
