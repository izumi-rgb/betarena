'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { connectSocket, getSocket, joinEventRoom, leaveEventRoom } from '@/lib/socket';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { useAuthStore } from '@/stores/authStore';

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
  market: string;
  selection: string;
  odds: number;
};

const MEMBER_NAV_LINKS = [
  { href: '/sports', label: 'Sports' },
  { href: '/in-play', label: 'In-Play' },
  { href: '/live', label: 'Live Stream' },
  { href: '/my-bets', label: 'My Bets' },
  { href: '/results', label: 'Results' },
  { href: '/account', label: 'Account' },
];

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#EF4444]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#EF4444]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" /> Live
    </span>
  );
}

function OddsButton({
  label,
  odds,
  active,
  onClick,
  disabled,
}: {
  label: string;
  odds: number;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-2 py-2 text-center transition-all ${
        disabled
          ? 'cursor-not-allowed border-[#1E293B] bg-[#0B0E1A]/40 text-[#64748B]'
          : active
            ? 'border-[#00C37B] bg-[#00C37B]/15 text-[#00C37B]'
            : 'border-[#1E293B] bg-[#0B0E1A] text-white hover:border-[#00C37B]/60'
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</div>
      <div className="mt-0.5 font-mono text-[15px] font-bold text-[#F59E0B]">{odds.toFixed(2)}</div>
    </button>
  );
}

function StatCard({ label, home, away }: { label: string; home: number; away: number }) {
  return (
    <div className="rounded-lg border border-[#1E293B] bg-[#111827] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-[#64748B]">{label}</div>
      <div className="mt-1 flex items-center justify-between font-mono text-sm font-bold text-white">
        <span>{home}</span>
        <span className="text-[#334155]">|</span>
        <span>{away}</span>
      </div>
    </div>
  );
}

function MarketAccordion({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-[#1E293B] bg-[#1A2235]">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-[#94A3B8]">{open ? '−' : '+'}</span>
      </button>
      {open ? <div className="border-t border-[#1E293B] p-3">{children}</div> : null}
    </div>
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

function MatchCard({ event, onPick, picks }: { event: TennisEvent; onPick: (pick: BetPick) => void; picks: BetPick[] }) {
  const servingHome = event.serving === 'home';
  const servingAway = event.serving === 'away';
  const stats = event.stats ?? {
    aces: [11, 8],
    doubleFaults: [3, 5],
    breakPoints: [4, 2],
    winners: [27, 22],
  };

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

  const defaultSelections: Record<string, MarketSelection[]> = {
    match_winner: [
      { id: 'mw_home', name: event.homeTeam.name, odds: 1.72 },
      { id: 'mw_away', name: event.awayTeam.name, odds: 2.10 },
    ],
    set_betting: [
      { id: 'sb_20', name: `${event.homeTeam.name} 2-0`, odds: 2.95 },
      { id: 'sb_21', name: `${event.homeTeam.name} 2-1`, odds: 3.55 },
      { id: 'sb_02', name: `${event.awayTeam.name} 0-2`, odds: 3.80 },
      { id: 'sb_12', name: `${event.awayTeam.name} 1-2`, odds: 3.10 },
    ],
    total_games_ou: [19.5, 20.5, 21.5, 22.5, 23.5].flatMap((line) => [
      { id: `tgo_${line}`, name: `Over ${line}`, odds: 1.90 },
      { id: `tgu_${line}`, name: `Under ${line}`, odds: 1.90 },
    ]),
    games_handicap: [-3.5, -2.5, -1.5, 1.5, 2.5, 3.5].map((h, i) => ({
      id: `gh_${i}`,
      name: `${h > 0 ? '+' : ''}${h} ${h < 0 ? event.homeTeam.name : event.awayTeam.name}`,
      odds: 1.95,
    })),
    first_set_winner: [
      { id: 'fs_home', name: event.homeTeam.name, odds: 1.80 },
      { id: 'fs_away', name: event.awayTeam.name, odds: 2.00 },
    ],
    each_set_winner: [
      { id: 'es1_home', name: 'Set 1 - Home', odds: 1.82 },
      { id: 'es1_away', name: 'Set 1 - Away', odds: 1.98 },
      { id: 'es2_home', name: 'Set 2 - Home', odds: 1.84 },
      { id: 'es2_away', name: 'Set 2 - Away', odds: 1.96 },
      { id: 'es3_home', name: 'Set 3 - Home', odds: 2.02 },
      { id: 'es3_away', name: 'Set 3 - Away', odds: 1.78 },
    ],
    correct_score_sets: [
      { id: 'cs_20', name: '2-0', odds: 2.95 },
      { id: 'cs_21', name: '2-1', odds: 3.45 },
      { id: 'cs_02', name: '0-2', odds: 3.60 },
      { id: 'cs_12', name: '1-2', odds: 3.20 },
    ],
    any_set_to_nil: [
      { id: 'asn_yes', name: 'Yes', odds: 2.05 },
      { id: 'asn_no', name: 'No', odds: 1.75 },
    ],
    tournament_outright: [
      { id: 'to_home', name: event.homeTeam.name, odds: 7.50 },
      { id: 'to_away', name: event.awayTeam.name, odds: 9.00 },
      { id: 'to_other1', name: 'Player C', odds: 11.00 },
      { id: 'to_other2', name: 'Player D', odds: 14.00 },
    ],
  };

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
              {event.sets?.home ?? 2} — {event.sets?.away ?? 1}
            </div>
            <div className="mt-1 font-mono text-sm text-[#94A3B8]">
              {event.gameScore?.home ?? '40'} — {event.gameScore?.away ?? '30'}
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
        const selections = m?.selections?.length ? m.selections : defaultSelections[g.key] ?? [];
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
                    onClick={() => onPick({ id: s.id, market: g.title, selection: s.name, odds: s.odds })}
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
        status: normalized.status || 'live',
        sets: normalized.sets ?? { home: 2, away: 1 },
        gameScore: normalized.gameScore ?? { home: '40', away: '30' },
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

  useEffect(() => {
    if (!eventId) return;

    connectSocket(typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined);
    joinEventRoom(eventId);
    const socket = getSocket();

    const onEventUpdate = (data: Partial<TennisEvent>) => {
      setEvent((prev) => (prev ? ({ ...prev, ...data }) : prev));
    };

    const onOddsUpdate = (data: { marketId?: string; markets?: Array<{ marketId?: string; selections: MarketSelection[] }> }) => {
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
    };

    socket.on('event:update', onEventUpdate);
    socket.on('odds:update', onOddsUpdate);

    return () => {
      leaveEventRoom(eventId);
      socket.off('event:update', onEventUpdate);
      socket.off('odds:update', onOddsUpdate);
    };
  }, [eventId]);

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
            <MatchCard event={event} onPick={handlePick} picks={picks} />
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
