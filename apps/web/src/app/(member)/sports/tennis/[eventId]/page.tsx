'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { useAuthStore } from '@/stores/authStore';
import { SportSidebar, TopHeader } from '@/components/app/SportSidebar';
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

type BetPick = {
  id: string;
  eventId: number;
  market: string;
  marketType: string;
  selection: string;
  odds: number;
};

function MatchCard({ event, onPick, picks, eventId }: { event: TennisEvent; onPick: (pick: BetPick) => void; picks: BetPick[]; eventId: number }) {
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
                const active = picks.some((p) => p.id === s.id);
                return (
                  <OddsButton
                    key={s.id}
                    label={s.name}
                    odds={s.odds}
                    active={active}
                    disabled={s.suspended}
                    onClick={() => onPick({ id: s.id, eventId, market: g.title, marketType: g.key, selection: s.name, odds: s.odds })}
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

function BetSlip({ picks, onRemove }: { picks: BetPick[]; onRemove: (id: string) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const totalOdds = picks.reduce((acc, p) => acc * p.odds, 1);
  const [stake, setStake] = useState('10');
  const stakeNum = Number(stake) || 0;

  return (
    <aside className="w-[320px] shrink-0 border-l border-[#1E293B] bg-[#111827] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Bet Slip</h3>
        <span className="rounded bg-[#1A2235] px-2 py-1 text-xs text-[#94A3B8]">{picks.length} picks</span>
      </div>

      <div className="space-y-2">
        {picks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#1E293B] p-4 text-center text-sm text-[#64748B]">Select odds to add bet picks</div>
        ) : (
          picks.map((p) => (
            <div key={p.id} className="rounded-lg border border-[#1E293B] bg-[#1A2235] p-3">
              <div className="text-xs text-[#94A3B8]">{p.market}</div>
              <div className="mt-1 text-sm font-semibold text-white">{p.selection}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-sm text-[#F59E0B]">{p.odds.toFixed(2)}</span>
                <button onClick={() => onRemove(p.id)} className="text-xs text-[#EF4444] hover:text-[#ff6b6b]">Remove</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 border-t border-[#1E293B] pt-4">
        <label className="mb-1 block text-xs text-[#94A3B8]">Stake</label>
        <input
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          className="w-full rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-2 font-mono text-white"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-[#94A3B8]">
          <span>Total Odds</span>
          <span className="font-mono text-white">{picks.length ? totalOdds.toFixed(2) : '0.00'}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-[#94A3B8]">
          <span>Potential Return</span>
          <span className="font-mono text-[#00C37B]">{(stakeNum * (picks.length ? totalOdds : 0)).toFixed(2)}</span>
        </div>
        <button
          onClick={() => {
            if (!isAuthenticated) {
              const next = encodeURIComponent(pathname || '/sports');
              router.push(`/login?next=${next}`);
              return;
            }
          }}
          className="mt-3 w-full rounded-lg bg-[#00C37B] py-2.5 text-sm font-bold text-[#0B0E1A] hover:bg-[#00b974] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!picks.length}
        >
          Place Bet
        </button>
      </div>
    </aside>
  );
}

export default function TennisMatchPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params?.eventId ?? '';
  const [event, setEvent] = useState<TennisEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picks, setPicks] = useState<BetPick[]>([]);
  const sharedPicks = useBetSlipStore((s) => s.picks);
  const toggleSharedPick = useBetSlipStore((s) => s.togglePick);
  const removeSharedPick = useBetSlipStore((s) => s.removePick);

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

  useEffect(() => {
    setPicks(sharedPicks as BetPick[]);
  }, [sharedPicks]);

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

  const handlePick = (pick: BetPick) => {
    setPicks((prev) => (prev.some((p) => p.id === pick.id) ? prev.filter((p) => p.id !== pick.id) : [...prev, pick]));
    toggleSharedPick(pick);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0E1A] text-[#94A3B8]">Loading tennis event...</div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0E1A] px-6 text-center text-[#EF4444]">
        {error ?? 'Tennis event not found'}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0E1A] text-[#F1F5F9]">
      <SportSidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <TopHeader />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <MatchCard event={event} onPick={handlePick} picks={picks} eventId={Number(eventId)} />
          </div>
          <BetSlip picks={picks} onRemove={(id) => {
            setPicks((prev) => prev.filter((p) => p.id !== id));
            removeSharedPick(id);
          }} />
        </div>
      </main>
    </div>
  );
}
