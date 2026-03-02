'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { connectSocket, getSocket, joinEventRoom, leaveEventRoom } from '@/lib/socket';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { useAuthStore } from '@/stores/authStore';
import { SportSidebar, TopHeader } from '@/components/app/SportSidebar';

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

type BetPick = {
  id: string;
  eventId: number;
  market: string;
  marketType: string;
  selection: string;
  odds: number;
};

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

function trendArrow(trend: LeaderboardRow['trend']) {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

function scoreClass(score: number) {
  if (score < 70) return 'text-[#EF4444]';
  if (score > 72) return 'text-[#0F172A]';
  return 'text-[#E2E8F0]';
}

function BetSlip({ picks, onRemove }: { picks: BetPick[]; onRemove: (id: string) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const totalOdds = picks.reduce((acc, p) => acc * p.odds, 1);
  const [stake, setStake] = useState('10');
  const stakeNum = Number(stake) || 0;

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4">
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
    </div>
  );
}

export default function GolfTournamentPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params?.eventId ?? '';

  const [event, setEvent] = useState<GolfEvent | null>(null);
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

  useEffect(() => {
    setPicks(sharedPicks as BetPick[]);
  }, [sharedPicks]);

  useEffect(() => {
    if (!eventId) return;

    connectSocket(typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined);
    joinEventRoom(eventId);
    const socket = getSocket();

    const onEventUpdate = (data: Partial<GolfEvent>) => {
      setEvent((prev) => (prev ? { ...prev, ...data } : prev));
    };

    const onOddsUpdate = (data: { markets?: Array<{ marketId?: string; selections: MarketSelection[] }> }) => {
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
    };

    socket.on('event:update', onEventUpdate);
    socket.on('odds:update', onOddsUpdate);

    return () => {
      leaveEventRoom(eventId);
      socket.off('event:update', onEventUpdate);
      socket.off('odds:update', onOddsUpdate);
    };
  }, [eventId]);

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
    return <div className="flex h-screen items-center justify-center bg-[#0B0E1A] text-[#94A3B8]">Loading golf tournament...</div>;
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0E1A] px-6 text-center">
        <div className="max-w-sm">
          <div className="mb-3 text-3xl">⛳</div>
          <div className="font-semibold text-white">No live golf tournaments right now</div>
          <div className="mt-2 text-sm text-[#94A3B8]">Check back later for live tournaments and betting markets.</div>
        </div>
      </div>
    );
  }

  const leaderboard = event.leaderboard ?? [];
  const top3 = leaderboard.slice(0, 3);
  const marketByType = new Map((event.markets ?? []).map((m) => [m.type || m.name.toLowerCase().replace(/\s+/g, '_'), m]));

  const addPick = (pick: BetPick) => {
    setPicks((prev) => (prev.some((p) => p.id === pick.id) ? prev.filter((p) => p.id !== pick.id) : [...prev, pick]));
    toggleSharedPick(pick);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0E1A] text-[#F1F5F9]">
      <SportSidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <TopHeader />

        <div className="flex-1 overflow-y-auto p-6">
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
                      leaderboard.map((row) => (
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
                              active={picks.some((p) => p.id === `lb_${row.id}`)}
                              onClick={() => addPick({ id: `lb_${row.id}`, eventId: Number(eventId), market: 'Tournament Winner', marketType: 'tournament_winner', selection: row.player, odds: row.odds })}
                            />
                          </td>
                        </tr>
                      ))
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
                      {selections.map((s) => (
                        <OddsButton
                          key={s.id}
                          label={s.name}
                          odds={s.odds}
                          active={picks.some((p) => p.id === s.id)}
                          disabled={s.suspended}
                          onClick={() => addPick({ id: s.id, eventId: Number(eventId), market: g.title, marketType: g.key, selection: s.name, odds: s.odds })}
                        />
                      ))}
                    </div>
                  </MarketAccordion>
                );
              })}

              <BetSlip picks={picks} onRemove={(id) => {
                setPicks((prev) => prev.filter((p) => p.id !== id));
                removeSharedPick(id);
              }} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
