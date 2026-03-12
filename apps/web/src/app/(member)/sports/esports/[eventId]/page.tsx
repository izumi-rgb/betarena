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

type EsportsEvent = {
  id: string;
  league: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  homeTeam: { name: string; abbr?: string };
  awayTeam: { name: string; abbr?: string };
  markets: Market[];
  mapScore?: { home: number; away: number };
  currentMap?: string;
  roundCounter?: string;
  gameTag?: 'CS2' | 'League of Legends' | 'Valorant';
};

type EventMarketsResponse = {
  event: Omit<EsportsEvent, 'markets'>;
  markets: Market[];
};

function TeamLogo({ name, hue }: { name: string; hue: number }) {
  const abbr = name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1E293B] text-[10px] font-bold text-white"
        style={{ backgroundColor: `hsl(${hue} 70% 35%)` }}
      >
        {abbr}
      </div>
      <span className="text-xl font-bold text-white">{name}</span>
    </div>
  );
}

function MatchCard({ event, eventId }: { event: EsportsEvent; eventId: number }) {
  const togglePick = useBetSlipStore((s) => s.togglePick);
  const picks = useBetSlipStore((s) => s.picks);

  const marketGroups = useMemo(
    () => [
      { key: 'match_winner', title: 'Match Winner' },
      { key: 'map_handicap', title: 'Map Handicap (-1.5 / +1.5)' },
      { key: 'total_maps', title: 'Total Maps (Over/Under 2.5)' },
      { key: 'first_map_winner', title: 'First Map Winner' },
      { key: 'map2_winner', title: 'Map 2 Winner' },
      { key: 'map3_winner', title: 'Map 3 Winner' },
      { key: 'first_blood', title: 'First Blood' },
      { key: 'first_to_5_rounds', title: 'First to 5 Rounds (Current Map)' },
      { key: 'correct_map_score', title: 'Correct Map Score (2-0 or 2-1)' },
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
          <span className="rounded bg-[#111827] px-2 py-1 text-[11px] font-semibold text-[#00C37B]">{event.gameTag ?? 'CS2'}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex justify-end">
            <TeamLogo name={event.homeTeam.name} hue={182} />
          </div>

          <div className="rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-6 py-3 text-center">
            <div className="font-mono text-[28px] font-bold text-white">
              {event.mapScore?.home ?? 1} — {event.mapScore?.away ?? 0}
            </div>
            {event.currentMap && <div className="mt-1 text-xs text-[#94A3B8]">{event.currentMap}</div>}
            {event.roundCounter && <div className="mt-1 text-xs font-mono text-[#64748B]">{event.roundCounter}</div>}
          </div>

          <div>
            <TeamLogo name={event.awayTeam.name} hue={12} />
          </div>
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

export default function EsportsMatchPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params?.eventId ?? '';
  const [event, setEvent] = useState<EsportsEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setError(null);

    try {
      const res = await apiGet<EventMarketsResponse | EsportsEvent>(`/api/sports/events/${eventId}/markets`);
      if (!res.success || !res.data) {
        setError('No esports event data available');
        return;
      }

      const payload = res.data as EventMarketsResponse | EsportsEvent;
      const normalized = 'event' in payload ? { ...payload.event, markets: payload.markets ?? [] } : payload;

      setEvent((prev) => ({
        ...(prev ?? {}),
        ...normalized,
        id: String(normalized.id ?? eventId),
        league: normalized.league || 'Esports',
        status: normalized.status || 'upcoming',
        markets: normalized.markets ?? [],
      } as EsportsEvent));
    } catch {
      try {
        const uncachedEventsUrl = `/api/sports/esports/events?ts=${Date.now()}`;
        const listRes = await apiGet<Array<{ id: number | string }>>(uncachedEventsUrl, {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        const first = listRes.data?.[0];
        if (first && String(first.id) !== String(eventId)) {
          router.replace(`/sports/esports/${first.id}`);
          return;
        }
      } catch {
        // Ignore fallback error.
      }
      setError('No live esports events right now. Check back later.');
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEventSocket(eventId, {
    onEventUpdate: (data: Partial<EsportsEvent>) => {
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
      <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4 text-[#94A3B8]">Loading esports event...</div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-sm">
          <div className="mb-3 text-3xl">&#x1F3AE;</div>
          <div className="font-semibold text-white">No live esports events right now</div>
          <div className="mt-2 text-sm text-[#94A3B8]">Check back later for live matches and betting markets.</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/sports/esports" className="rounded border border-[#1E293B] px-3 py-2 text-sm text-[#CBD5E1] hover:border-[#00C37B]">
            Back to Esports
          </Link>
          <BalanceBadge />
        </div>
        <MatchCard event={event} eventId={Number(eventId)} />
      </div>
    </main>
  );
}
