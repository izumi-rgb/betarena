'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
type MemberRow = { id: number; balance?: number | string; is_active?: boolean; created_at?: string };
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

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toString();
}

function getActivityIcon(log: LogRow) {
  const isThreat = log.result === 'blocked' || log.action?.includes('sqli') || log.action?.includes('xss') || log.action?.includes('fail');
  const isCredit = log.action?.includes('credit') || log.action?.includes('transfer');
  const isAgent = log.action?.includes('agent') || log.action?.includes('onboard');

  if (isThreat) {
    return { bg: 'bg-[#EF4444]/10', color: 'text-[#EF4444]', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    )};
  }
  if (isCredit) {
    return { bg: 'bg-[#3B82F6]/10', color: 'text-[#3B82F6]', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )};
  }
  if (isAgent) {
    return { bg: 'bg-[#F59E0B]/10', color: 'text-[#F59E0B]', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    )};
  }
  return { bg: 'bg-[#00C37B]/10', color: 'text-[#00C37B]', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )};
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
}

export default function OverviewPage() {
  const lastFetchRef = useRef(Date.now());
  const [dataTimeAgo, setDataTimeAgo] = useState('just now');

  // Update the "Xs ago" display every second
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastFetchRef.current) / 1000);
      if (seconds < 5) setDataTimeAgo('just now');
      else if (seconds < 60) setDataTimeAgo(`${seconds}s ago`);
      else setDataTimeAgo(`${Math.floor(seconds / 60)}m ago`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    queryFn: () => apiGet<LogsEnvelope>('/api/admin/logs?page=1&limit=4').then((r) => r.data || { logs: [], total: 0 }),
    refetchInterval: 15_000,
  });

  // Update lastFetchRef whenever any query refetches successfully
  useEffect(() => {
    lastFetchRef.current = Date.now();
  }, [agentsQuery.dataUpdatedAt, membersQuery.dataUpdatedAt, creditsQuery.dataUpdatedAt, logsQuery.dataUpdatedAt]);

  const stats = useMemo(() => {
    const agents = agentsQuery.data || [];
    const members = membersQuery.data || [];
    const totalCreated = parseAmount(creditsQuery.data?.total_created);
    const inCirculation = parseAmount(creditsQuery.data?.total_in_circulation);
    const totalAgentBalance = agents.reduce((s, a) => s + parseAmount(a.balance), 0);
    const totalMemberBalance = members.reduce((s, m) => s + parseAmount(m.balance), 0);
    const houseRetained = totalCreated - (totalAgentBalance + totalMemberBalance);
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const recentMembers = members.filter((m) => m.created_at && new Date(m.created_at).getTime() > thirtyDaysAgo).length;
    return {
      agentCount: agents.length,
      activeAgents: agents.filter((a) => a.is_active).length,
      pendingAgents: agents.filter((a) => !a.is_active).length,
      memberCount: members.length,
      recentMembers,
      totalCreated,
      inCirculation,
      circulationPct: totalCreated > 0 ? ((inCirculation / totalCreated) * 100).toFixed(1) : '0.0',
      houseRetained,
    };
  }, [agentsQuery.data, creditsQuery.data, membersQuery.data]);

  const logs = logsQuery.data?.logs || [];

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100vh' }}>
      {/* Page Header */}
      <header className="h-16 bg-[#111827] border-b border-[#1E293B] px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4 w-1/4">
          <div className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">
            Executive Overview
          </div>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-white font-bold text-[16px]">Global System Statistics</h1>
        </div>

        <div className="flex items-center justify-end gap-6 w-1/4">
          <div className="flex flex-col items-end">
            <span className="text-[#64748B] text-[10px] font-bold uppercase">Data Refresh</span>
            <span className="text-[#00C37B] text-[11px] font-mono">Live &bull; {dataTimeAgo}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-[#1E293B] shadow-lg" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1E293B transparent' }}>

        {/* 5-Column KPI Grid */}
        <div className="grid grid-cols-5 gap-6">
          {/* Total System Credits */}
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 relative overflow-hidden" style={{ boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(0,195,123,0.12)' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest mb-1">Total System Credits</p>
                <h2 className="text-white font-mono text-[28px] font-bold">
                  {fmtCompact(stats.totalCreated)} <span className="text-[14px] text-[#64748B]">CR</span>
                </h2>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[rgba(0,195,123,0.1)] flex items-center justify-center text-[#00C37B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] text-[11px]">Total supply issued</span>
            </div>
          </div>

          {/* In Circulation */}
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 relative overflow-hidden" style={{ boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(245,158,11,0.12)' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest mb-1">In Circulation</p>
                <h2 className="text-[#F59E0B] font-mono text-[28px] font-bold">
                  {fmtCompact(stats.inCirculation)} <span className="text-[14px] opacity-60">CR</span>
                </h2>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.1)] flex items-center justify-center text-[#F59E0B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 10h14l-4-4" /><path d="M17 14H3l4 4" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F59E0B] text-[12px] font-bold">{stats.circulationPct}%</span>
              <span className="text-[#64748B] text-[11px]">utilization rate</span>
            </div>
          </div>

          {/* Platform P&L */}
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 relative overflow-hidden" style={{ boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(0,195,123,0.12)' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest mb-1">Platform P&L</p>
                <h2 className={`font-mono text-[28px] font-bold ${stats.houseRetained >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'}`}>
                  {stats.houseRetained >= 0 ? '+' : ''}{fmtCompact(stats.houseRetained)} <span className="text-[14px] opacity-60">CR</span>
                </h2>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[rgba(0,195,123,0.1)] flex items-center justify-center text-[#00C37B]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] text-[11px]">House retained balance</span>
            </div>
          </div>

          {/* Active Members */}
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 relative overflow-hidden" style={{ boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(59,130,246,0.12)' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest mb-1">Active Members</p>
                <h2 className="text-white font-mono text-[28px] font-bold">{stats.memberCount}</h2>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center text-[#3B82F6]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#3B82F6] text-[12px] font-bold">{stats.recentMembers}</span>
              <span className="text-[#64748B] text-[11px]">new this month</span>
            </div>
          </div>

          {/* Network Agents */}
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-6 relative overflow-hidden" style={{ boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(139,92,246,0.12)' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest mb-1">Network Agents</p>
                <h2 className="text-white font-mono text-[28px] font-bold">{stats.agentCount}</h2>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[#8B5CF6]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white text-[12px] font-bold">{stats.activeAgents} Active</span>
              <span className="text-[#64748B] text-[11px]">• {stats.pendingAgents} suspended</span>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Live Network Activity */}
          <div className="col-span-8 bg-[#111827] border border-[#1E293B] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-[16px] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00C37B] animate-pulse" />
                Live Network Activity
              </h3>
              <span className="text-[#64748B] text-[11px]">Latest 4 entries</span>
            </div>

            <div className="space-y-3">
              {logsQuery.isLoading ? (
                <div className="text-[#64748B] text-sm">Loading activity...</div>
              ) : logs.length === 0 ? (
                <div className="bg-[#1A2235] border border-[#1E293B] p-8 rounded-lg text-center">
                  <p className="text-[#64748B] text-sm">No recent activity</p>
                  <p className="text-[#475569] text-[11px] mt-1">System events will appear here as they occur.</p>
                </div>
              ) : (
                logs.map((log) => {
                  const style = getActivityIcon(log);
                  const isThreat = log.result === 'blocked' || log.action?.includes('sqli') || log.action?.includes('xss');
                  const isCredit = log.action?.includes('credit') || log.action?.includes('transfer');
                  return (
                    <ActivityCard
                      key={log.id}
                      iconBg={style.bg} iconColor={style.color} icon={style.icon}
                      title={log.action}
                      sub={`${log.display_id || log.username || 'System'} • ${log.ip_address || 'Internal'} • ${timeAgo(log.created_at)}`}
                      amount={isThreat ? 'BLOCKED' : isCredit ? 'CR' : log.result?.toUpperCase()}
                      amountColor={isThreat ? 'text-[#EF4444]' : 'text-[#00C37B]'}
                      badge={log.result}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-4 space-y-6">
            {/* Agent Activity Summary */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
              <h3 className="text-white font-bold text-[15px] mb-6">Agent Activity</h3>
              <div className="space-y-6">
                {(() => {
                  const total = stats.agentCount || 1;
                  const activePct = Math.round((stats.activeAgents / total) * 100);
                  const suspendedPct = 100 - activePct;
                  return [
                    { label: 'Active Agents', count: stats.activeAgents, pct: activePct, color: '#00C37B' },
                    { label: 'Suspended Agents', count: stats.pendingAgents, pct: suspendedPct, color: '#EF4444' },
                  ].map(({ label, count, pct, color }) => (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[#94A3B8] text-[12px] font-bold">{label}</span>
                        <span className="text-white text-[12px] font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#1A2235] h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ));
                })()}
                <div className="pt-2 border-t border-[#1E293B]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B] text-[11px]">Total Members</span>
                    <span className="text-white text-[12px] font-mono font-bold">{stats.memberCount}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[#64748B] text-[11px]">New This Month</span>
                    <span className="text-[#00C37B] text-[12px] font-mono font-bold">{stats.recentMembers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ActivityCard({
  iconBg, iconColor, icon, title, sub, amount, amountColor, badge,
}: {
  iconBg: string; iconColor: string; icon: React.ReactNode;
  title: string; sub: string; amount: string; amountColor: string; badge: string;
}) {
  return (
    <div className="bg-[#1A2235] border border-[#1E293B] p-4 rounded-lg flex items-center justify-between hover:bg-[#1E293B] transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>{icon}</div>
        <div>
          <p className="text-white font-bold text-[13px]">{title}</p>
          <p className="text-[#64748B] text-[11px]">{sub}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`${amountColor} font-mono font-bold text-[13px]`}>{amount}</p>
        <p className="text-[#64748B] text-[10px] uppercase font-bold">{badge}</p>
      </div>
    </div>
  );
}
