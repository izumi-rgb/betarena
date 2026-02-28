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

function MatchCard({ event, onPick, picks, eventId }: { event: BasketballEvent; onPick: (pick: BetPick) => void; picks: BetPick[]; eventId: number }) {
  const stats = event.stats ?? {
    fgPercent: [49, 46],
    threePtPercent: [38, 35],
    rebounds: [42, 39],
    assists: [21, 18],
    turnovers: [11, 13],
  };

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

  const defaultSelections: Record<string, MarketSelection[]> = {
    match_winner_ot: [
      { id: 'mw_home', name: event.homeTeam.name, odds: 1.80 },
      { id: 'mw_away', name: event.awayTeam.name, odds: 2.00 },
    ],
    point_spread: [-3.5, -1.5, 1.5, 3.5].flatMap((line, idx) => [
      { id: `ps_h_${idx}`, name: `${event.homeTeam.name} ${line > 0 ? '+' : ''}${line}`, odds: 1.90 },
      { id: `ps_a_${idx}`, name: `${event.awayTeam.name} ${line > 0 ? '+' : ''}${line}`, odds: 1.90 },
    ]),
    total_points_ou: [215.5, 220.5, 224.5, 228.5].flatMap((line) => [
      { id: `tpo_${line}`, name: `Over ${line}`, odds: 1.90 },
      { id: `tpu_${line}`, name: `Under ${line}`, odds: 1.90 },
    ]),
    moneyline: [
      { id: 'ml_home', name: event.homeTeam.name, odds: 1.82 },
      { id: 'ml_away', name: event.awayTeam.name, odds: 1.98 },
    ],
    first_quarter_winner: [
      { id: 'fq_home', name: event.homeTeam.name, odds: 1.87 },
      { id: 'fq_away', name: event.awayTeam.name, odds: 1.93 },
    ],
    first_half_winner: [
      { id: 'fh_home', name: event.homeTeam.name, odds: 1.85 },
      { id: 'fh_away', name: event.awayTeam.name, odds: 1.95 },
    ],
    each_quarter_winner: [
      { id: 'eq_q1_home', name: 'Q1 Home', odds: 1.88 },
      { id: 'eq_q1_away', name: 'Q1 Away', odds: 1.92 },
      { id: 'eq_q2_home', name: 'Q2 Home', odds: 1.86 },
      { id: 'eq_q2_away', name: 'Q2 Away', odds: 1.94 },
      { id: 'eq_q3_home', name: 'Q3 Home', odds: 1.91 },
      { id: 'eq_q3_away', name: 'Q3 Away', odds: 1.89 },
      { id: 'eq_q4_home', name: 'Q4 Home', odds: 1.90 },
      { id: 'eq_q4_away', name: 'Q4 Away', odds: 1.90 },
    ],
    first_half_total_points: [108.5, 112.5].flatMap((line) => [
      { id: `fhp_o_${line}`, name: `Over ${line}`, odds: 1.90 },
      { id: `fhp_u_${line}`, name: `Under ${line}`, odds: 1.90 },
    ]),
    winning_margin: [
      { id: 'wm_1_5', name: '1-5', odds: 5.50 },
      { id: 'wm_6_10', name: '6-10', odds: 4.20 },
      { id: 'wm_11_15', name: '11-15', odds: 6.00 },
      { id: 'wm_16_plus', name: '16+', odds: 7.80 },
    ],
    player_points_ou: [
      { id: 'pp_1_o', name: 'Player 1 Over 24.5', odds: 1.87 },
      { id: 'pp_1_u', name: 'Player 1 Under 24.5', odds: 1.93 },
      { id: 'pp_2_o', name: 'Player 2 Over 21.5', odds: 1.85 },
      { id: 'pp_2_u', name: 'Player 2 Under 21.5', odds: 1.95 },
      { id: 'pp_3_o', name: 'Player 3 Over 18.5', odds: 1.92 },
      { id: 'pp_3_u', name: 'Player 3 Under 18.5', odds: 1.88 },
      { id: 'pp_4_o', name: 'Player 4 Over 15.5', odds: 1.90 },
      { id: 'pp_4_u', name: 'Player 4 Under 15.5', odds: 1.90 },
      { id: 'pp_5_o', name: 'Player 5 Over 12.5', odds: 1.94 },
      { id: 'pp_5_u', name: 'Player 5 Under 12.5', odds: 1.86 },
    ],
    player_assists_ou: [
      { id: 'pa_1_o', name: 'Player 1 Over 6.5', odds: 1.88 },
      { id: 'pa_1_u', name: 'Player 1 Under 6.5', odds: 1.92 },
      { id: 'pa_2_o', name: 'Player 2 Over 4.5', odds: 1.90 },
      { id: 'pa_2_u', name: 'Player 2 Under 4.5', odds: 1.90 },
    ],
    player_rebounds_ou: [
      { id: 'pr_1_o', name: 'Player 1 Over 9.5', odds: 1.86 },
      { id: 'pr_1_u', name: 'Player 1 Under 9.5', odds: 1.94 },
      { id: 'pr_2_o', name: 'Player 2 Over 7.5', odds: 1.89 },
      { id: 'pr_2_u', name: 'Player 2 Under 7.5', odds: 1.91 },
    ],
    race_to_points: [
      { id: 'r10_home', name: `${event.homeTeam.name} to 10`, odds: 1.83 },
      { id: 'r10_away', name: `${event.awayTeam.name} to 10`, odds: 1.97 },
      { id: 'r20_home', name: `${event.homeTeam.name} to 20`, odds: 1.85 },
      { id: 'r20_away', name: `${event.awayTeam.name} to 20`, odds: 1.95 },
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
            <div className="inline-flex items-center gap-2 text-xl font-bold text-white">{event.homeTeam.name}</div>
          </div>

          <div className="rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-6 py-3 text-center">
            <div className="font-mono text-[28px] font-bold text-white">
              {event.score?.home ?? 78} — {event.score?.away ?? 71}
            </div>
            <div className="mt-1 font-mono text-sm text-[#94A3B8]">
              {event.period ?? 'Q3'} • {event.clock ?? '8:42'}
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

export default function BasketballMatchPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params?.eventId ?? '';
  const [event, setEvent] = useState<BasketballEvent | null>(null);
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
        status: normalized.status || 'live',
        score: normalized.score ?? { home: 78, away: 71 },
        period: normalized.period ?? 'Q3',
        clock: normalized.clock ?? '8:42',
        stats: normalized.stats ?? {
          fgPercent: [49, 46],
          threePtPercent: [38, 35],
          rebounds: [42, 39],
          assists: [21, 18],
          turnovers: [11, 13],
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

  useEffect(() => {
    setPicks(sharedPicks as BetPick[]);
  }, [sharedPicks]);

  useEffect(() => {
    if (!eventId) return;

    connectSocket(typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined);
    joinEventRoom(eventId);
    const socket = getSocket();

    const onEventUpdate = (data: Partial<BasketballEvent>) => {
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
      <div className="flex h-screen items-center justify-center bg-[#0B0E1A] text-[#94A3B8]">Loading basketball event...</div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0E1A] px-6 text-center text-[#EF4444]">
        {error ?? 'Basketball event not found'}
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
