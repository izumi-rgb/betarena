'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

type AgentRow = {
  id: number;
  username?: string;
  display_id?: string;
  balance?: number | string;
  is_active?: boolean;
  member_count?: number;
};
type MemberRow = { id: number; balance?: number | string; is_active?: boolean };
type CreditsOverview = {
  total_created?: number | string;
  total_in_circulation?: number | string;
};
type LogRow = {
  id: number;
  action: string;
  result: string;
  username?: string;
  display_id?: string;
  ip_address?: string;
  created_at: string;
};
type LogsEnvelope = { logs: LogRow[]; total: number };

function parseAmount(value: number | string | undefined): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function KpiCard({
  label,
  value,
  sub,
  color,
  glow,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  color: string;
  glow: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`relative h-[140px] overflow-hidden rounded-[10px] bg-[#1A2235] p-5 ${glow} flex flex-col justify-between group`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>{icon}</div>
      </div>
      <div>
        <div className={`font-mono text-[24px] font-bold`}>{value}</div>
        {sub && <div className="mt-1 text-[11px] text-[#64748B]">{sub}</div>}
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-full bg-[#00C37B] opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

function TrendIcon({ up }: { up: boolean }) {
  return up ? (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="18 9 12 15 6 9" />
    </svg>
  );
}

export default function OverviewPage() {
  const agentsQuery = useQuery({
    queryKey: ['admin', 'agents'],
    queryFn: () => apiGet<AgentRow[]>('/api/admin/agents').then((r) => r.data || []),
    refetchInterval: 30_000,
  });
  const membersQuery = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: () => apiGet<MemberRow[]>('/api/admin/members').then((r) => r.data || []),
    refetchInterval: 30_000,
  });
  const creditsQuery = useQuery({
    queryKey: ['admin', 'credits-overview'],
    queryFn: () => apiGet<CreditsOverview>('/api/credits/admin/overview').then((r) => r.data || {}),
    refetchInterval: 30_000,
  });
  const logsQuery = useQuery({
    queryKey: ['admin', 'logs-preview'],
    queryFn: () => apiGet<LogsEnvelope>('/api/admin/logs?page=1&limit=8').then((r) => r.data || { logs: [], total: 0 }),
    refetchInterval: 20_000,
  });

  const stats = useMemo(() => {
    const agents = agentsQuery.data || [];
    const members = membersQuery.data || [];
    const totalCreated = parseAmount(creditsQuery.data?.total_created);
    const inCirculation = parseAmount(creditsQuery.data?.total_in_circulation);
    const totalAgentBalance = agents.reduce((s, a) => s + parseAmount(a.balance), 0);
    const totalMemberBalance = members.reduce((s, m) => s + parseAmount(m.balance), 0);
    const houseRetained = totalCreated - (totalAgentBalance + totalMemberBalance);
    return {
      agentCount: agents.length,
      activeAgents: agents.filter((a) => a.is_active).length,
      suspendedAgents: agents.filter((a) => !a.is_active).length,
      memberCount: members.length,
      totalCreated,
      inCirculation,
      circulationPct: totalCreated > 0 ? ((inCirculation / totalCreated) * 100).toFixed(1) : '0.0',
      houseRetained,
    };
  }, [agentsQuery.data, creditsQuery.data, membersQuery.data]);

  const agents = agentsQuery.data || [];
  const logs = logsQuery.data?.logs || [];

  return (
    <div className="min-h-screen bg-[#0B0E1A] p-8 text-[#F1F5F9]">
      {/* KPI Cards — 6 col grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total Credits Created"
          value={<span className="text-white">{fmt(stats.totalCreated)} <span className="text-[14px] text-[#64748B]">CR</span></span>}
          sub="System Total"
          color="bg-[rgba(0,195,123,0.1)] text-[#00C37B]"
          glow="shadow-[0_0_0_1px_#1E293B,0_0_16px_rgba(0,195,123,0.18)]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
        />
        <KpiCard
          label="In Circulation"
          value={<span className="text-[#F59E0B]">{fmt(stats.inCirculation)} <span className="text-[14px] opacity-60">CR</span></span>}
          sub={`${stats.circulationPct}% of total`}
          color="bg-[rgba(245,158,11,0.1)] text-[#F59E0B]"
          glow="shadow-[0_0_0_1px_#1E293B,0_0_16px_rgba(245,158,11,0.2)]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10h14l-4-4"/><path d="M17 14H3l4 4"/></svg>}
        />
        <KpiCard
          label="Total Agents"
          value={<span className="text-white">{stats.agentCount}</span>}
          sub={
            <span className="flex items-center gap-2">
              <span className="text-[#00C37B]">{stats.activeAgents} Active</span>
              <span className="text-[#64748B]">•</span>
              <span className="text-[#EF4444]">{stats.suspendedAgents} Susp.</span>
            </span>
          }
          color="bg-[rgba(59,130,246,0.1)] text-[#3B82F6]"
          glow="shadow-[0_0_0_1px_#1E293B,0_0_16px_rgba(59,130,246,0.15)]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
        />
        <KpiCard
          label="Total Members"
          value={<span className="text-white">{stats.memberCount}</span>}
          sub="Registered members"
          color="bg-[rgba(139,92,246,0.1)] text-[#8B5CF6]"
          glow="shadow-[0_0_0_1px_#1E293B,0_0_16px_rgba(139,92,246,0.15)]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <KpiCard
          label="Bets Today"
          value={<span className="text-white">—</span>}
          sub={<span className="flex items-center gap-1 font-semibold text-[#00C37B]"><TrendIcon up={true} /> Live tracking</span>}
          color="bg-[rgba(0,195,123,0.1)] text-[#00C37B]"
          glow="shadow-[0_0_0_1px_#1E293B,0_0_16px_rgba(0,195,123,0.18)]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
        />
        <KpiCard
          label="Platform P&L"
          value={
            <span className={stats.houseRetained >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'}>
              {stats.houseRetained >= 0 ? '+' : ''}{fmt(stats.houseRetained)} <span className="text-[14px] opacity-60">CR</span>
            </span>
          }
          sub={<span className="font-bold text-[#00C37B]">House retained ▲</span>}
          color="bg-[rgba(0,195,123,0.2)] text-[#00C37B]"
          glow="shadow-[0_0_0_1px_#00C37B,0_0_24px_rgba(0,195,123,0.25)]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
      </div>

      {/* Chart + Hierarchy row */}
      <div className="mb-8 flex h-[340px] gap-5">
        {/* 30-Day Overview Chart */}
        <div className="flex w-[55%] flex-col rounded-xl border border-[#1E293B] bg-[#111827] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white">30-Day Overview</h3>
            <div className="flex items-center gap-4 text-[11px] font-medium">
              <div className="flex items-center gap-2 text-[#94A3B8]">
                <div className="h-2 w-2 rounded-full bg-[#00C37B]" /> Bet Volume
              </div>
              <div className="flex items-center gap-2 text-[#94A3B8]">
                <div className="h-2 w-2 rounded-full bg-[#F59E0B]" /> P&L
              </div>
            </div>
          </div>
          <div className="relative flex-1 w-full">
            <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradGreen" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00C37B" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#00C37B" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gradAmber" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="55" x2="600" y2="55" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <line x1="0" y1="110" x2="600" y2="110" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <line x1="0" y1="165" x2="600" y2="165" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <path d="M0,150 Q60,160 120,130 T240,140 T360,100 T480,120 T600,90 V220 H0 Z" fill="url(#gradAmber)" />
              <path d="M0,150 Q60,160 120,130 T240,140 T360,100 T480,120 T600,90" fill="none" stroke="#F59E0B" strokeWidth="2" />
              <path d="M0,120 Q50,90 100,100 T200,60 T300,80 T400,40 T500,70 T600,50 V220 H0 Z" fill="url(#gradGreen)" />
              <path d="M0,120 Q50,90 100,100 T200,60 T300,80 T400,40 T500,70 T600,50" fill="none" stroke="#00C37B" strokeWidth="2" />
            </svg>
            <div className="absolute bottom-0 flex w-full justify-between px-2 font-mono text-[10px] text-[#475569]">
              <span>01</span><span>05</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
            </div>
          </div>
        </div>

        {/* Credit Hierarchy */}
        <div className="flex w-[45%] flex-col overflow-hidden rounded-xl border border-[#1E293B] bg-[#111827] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white">Credit Hierarchy</h3>
            <div className="flex items-center gap-1 rounded border border-[rgba(0,195,123,0.3)] bg-[rgba(0,195,123,0.1)] px-2 py-0.5 text-[10px] font-bold text-[#00C37B]">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00C37B]" /> Live
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {/* Admin root */}
            <div className="mb-4 flex items-center justify-between rounded-md border border-[#1E293B] border-l-[3px] border-l-[#00C37B] bg-[rgba(0,195,123,0.05)] p-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px]">👑</span>
                <span className="text-[13px] font-extrabold text-white">ADMIN</span>
              </div>
              <span className="font-mono text-[12px] font-bold text-[#00C37B]">
                {fmt(stats.totalCreated)} CR created
              </span>
            </div>
            {/* Agent rows */}
            <div className="ml-2 space-y-2 border-l border-[#1E293B] pl-2">
              {agentsQuery.isLoading ? (
                <div className="text-[12px] text-[#64748B] pl-4">Loading agents...</div>
              ) : agents.length === 0 ? (
                <div className="text-[12px] text-[#64748B] pl-4">No agents yet</div>
              ) : (
                agents.slice(0, 6).map((agent) => (
                  <div key={agent.id} className="relative pl-6">
                    <div className="absolute left-0 top-1/2 h-px w-4 bg-[#1E293B]" />
                    <div className="group flex items-center justify-between rounded-md border border-[#1E293B] bg-[#1A2235] p-2.5 transition-colors hover:bg-[#1E293B]">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${agent.is_active ? 'bg-[#00C37B]' : 'bg-[#EF4444]'}`} />
                        <span className={`text-[13px] font-bold ${agent.is_active ? 'text-white' : 'text-[#EF4444] line-through'}`}>
                          {agent.display_id || agent.username || `Agent #${agent.id}`}
                        </span>
                        {!agent.is_active && (
                          <span className="rounded border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] px-1.5 py-0.5 text-[9px] text-[#EF4444]">SUSPENDED</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-[#94A3B8]">{fmt(parseAmount(agent.balance))} CR</span>
                      </div>
                      <Link
                        href={`/agents`}
                        className="rounded border border-[#1E293B] px-2 py-0.5 text-[10px] text-[#64748B] opacity-0 transition-all hover:border-[#00C37B] hover:text-[#00C37B] group-hover:opacity-100"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            System Logs
          </h3>
          <Link
            href="/logs"
            className="flex items-center gap-2 rounded-full border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] px-4 py-1.5 text-[12px] font-semibold text-[#F59E0B] transition-colors hover:bg-[rgba(245,158,11,0.2)]"
          >
            View All Logs →
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#1E293B] bg-[#111827]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0B0E1A]">
                {['Timestamp', 'User', 'Action', 'IP Address', 'Result', 'Threat'].map((h) => (
                  <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {logsQuery.isLoading ? (
                <tr><td colSpan={6} className="px-5 py-6 text-[#64748B]">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-6 text-[#64748B]">No logs found.</td></tr>
              ) : (
                logs.map((log, i) => {
                  const isOk = log.result === 'success' || log.result === 'ok';
                  const isFail = log.result === 'fail' || log.result === 'error' || log.result === 'blocked';
                  const isThreat = log.action?.includes('sqli') || log.action?.includes('xss') || log.action?.includes('fail') || log.result === 'blocked';
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-[#1E293B] transition-colors hover:bg-[rgba(255,255,255,0.03)] ${
                        isThreat ? 'border-l-[3px] border-l-[#EF4444] bg-[#450a0a]' : i % 2 === 0 ? 'bg-[#1A2235]' : 'bg-[#161b2e]'
                      }`}
                    >
                      <td className="px-5 py-3 font-mono text-[#64748B]">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-5 py-3 font-medium text-white">{log.display_id || log.username || '—'}</td>
                      <td className={`px-5 py-3 font-mono ${isThreat ? 'font-bold text-[#EF4444]' : 'text-[#94A3B8]'}`}>{log.action}</td>
                      <td className="px-5 py-3 font-mono text-[#64748B]">{log.ip_address || '—'}</td>
                      <td className="px-5 py-3">
                        {isOk ? (
                          <span className="rounded-full border border-[rgba(0,195,123,0.3)] bg-[rgba(0,195,123,0.12)] px-2 py-0.5 text-[10px] font-bold text-[#00C37B]">✅ OK</span>
                        ) : isFail ? (
                          <span className="rounded-full border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)] px-2 py-0.5 text-[10px] font-bold text-[#EF4444]">
                            {log.result === 'blocked' ? '🚫 BLOCKED' : '❌ FAIL'}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">{log.result}</span>
                        )}
                      </td>
                      <td className={`px-5 py-3 text-[11px] font-bold ${isThreat ? 'animate-pulse text-[#EF4444]' : 'text-[#64748B]'}`}>
                        {isThreat ? '🚨' : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
