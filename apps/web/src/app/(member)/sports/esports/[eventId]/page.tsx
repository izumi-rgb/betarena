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

type BetPick = {
  id: string;
  eventId: number;
  market: string;
  marketType: string;
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

function MatchCard({ event, onPick, picks, eventId }: { event: EsportsEvent; onPick: (pick: BetPick) => void; picks: BetPick[]; eventId: number }) {
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

  const defaultSelections: Record<string, MarketSelection[]> = {
    match_winner: [
      { id: 'mw_home', name: event.homeTeam.name, odds: 1.72 },
      { id: 'mw_away', name: event.awayTeam.name, odds: 2.08 },
    ],
    map_handicap: [
      { id: 'mh_h', name: `${event.homeTeam.name} -1.5`, odds: 2.40 },
      { id: 'mh_a', name: `${event.awayTeam.name} +1.5`, odds: 1.58 },
      { id: 'mh_h2', name: `${event.homeTeam.name} +1.5`, odds: 1.52 },
      { id: 'mh_a2', name: `${event.awayTeam.name} -1.5`, odds: 2.55 },
    ],
    total_maps: [
      { id: 'tm_o', name: 'Over 2.5', odds: 1.95 },
      { id: 'tm_u', name: 'Under 2.5', odds: 1.85 },
    ],
    first_map_winner: [
      { id: 'm1_h', name: event.homeTeam.name, odds: 1.81 },
      { id: 'm1_a', name: event.awayTeam.name, odds: 1.99 },
    ],
    map2_winner: [
      { id: 'm2_h', name: event.homeTeam.name, odds: 1.84 },
      { id: 'm2_a', name: event.awayTeam.name, odds: 1.96 },
    ],
    map3_winner: [
      { id: 'm3_h', name: event.homeTeam.name, odds: 1.88 },
      { id: 'm3_a', name: event.awayTeam.name, odds: 1.92 },
    ],
    first_blood: [
      { id: 'fb_h', name: event.homeTeam.name, odds: 1.90 },
      { id: 'fb_a', name: event.awayTeam.name, odds: 1.90 },
    ],
    first_to_5_rounds: [
      { id: 'r5_h', name: event.homeTeam.name, odds: 1.87 },
      { id: 'r5_a', name: event.awayTeam.name, odds: 1.93 },
    ],
    correct_map_score: [
      { id: 'cms_20', name: `${event.homeTeam.name} 2-0`, odds: 3.20 },
      { id: 'cms_21', name: `${event.homeTeam.name} 2-1`, odds: 3.55 },
      { id: 'cms_02', name: `${event.awayTeam.name} 0-2`, odds: 3.45 },
      { id: 'cms_12', name: `${event.awayTeam.name} 1-2`, odds: 3.30 },
    ],
    tournament_outright: [
      { id: 'to_h', name: event.homeTeam.name, odds: 4.80 },
      { id: 'to_a', name: event.awayTeam.name, odds: 5.20 },
      { id: 'to_c', name: 'Team C', odds: 6.00 },
      { id: 'to_d', name: 'Team D', odds: 7.40 },
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
            <div className="mt-1 text-xs text-[#94A3B8]">{event.currentMap ?? 'Map 2: Mirage'}</div>
            <div className="mt-1 text-xs font-mono text-[#64748B]">{event.roundCounter ?? 'Round 14 of 30'}</div>
          </div>

          <div>
            <TeamLogo name={event.awayTeam.name} hue={12} />
          </div>
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

export default function EsportsMatchPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params?.eventId ?? '';
  const [event, setEvent] = useState<EsportsEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picks, setPicks] = useState<BetPick[]>([]);
  const sharedPicks = useBetSlipStore((s) => s.picks);
  const toggleSharedPick = useBetSlipStore((s) => s.togglePick);
  const removeSharedPick = useBetSlipStore((s) => s.removePick);

  const buildFallbackEvent = useCallback(
    (id: string): EsportsEvent => ({
      id: id || 'demo',
      league: 'ESL Pro League',
      startTime: new Date().toISOString(),
      status: 'live',
      homeTeam: { name: 'FaZe Clan', abbr: 'FAZ' },
      awayTeam: { name: 'NAVI', abbr: 'NAV' },
      mapScore: { home: 1, away: 0 },
      currentMap: 'Map 2: Mirage',
      roundCounter: 'Round 14 of 30',
      gameTag: 'CS2',
      markets: [],
    }),
    [],
  );

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setError(null);

    try {
      const res = await apiGet<EventMarketsResponse | EsportsEvent>(`/api/sports/events/${eventId}/markets`);
      if (!res.success || !res.data) {
        setEvent(buildFallbackEvent(eventId));
        return;
      }

      const payload = res.data as EventMarketsResponse | EsportsEvent;
      const normalized = 'event' in payload ? { ...payload.event, markets: payload.markets ?? [] } : payload;

      setEvent((prev) => ({
        ...(prev ?? {}),
        ...normalized,
        id: String(normalized.id ?? eventId),
        league: normalized.league || 'ESL Pro League',
        status: normalized.status || 'live',
        mapScore: normalized.mapScore ?? { home: 1, away: 0 },
        currentMap: normalized.currentMap ?? 'Map 2: Mirage',
        roundCounter: normalized.roundCounter ?? 'Round 14 of 30',
        gameTag: normalized.gameTag ?? 'CS2',
        homeTeam: normalized.homeTeam ?? { name: 'FaZe Clan', abbr: 'FAZ' },
        awayTeam: normalized.awayTeam ?? { name: 'NAVI', abbr: 'NAV' },
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
      setEvent(buildFallbackEvent(eventId));
      setError('Using demo esports data');
    } finally {
      setLoading(false);
    }
  }, [buildFallbackEvent, eventId, router]);

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

    const onEventUpdate = (data: Partial<EsportsEvent>) => {
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
      <div className="flex h-screen items-center justify-center bg-[#0B0E1A] text-[#94A3B8]">Loading esports event...</div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0E1A] px-6 text-center text-[#EF4444]">
        {error ?? 'Esports event not found'}
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
            {error ? <div className="mb-3 text-xs text-[#94A3B8]">{error}</div> : null}
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
