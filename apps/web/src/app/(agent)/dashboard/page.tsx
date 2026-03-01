'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

type MemberRow = {
  id: number;
  display_id?: string;
  username?: string;
  balance?: number | string;
  is_active?: boolean;
  open_bets?: number;
  pnl_7d?: number | string;
};
type SubAgentRow = { id: number; is_active?: boolean; balance?: number | string };
type CreditsData = { balance?: number | string; allocated?: number | string };

type CreatedMember = {
  display_id: string;
  username: string;
  password: string;
};

function parseAmount(value: number | string | undefined): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
  progressPct,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
  icon: React.ReactNode;
  progressPct?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#1E293B] bg-[#1A2235] p-5">
      <div className="mb-2 flex items-start justify-between">
        <div className="text-[12px] font-bold uppercase tracking-wider text-[#94A3B8]">{label}</div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${accent || 'bg-[rgba(0,195,123,0.12)] text-[#00C37B]'}`}>
          {icon}
        </div>
      </div>
      <div className="mb-4 font-mono text-[28px] font-bold">{value}</div>
      {progressPct !== undefined && (
        <div className="mb-1 h-2 w-full rounded-full bg-[#0B0E1A]">
          <div className="h-2 rounded-full bg-[#00C37B]" style={{ width: `${progressPct}%` }} />
        </div>
      )}
      {sub && <div className="text-[11px] text-[#64748B]">{sub}</div>}
    </div>
  );
}

function CreateMemberModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nickname, setNickname] = useState('');
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<CreatedMember | null>(null);
  const [copied, setCopied] = useState<'username' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await apiPost<CreatedMember>('/api/agents/members', { nickname: nickname.trim() || undefined });
      if (res.success && res.data) {
        setCredentials(res.data);
        onSuccess();
      } else {
        setError(res.message || 'Failed to create member');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [nickname, onSuccess]);

  const handleCopy = (field: 'username' | 'password', value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[440px] rounded-2xl border border-[#1E293B] bg-[#111827] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-white">Create Member Session</h3>
          <button onClick={onClose} className="text-[#64748B] transition-colors hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mb-6 h-px w-full bg-[#1E293B]" />

        {!credentials ? (
          <div className="mb-6">
            <label className="mb-2 block text-[12px] font-bold uppercase tracking-wide text-[#94A3B8]">
              Nickname (optional)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="@nickname"
              className="mb-4 w-full rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-4 py-3 text-[#F1F5F9] outline-none transition-colors focus:border-[#00C37B]"
            />
            {error && <p className="mb-3 text-[13px] text-[#EF4444]">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={creating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00C37B] py-3.5 text-[13px] font-bold uppercase tracking-wide text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {creating ? 'Creating...' : 'Generate Credentials'}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-center">
              <div className="h-px flex-1 bg-[#1E293B]" />
              <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Generated Credentials</span>
              <div className="h-px flex-1 bg-[#1E293B]" />
            </div>

            <div className="mb-4 rounded-lg border border-[#1E293B] bg-[#0B0E1A] p-4">
              <div className="mb-3 flex items-center justify-between border-b border-[#1E293B] pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[11px] text-[#64748B]">Username</span>
                  <span className="font-mono font-semibold text-white">{credentials.username}</span>
                </div>
                <button
                  onClick={() => handleCopy('username', credentials.username)}
                  className={`transition-colors ${copied === 'username' ? 'text-[#00C37B]' : 'text-[#64748B] hover:text-[#00C37B]'}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[11px] text-[#64748B]">Password</span>
                  <span className="font-mono font-semibold text-white">{credentials.password}</span>
                </div>
                <button
                  onClick={() => handleCopy('password', credentials.password)}
                  className={`transition-colors ${copied === 'password' ? 'text-[#00C37B]' : 'text-[#64748B] hover:text-[#00C37B]'}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] p-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" className="mt-0.5 shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-[13px] font-medium leading-tight text-[#F59E0B]">
                Save these credentials now. They will not be shown again.
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg border border-[#1E293B] py-2.5 text-[13px] font-medium text-[#94A3B8] transition-colors hover:border-[#00C37B] hover:text-white"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AgentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [showModal, setShowModal] = useState(false);

  const membersQuery = useQuery({
    queryKey: ['agent', 'members'],
    queryFn: () => apiGet<MemberRow[]>('/api/agents/members').then((r) => r.data || []),
    refetchInterval: 30_000,
  });
  const subAgentsQuery = useQuery({
    queryKey: ['agent', 'sub-agents'],
    queryFn: () => apiGet<SubAgentRow[]>('/api/agents/sub-agents').then((r) => r.data || []),
  });
  const creditsQuery = useQuery({
    queryKey: ['agent', 'credits'],
    queryFn: () => apiGet<CreditsData>('/api/credits/balance').then((r) => r.data || {}),
    refetchInterval: 30_000,
  });

  const stats = useMemo(() => {
    const members = membersQuery.data || [];
    const balance = parseAmount(creditsQuery.data?.balance);
    const distributed = members.reduce((s, m) => s + parseAmount(m.balance), 0);
    const activeMembers = members.filter((m) => m.is_active).length;
    const suspendedMembers = members.filter((m) => !m.is_active).length;
    const pnl = members.reduce((s, m) => s + parseAmount(m.pnl_7d), 0);
    const availablePct = balance > 0 ? Math.round(((balance - distributed) / balance) * 100) : 0;
    return { balance, distributed, memberCount: members.length, activeMembers, suspendedMembers, pnl, availablePct };
  }, [membersQuery.data, creditsQuery.data]);

  const members = membersQuery.data || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-10 text-[#F1F5F9]">
      {showModal && (
        <CreateMemberModal
          onClose={() => setShowModal(false)}
          onSuccess={() => membersQuery.refetch()}
        />
      )}

      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-[22px] font-bold text-white">
            Welcome back, {user?.display_id || user?.username || 'Agent'} 👋
          </h1>
          <div className="text-[13px] text-[#64748B]">
            {dateStr} · {timeStr}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full border border-[#1E293B] bg-gradient-to-br from-purple-500 to-blue-500" />
        </div>
      </header>

      {/* Stat Cards */}
      <div className="mb-10 grid grid-cols-2 gap-5 xl:grid-cols-4">
        <StatCard
          label="Total Credits"
          value={<span className="text-white">{fmt(stats.balance)} <span className="text-[16px] font-normal text-[#64748B]">CR</span></span>}
          progressPct={stats.availablePct}
          sub={`${stats.availablePct}% Available`}
          accent="bg-[rgba(0,195,123,0.12)] text-[#00C37B]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>}
        />
        <StatCard
          label="Distributed"
          value={<span className="text-[#F59E0B]">{fmt(stats.distributed)} <span className="text-[16px] font-normal opacity-70">CR</span></span>}
          sub={`to ${stats.memberCount} members`}
          accent="bg-[rgba(245,158,11,0.12)] text-[#F59E0B]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>}
        />
        <StatCard
          label="Total Members"
          value={<span className="text-white">{stats.memberCount}</span>}
          sub={
            <span className="flex items-center gap-3 font-medium">
              <span className="text-[#00C37B]">{stats.activeMembers} Active</span>
              <span className="text-[#64748B]">•</span>
              <span className="text-[#EF4444]">{stats.suspendedMembers} Suspended</span>
            </span>
          }
          accent="bg-[rgba(59,130,246,0.12)] text-[#3B82F6]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard
          label="Platform P&L"
          value={
            <span className={stats.pnl >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'}>
              {stats.pnl >= 0 ? '+' : ''}{fmt(stats.pnl)} <span className="text-[16px] font-normal opacity-70">CR</span>
            </span>
          }
          sub={<span className={`flex items-center gap-1 ${stats.pnl >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'}`}>This period</span>}
          accent={`${stats.pnl >= 0 ? 'bg-[rgba(0,195,123,0.12)] text-[#00C37B]' : 'bg-[rgba(239,68,68,0.12)] text-[#EF4444]'}`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
        />
      </div>

      {/* Members Table */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-white">My Members</h2>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-[#00C37B] px-4 py-2 text-[13px] font-bold text-black transition-colors hover:bg-[#00a86b]"
        >
          ＋ Create New Member
        </button>
      </div>

      {membersQuery.isLoading ? (
        <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 text-[#94A3B8]">Loading members...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#1E293B] bg-[#1A2235] shadow-lg">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#111827]">
                {['Member ID', 'Nickname', 'Balance', 'Open Bets', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#64748B]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#64748B]">
                    No members yet. Create your first member to get started.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m.id}
                    className={`border-b border-[#1E293B] text-[14px] text-[#94A3B8] transition-colors last:border-0 hover:bg-[#232d42] hover:text-white ${
                      !m.is_active ? 'bg-[rgba(239,68,68,0.08)]' : ''
                    }`}
                  >
                    <td className="px-5 py-4 font-mono text-[#F1F5F9]">{m.display_id || `#${m.id}`}</td>
                    <td className="px-5 py-4 font-medium text-white">
                      {m.username ? `@${m.username.replace('member_', '')}` : '—'}
                    </td>
                    <td className="px-5 py-4 font-mono">{fmt(parseAmount(m.balance))} CR</td>
                    <td className="px-5 py-4 font-mono">{m.open_bets ?? 0}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          m.is_active
                            ? 'border-[rgba(0,195,123,0.3)] bg-[rgba(0,195,123,0.15)] text-[#00C37B]'
                            : 'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.15)] text-[#EF4444]'
                        }`}
                      >
                        {m.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={`/members/${m.id}`}
                        className="text-[12px] font-medium text-[#64748B] transition-colors hover:text-[#00C37B]"
                      >
                        View →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
