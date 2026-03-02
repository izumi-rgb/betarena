'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

type MemberRow = {
  id: number;
  display_id?: string;
  username?: string;
  balance?: number | string;
  is_active?: boolean;
  open_bets?: number;
};
type TxRow = { id: number; amount: number | string; type: string; created_at?: string };
type BetRow = { id: number; amount: number | string; potential_win?: number | string; status?: string; sport?: string };
type TransactionsEnvelope = { transactions: TxRow[] };
type BetsEnvelope = { bets: BetRow[] };

function parseAmount(value: number | string | undefined): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}
function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AgentReportsPage() {
  const [search, setSearch] = useState('');

  const membersQuery = useQuery({
    queryKey: ['agent', 'reports', 'members'],
    queryFn: () => apiGet<MemberRow[]>('/api/agents/members').then((r) => r.data || []),
  });
  const transactionsQuery = useQuery({
    queryKey: ['agent', 'reports', 'transactions'],
    queryFn: () =>
      apiGet<TransactionsEnvelope>('/api/credits/transactions?page=1&limit=200').then(
        (r) => r.data?.transactions || [],
      ),
  });

  const report = useMemo(() => {
    const members = membersQuery.data || [];
    const transactions = transactionsQuery.data || [];

    const transfers = transactions.filter((t) => t.type === 'transfer');
    const creditsDistributed = transfers.reduce((s, t) => s + Math.abs(parseAmount(t.amount)), 0);
    const memberWinnings = members.reduce((s) => s + 0, 0); // Would need bets data
    const memberLosses = 0; // Would need bets data
    const netPnl = creditsDistributed - memberWinnings;

    return { creditsDistributed, memberWinnings, memberLosses, netPnl, memberCount: members.length };
  }, [membersQuery.data, transactionsQuery.data]);

  const members = membersQuery.data || [];
  const filtered = search
    ? members.filter(
        (m) =>
          m.display_id?.toLowerCase().includes(search.toLowerCase()) ||
          m.username?.toLowerCase().includes(search.toLowerCase()),
      )
    : members;


  const isLoading = membersQuery.isLoading || transactionsQuery.isLoading;

  return (
    <div className="p-10 text-[#F1F5F9]">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-[24px] font-bold text-white">
          <span>📊</span> Reports &amp; Analytics
        </h1>
        <div className="flex items-center gap-3">
          <select className="cursor-pointer appearance-none rounded-md border border-[#1E293B] bg-[#111827] py-2 pl-4 pr-10 text-sm font-medium text-white outline-none transition-colors hover:bg-[#1A2235] focus:border-[#00C37B]">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
            <option>Last Month</option>
          </select>
          <button className="flex items-center gap-2 rounded-md border border-[#00C37B] bg-[rgba(0,195,123,0.05)] px-4 py-2 text-sm font-bold text-[#00C37B] transition-all hover:bg-[rgba(0,195,123,0.1)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="mb-6 rounded-xl border border-[#1E293B] bg-[#111827] p-4 text-[#94A3B8]">
          Loading report data...
        </div>
      )}

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-5 xl:grid-cols-4">
        {[
          {
            label: 'Credits Distributed',
            value: fmt(report.creditsDistributed),
            sub: `To ${report.memberCount} members`,
            color: '#F59E0B',
            dot: 'bg-[#F59E0B]',
          },
          {
            label: 'Member Winnings',
            value: fmt(report.memberWinnings),
            sub: 'Paid out',
            color: '#00C37B',
            dot: 'bg-[#00C37B]',
          },
          {
            label: 'Member Losses',
            value: fmt(report.memberLosses),
            sub: 'Retained',
            color: '#EF4444',
            dot: 'bg-[#EF4444]',
          },
          {
            label: 'Net House P&L',
            value: `${report.netPnl >= 0 ? '+' : ''}${fmt(report.netPnl)}`,
            sub: '▲ Live',
            color: '#00C37B',
            dot: 'bg-[#00C37B] animate-pulse',
            glow: true,
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-5 ${
              card.glow ? 'border-[rgba(0,195,123,0.3)] bg-[#1A2235] shadow-[0_0_15px_rgba(0,195,123,0.15)]' : 'border-[#1E293B] bg-[#1A2235]'
            }`}
          >
            <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#94A3B8]">
              <div className={`h-2 w-2 rounded-full ${card.dot}`} />
              {card.label}
            </div>
            <div className={`mb-1 font-mono text-[28px] font-bold`} style={{ color: card.color }}>
              {card.value} <span className="text-[16px] opacity-70">CR</span>
            </div>
            <div
              className={`text-[11px] ${card.glow ? 'rounded bg-[rgba(0,195,123,0.1)] px-2 py-0.5 font-bold text-[#00C37B] inline-block' : 'text-[#64748B]'}`}
            >
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-10 gap-6">
        {/* Credit Distribution Chart */}
        <div className="col-span-6 relative overflow-hidden rounded-xl border border-[#1E293B] bg-[#111827] p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-white">Credit Distribution — Last 30 Days</h3>
            <div className="flex gap-4 text-[11px]">
              {[
                { label: 'Given Out', color: 'bg-[#00C37B]' },
                { label: 'Won Back', color: 'bg-[#F59E0B]' },
                { label: 'Kept', color: 'bg-[#EF4444]' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-[#94A3B8]">
                  <div className={`h-2.5 w-2.5 rounded-sm opacity-50 ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <div className="h-[240px] w-full">
            <svg viewBox="0 0 600 240" className="h-full w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="rGradGreen" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00C37B" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#00C37B" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="rGradAmber" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="rGradRed" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <g stroke="#2D3748" strokeDasharray="4">
                <line x1="0" y1="60" x2="600" y2="60" />
                <line x1="0" y1="120" x2="600" y2="120" />
                <line x1="0" y1="180" x2="600" y2="180" />
              </g>
              <path d="M0,180 Q100,100 200,140 T400,100 T600,150 V240 H0 Z" fill="url(#rGradGreen)" />
              <path d="M0,180 Q100,100 200,140 T400,100 T600,150" fill="none" stroke="#00C37B" strokeWidth="2" />
              <path d="M0,200 Q100,150 200,180 T400,160 T600,190 V240 H0 Z" fill="url(#rGradAmber)" />
              <path d="M0,200 Q100,150 200,180 T400,160 T600,190" fill="none" stroke="#F59E0B" strokeWidth="2" />
              <path d="M0,220 Q100,200 200,210 T400,190 T600,210 V240 H0 Z" fill="url(#rGradRed)" />
              <path d="M0,220 Q100,200 200,210 T400,190 T600,210" fill="none" stroke="#EF4444" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Member Overview */}
        <div className="col-span-4 flex flex-col rounded-xl border border-[#1E293B] bg-[#111827] p-6">
          <h3 className="mb-4 text-[16px] font-bold text-white">Member Overview</h3>
          <div className="relative flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase text-[#64748B]">Total</div>
              <div className="text-[42px] font-bold text-white">{members.length}</div>
              <div className="text-[12px] text-[#64748B]">members</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
            {[
              { label: 'Active', value: members.filter((m) => m.is_active).length, color: 'bg-[#00C37B]' },
              { label: 'Suspended', value: members.filter((m) => !m.is_active).length, color: 'bg-[#EF4444]' },
              { label: 'With Bets', value: members.filter((m) => (m.open_bets ?? 0) > 0).length, color: 'bg-[#F59E0B]' },
              { label: 'Zero Bal.', value: members.filter((m) => parseAmount(m.balance) === 0).length, color: 'bg-[#64748B]' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${item.color}`} />
                <span className="text-[#94A3B8]">{item.label}</span>
                <span className="ml-auto font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member Breakdown Table */}
      <div className="mb-8 overflow-hidden rounded-xl border border-[#1E293B] bg-[#1A2235] shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1E293B] bg-[#111827] px-6 py-4">
          <h3 className="text-[16px] font-bold text-white">Member Breakdown</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-md border border-[#1E293B] bg-[#0B0E1A] py-1.5 pl-8 pr-4 text-sm text-white outline-none placeholder-[#64748B] focus:border-[#00C37B]"
            />
            <svg className="absolute left-2.5 top-2 h-4 w-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#1E293B] bg-[#161d30]">
              {['ID', 'Nickname', 'Balance', 'Open Bets', 'Status', 'Last Active'].map((h) => (
                <th key={h} className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[13px] text-[#94A3B8]">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-6 text-center text-[#64748B]">No members found.</td></tr>
            ) : (
              filtered.map((m) => (
                <tr
                  key={m.id}
                  className={`border-b border-[#1E293B] transition-colors last:border-0 hover:bg-[#232d42] ${
                    !m.is_active ? 'bg-[rgba(239,68,68,0.08)]' : ''
                  }`}
                >
                  <td className="px-6 py-4 font-mono">{m.display_id || `#${m.id}`}</td>
                  <td className="px-6 py-4 font-medium text-white">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-400">
                        {(m.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      {m.username ? `@${m.username.replace('member_', '')}` : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono">{fmt(parseAmount(m.balance))} CR</td>
                  <td className="px-6 py-4 font-mono">{m.open_bets ?? 0}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        m.is_active
                          ? 'border-[rgba(0,195,123,0.3)] bg-[rgba(0,195,123,0.1)] text-[#00C37B]'
                          : 'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.2)] text-[#EF4444]'
                      }`}
                    >
                      {m.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4">—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom row: Balance Distribution + Network Summary */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-6">
          <h3 className="mb-4 text-[15px] font-bold text-white">Balance Distribution</h3>
          {members.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#64748B]">No members to display.</p>
          ) : (
            <div className="space-y-3">
              {[...members]
                .sort((a, b) => parseAmount(b.balance) - parseAmount(a.balance))
                .slice(0, 5)
                .map((m) => {
                  const bal = parseAmount(m.balance);
                  const maxBal = Math.max(...members.map((mm) => parseAmount(mm.balance)), 1);
                  const pct = Math.round((bal / maxBal) * 100);
                  return (
                    <div key={m.id}>
                      <div className="mb-1 flex justify-between text-[12px]">
                        <span className="text-white">{m.username ? `@${m.username.replace('member_', '')}` : m.display_id || `#${m.id}`}</span>
                        <span className="font-mono text-[#00C37B]">{fmt(bal)} CR</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#111827]">
                        <div className="h-full rounded-full bg-[#00C37B]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-xl border border-[#1E293B] bg-[#1A2235] p-6">
          <h3 className="mb-4 text-[15px] font-bold text-white">Network Summary</h3>
          <div className="flex flex-1 flex-col justify-center space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-[#111827] p-3">
              <span className="text-[13px] text-[#94A3B8]">Total Members</span>
              <span className="font-mono text-[16px] font-bold text-white">{report.memberCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#111827] p-3">
              <span className="text-[13px] text-[#94A3B8]">Credits Distributed</span>
              <span className="font-mono text-[16px] font-bold text-[#F59E0B]">{fmt(report.creditsDistributed)} CR</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#111827] p-3">
              <span className="text-[13px] text-[#94A3B8]">Net P&amp;L</span>
              <span className={`font-mono text-[16px] font-bold ${report.netPnl >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'}`}>
                {report.netPnl >= 0 ? '+' : ''}{fmt(report.netPnl)} CR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
