'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

type BetSelection = {
  selection_name?: string;
  market_type?: string;
  odds_at_placement?: number;
  odds?: number;
};

type UserBet = {
  id: number;
  bet_uid: string;
  type: string;
  status: string;
  stake: number | string;
  potential_win: number | string;
  actual_win?: number | string | null;
  created_at: string;
  selections: string | BetSelection[];
  cashout_offer?: number;
  cashout_available?: boolean;
};

type BetsResponse = {
  bets: UserBet[];
  total: number;
  page: number;
  limit: number;
};

type BetStats = {
  totalBets: number;
  won: number;
  lost: number;
  open: number;
  winRate: number;
  biggestWin: number;
  totalPnl: number;
};

const STATUS_FILTERS = [
  { label: 'All Bets', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Cashout', value: 'cashout' },
];

function parseAmount(value: number | string | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCredits(value: number | string | null | undefined): string {
  return `${parseAmount(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CR`;
}

function normalizeSelections(rawSelections: UserBet['selections']): BetSelection[] {
  if (!rawSelections) return [];
  if (typeof rawSelections === 'string') {
    try {
      const parsed = JSON.parse(rawSelections);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(rawSelections) ? rawSelections : [];
}

async function fetchMyBets(status: string): Promise<BetsResponse> {
  const query = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
  const res = await apiGet<BetsResponse>(`/api/bets/my-bets${query}`);
  return res.data || { bets: [], total: 0, page: 1, limit: 50 };
}

async function fetchBetStats(): Promise<BetStats> {
  const res = await apiGet<BetStats>('/api/bets/stats');
  return res.data || {
    totalBets: 0,
    won: 0,
    lost: 0,
    open: 0,
    winRate: 0,
    biggestWin: 0,
    totalPnl: 0,
  };
}

function statusTone(status: string): string {
  switch (status) {
    case 'won':
      return 'text-[#00C37B]';
    case 'lost':
      return 'text-[#EF4444]';
    case 'cashout':
      return 'text-[#F59E0B]';
    default:
      return 'text-[#94A3B8]';
  }
}

export default function MyBetsPage() {
  const [status, setStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: betsData, isLoading, error } = useQuery({
    queryKey: ['bets', 'my-bets', status],
    queryFn: () => fetchMyBets(status),
  });

  const { data: stats } = useQuery({
    queryKey: ['bets', 'stats'],
    queryFn: fetchBetStats,
  });

  const cashoutMutation = useMutation({
    mutationFn: async (betUid: string) => {
      const res = await apiPost(`/api/bets/${betUid}/cashout`, {});
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bets', 'my-bets'] });
      void queryClient.invalidateQueries({ queryKey: ['bets', 'stats'] });
    },
  });

  const rows = useMemo(() => {
    const sourceBets = betsData?.bets || [];
    return sourceBets.map((bet) => {
      const selections = normalizeSelections(bet.selections);
      const selectionLabel = selections.length === 0
        ? 'No selections'
        : selections.map((selection) => selection.selection_name || 'Selection').join(', ');
      const oddsLabel = selections.length === 0
        ? '—'
        : selections
          .map((selection) => parseAmount(selection.odds_at_placement ?? selection.odds).toFixed(2))
          .join(' x ');

      return {
        ...bet,
        selectionLabel,
        oddsLabel,
      };
    });
  }, [betsData?.bets]);

  return (
    <div className="min-h-screen bg-[#0B0E1A] px-4 pb-24 pt-5 text-white md:px-6 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-white">My Bets</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">Open, settled, and cashed-out bets on your account.</p>
        </header>

        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4">
            <div className="text-[11px] uppercase tracking-wide text-[#64748B]">Total Bets</div>
            <div className="mt-2 text-2xl font-bold text-white">{stats?.totalBets ?? 0}</div>
          </div>
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4">
            <div className="text-[11px] uppercase tracking-wide text-[#64748B]">Open Bets</div>
            <div className="mt-2 text-2xl font-bold text-[#F59E0B]">{stats?.open ?? 0}</div>
          </div>
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4">
            <div className="text-[11px] uppercase tracking-wide text-[#64748B]">Win Rate</div>
            <div className="mt-2 text-2xl font-bold text-[#00C37B]">{(stats?.winRate ?? 0).toFixed(1)}%</div>
          </div>
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-4">
            <div className="text-[11px] uppercase tracking-wide text-[#64748B]">Biggest Win</div>
            <div className="mt-2 text-2xl font-bold text-white">{formatCredits(stats?.biggestWin)}</div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatus(filter.value)}
              className={`rounded-full px-3 py-1.5 text-xs ${
                status === filter.value
                  ? 'bg-[#00C37B] text-[#0B0E1A]'
                  : 'bg-[#1A2235] text-[#94A3B8] hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-6 text-center text-sm text-[#94A3B8]">
            Loading bets…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#7F1D1D] bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">
            Failed to load bets. Please try again.
          </div>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#1E293B] bg-[#111827] p-12 text-center text-[#94A3B8]">
            <div className="mb-3 text-4xl">🎟️</div>
            <div className="font-semibold text-white">No bets found</div>
            <div className="mt-1 text-sm">Placed bets will appear here once you submit a slip.</div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[#1E293B] bg-[#111827]">
            <div className="grid grid-cols-[1fr_120px_130px_130px_120px_130px] gap-3 border-b border-[#1E293B] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              <div>Bet</div>
              <div>Type</div>
              <div className="text-right">Stake</div>
              <div className="text-right">Potential</div>
              <div>Status</div>
              <div className="text-right">Action</div>
            </div>
            {rows.map((bet) => (
              <div
                key={bet.id}
                className="grid grid-cols-[1fr_120px_130px_130px_120px_130px] gap-3 border-b border-[#1E293B] px-4 py-3 text-sm last:border-b-0 hover:bg-[#1A2235]/40"
              >
                <div className="min-w-0">
                  <div className="font-medium text-white">{bet.bet_uid}</div>
                  <div className="truncate text-[#94A3B8]">{bet.selectionLabel}</div>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {new Date(bet.created_at).toLocaleString()} · Odds {bet.oddsLabel}
                  </div>
                </div>
                <div className="text-[#94A3B8]">{bet.type}</div>
                <div className="text-right font-mono text-white">{formatCredits(bet.stake)}</div>
                <div className="text-right font-mono text-[#F59E0B]">{formatCredits(bet.potential_win)}</div>
                <div className={`font-semibold uppercase ${statusTone(bet.status)}`}>{bet.status}</div>
                <div className="text-right">
                  {bet.status === 'open' && bet.cashout_available ? (
                    <button
                      onClick={() => cashoutMutation.mutate(bet.bet_uid)}
                      disabled={cashoutMutation.isPending}
                      className="rounded-lg bg-[#00C37B] px-3 py-2 text-xs font-bold text-[#0B0E1A] disabled:opacity-50"
                    >
                      {cashoutMutation.isPending ? 'Processing...' : `Cashout ${formatCredits(bet.cashout_offer)}`}
                    </button>
                  ) : (
                    <span className="font-mono text-xs text-[#94A3B8]">
                      {bet.status === 'won' || bet.status === 'cashout'
                        ? formatCredits(bet.actual_win || bet.cashout_offer)
                        : bet.status === 'lost'
                          ? '0.00 CR'
                          : '—'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
