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

type EventMarketsResponse = {
  event: Omit<TennisEvent, 'markets'>;
  markets: Market[];
};

type TennisEvent = {
  id: string;
  league: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  homeTeam: { name: string };
  awayTeam: { name: string };
  markets: Market[];
  stats?: {
    aces?: [number, number];
    doubleFaults?: [number, number];
    breakPoints?: [number, number];
    winners?: [number, number];
  };
  sets?: {
    home: number;
    away: number;
  };
  gameScore?: {
    home: string;
    away: string;
  };
  serving?: 'home' | 'away';
};

function MatchCard({ event, eventId }: { event: TennisEvent; eventId: number }) {
  const togglePick = useBetSlipStore((s) => s.togglePick);
  const picks = useBetSlipStore((s) => s.picks);
  const servingHome = event.serving === 'home';
  const servingAway = event.serving === 'away';
  const stats = event.stats ?? {};

  const marketGroups = useMemo(
    () => [
      { key: 'match_winner', title: 'Match Winner (2-Way)' },
      { key: 'set_betting', title: 'Set Betting (Correct Set Score)' },
      { key: 'total_games_ou', title: 'Total Games Over/Under' },
      { key: 'games_handicap', title: 'Games Handicap' },
      { key: 'first_set_winner', title: 'First Set Winner' },
      { key: 'each_set_winner', title: 'Each Set Winner (Set 1/2/3)' },
      { key: 'correct_score_sets', title: 'Correct Score (Sets)' },
      { key: 'any_set_to_nil', title: 'Any Set to Nil' },
      { key: 'tournament_outright', title: 'Tournament Outright Winner' },
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
            <div className="inline-flex items-center gap-2 text-xl font-bold text-white">
              {event.homeTeam.name}
              {servingHome ? <span className="h-2.5 w-2.5 rounded-full bg-[#00C37B]" /> : null}
            </div>
          </div>

          <div className="rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-6 py-3 text-center">
            <div className="font-mono text-[28px] font-bold text-white">
              {event.sets?.home ?? 0} — {event.sets?.away ?? 0}
            </div>
            <div className="mt-1 font-mono text-sm text-[#94A3B8]">
              {event.gameScore?.home ?? '0'} — {event.gameScore?.away ?? '0'}
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 text-xl font-bold text-white">
              {servingAway ? <span className="h-2.5 w-2.5 rounded-full bg-[#00C37B]" /> : null}
              {event.awayTeam.name}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <StatCard label="Aces" home={stats.aces?.[0] ?? 0} away={stats.aces?.[1] ?? 0} />
          <StatCard label="Double Faults" home={stats.doubleFaults?.[0] ?? 0} away={stats.doubleFaults?.[1] ?? 0} />
          <StatCard label="Break Points" home={stats.breakPoints?.[0] ?? 0} away={stats.breakPoints?.[1] ?? 0} />
          <StatCard label="Winners" home={stats.winners?.[0] ?? 0} away={stats.winners?.[1] ?? 0} />
        </div>
      </section>

      {marketGroups.map((g) => {
        const m = marketByType.get(g.key);
        const selections = m?.selections ?? [];

        if (!selections.length) return null;

        return (
          <MarketAccordion key={g.key} title={g.title}>
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
          </MarketAccordion>
        );
      })}
    </div>
  );
}

export default function TennisMatchPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params?.eventId ?? '';
  const [event, setEvent] = useState<TennisEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setError(null);
    try {
      const res = await apiGet<EventMarketsResponse | TennisEvent>(`/api/sports/events/${eventId}/markets`);
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to load tennis match');
        return;
      }

      const payload = res.data as EventMarketsResponse | TennisEvent;
      const normalized = 'event' in payload
        ? { ...payload.event, markets: payload.markets ?? [] }
        : payload;

      setEvent((prev) => ({
        ...(prev ?? {}),
        ...normalized,
        id: String(normalized.id ?? eventId),
        league: normalized.league || 'ATP Tour',
        status: normalized.status || 'scheduled',
        sets: normalized.sets ?? { home: 0, away: 0 },
        gameScore: normalized.gameScore ?? { home: '0', away: '0' },
        serving: normalized.serving ?? 'home',
        markets: normalized.markets ?? [],
      } as TennisEvent));
    } catch (e) {
      try {
        const uncachedEventsUrl = `/api/sports/tennis/events?ts=${Date.now()}`;
        const listRes = await apiGet<Array<{ id: number | string }>>(uncachedEventsUrl, {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        const first = listRes.data?.[0];
        if (first && String(first.id) !== String(eventId)) {
          router.replace(`/sports/tennis/${first.id}`);
          return;
        }
      } catch {
        // If recovery lookup fails, fall through to error state.
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
    onEventUpdate: (data: Partial<TennisEvent>) => {
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
      <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 text-[#94A3B8]">Loading tennis event...</div>
    );
  }

  if (!event) {
    return (
      <div className="rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">
        {error ?? 'Tennis event not found'}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/sports/tennis" className="rounded border border-[#1E293B] px-3 py-2 text-sm text-[#CBD5E1] hover:border-[#00C37B]">
            Back to Tennis
          </Link>
          <BalanceBadge />
        </div>
        <MatchCard event={event} eventId={Number(eventId)} />
      </div>
    </main>
  );
}
