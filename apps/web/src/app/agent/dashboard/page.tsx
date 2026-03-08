'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { copyToClipboard as copyText } from '@/lib/copyToClipboard';
import Link from 'next/link';

/* ── Types ─────────────────────────────────────────────────── */
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
type CreatedMember = { display_id: string; username: string; password: string };

/* ── Helpers ───────────────────────────────────────────────── */
function parseAmount(value: number | string | undefined): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── CreateMemberModal ─────────────────────────────────────── */
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
    copyText(value);
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

/* ── Page ──────────────────────────────────────────────────── */
export default function AgentDashboardPage() {
  const [showModal, setShowModal] = useState(false);

  /* ── Queries ── */
  const membersQuery = useQuery({
    queryKey: ['agent', 'members'],
    queryFn: () => apiGet<MemberRow[]>('/api/agents/members').then((r) => r.data || []),
    refetchInterval: 30_000,
  });
  useQuery({
    queryKey: ['agent', 'sub-agents'],
    queryFn: () => apiGet<SubAgentRow[]>('/api/agents/sub-agents').then((r) => r.data || []),
  });
  const creditsQuery = useQuery({
    queryKey: ['agent', 'credits'],
    queryFn: () => apiGet<CreditsData>('/api/credits/balance').then((r) => r.data || {}),
    refetchInterval: 30_000,
  });

  /* ── Derived stats ── */
  const stats = useMemo(() => {
    const members = membersQuery.data || [];
    const balance = parseAmount(creditsQuery.data?.balance);
    const distributed = members.reduce((s, m) => s + parseAmount(m.balance), 0);
    const activeMembers = members.filter((m) => m.is_active).length;
    const suspendedMembers = members.filter((m) => !m.is_active).length;
    const pnl = members.reduce((s, m) => s + parseAmount(m.pnl_7d), 0);
    const totalOpenBets = members.reduce((s, m) => s + (m.open_bets ?? 0), 0);
    const exposureBalance = members
      .filter((m) => (m.open_bets ?? 0) > 0)
      .reduce((s, m) => s + parseAmount(m.balance), 0);
    return {
      balance,
      distributed,
      memberCount: members.length,
      activeMembers,
      suspendedMembers,
      pnl,
      totalOpenBets,
      exposureBalance,
    };
  }, [membersQuery.data, creditsQuery.data]);

  /* ── Activity items from member data ── */
  const activityItems = useMemo(() => {
    const members = membersQuery.data || [];
    if (members.length === 0) return [];
    return members.slice(0, 5).map((m) => ({
      label: m.is_active ? 'Active Member' : 'Suspended',
      detail: `@${(m.username || m.display_id || `user_${m.id}`).replace('member_', '')} - ${fmt(parseAmount(m.balance))} CR`,
      time: `Member #${m.display_id || m.id}`,
      color: m.is_active ? '#00C37B' : '#EF4444',
    }));
  }, [membersQuery.data]);

  const isLoading = membersQuery.isLoading || creditsQuery.isLoading;

  return (
    <div className="min-h-screen bg-[#0B0E1A] text-[#F1F5F9]" style={{ padding: '32px 40px' }}>
      {showModal && (
        <CreateMemberModal
          onClose={() => setShowModal(false)}
          onSuccess={() => membersQuery.refetch()}
        />
      )}

      {/* ── Header ── */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-[22px] font-bold text-white">Dashboard Overview</h1>
          <p className="text-[13px] text-[#64748B]">
            Track your network performance and manage assets
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#1E293B] bg-[#1A2235] px-4 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00C37B] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00C37B]" />
          </span>
          <span className="text-[13px] font-medium text-[#94A3B8]">Live Status</span>
        </div>
      </header>

      {/* ── 4 Stat Cards ── */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Balance Available */}
        <div className="group rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 transition-colors hover:border-[#64748B]">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">Balance Available</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(0,195,123,0.12)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C37B" strokeWidth="2">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>
          </div>
          <div className="mb-1 font-mono text-[28px] font-bold text-white">
            {isLoading ? '---' : fmt(stats.balance)}
            <span className="ml-1 text-[14px] font-normal text-[#64748B]">CR</span>
          </div>
          <div className="text-[12px] text-[#64748B]">
            {isLoading ? '...' : `${fmt(stats.distributed)} CR distributed`}
          </div>
        </div>

        {/* Active Members */}
        <div className="group rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 transition-colors hover:border-[#64748B]">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">Active Members</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(59,130,246,0.12)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="mb-1 font-mono text-[28px] font-bold text-white">
            {isLoading ? '---' : stats.activeMembers}
          </div>
          <div className="text-[12px] text-[#64748B]">
            {isLoading
              ? '...'
              : `${stats.memberCount} total, ${stats.suspendedMembers} suspended`}
          </div>
        </div>

        {/* Weekly P&L */}
        <div className="group rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 transition-colors hover:border-[#64748B]">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">Weekly P&amp;L</span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                stats.pnl >= 0
                  ? 'bg-[rgba(0,195,123,0.12)]'
                  : 'bg-[rgba(239,68,68,0.12)]'
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={stats.pnl >= 0 ? '#00C37B' : '#EF4444'}
                strokeWidth="2"
              >
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </div>
          </div>
          <div
            className={`mb-1 font-mono text-[28px] font-bold ${
              stats.pnl >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'
            }`}
          >
            {isLoading ? '---' : `${stats.pnl >= 0 ? '+' : ''}${fmt(stats.pnl)}`}
            <span className="ml-1 text-[14px] font-normal opacity-70">CR</span>
          </div>
          <div className="text-[12px] text-[#64748B]">
            {isLoading ? '...' : 'Last 7 days'}
          </div>
        </div>

        {/* Open Exposure */}
        <div className="group rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 transition-colors hover:border-[#64748B]">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">Open Exposure</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(245,158,11,0.12)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <div className="mb-1 font-mono text-[28px] font-bold text-[#F59E0B]">
            {isLoading ? '---' : fmt(stats.exposureBalance)}
            <span className="ml-1 text-[14px] font-normal opacity-70">CR</span>
          </div>
          <div className="text-[12px] text-[#64748B]">
            {isLoading ? '...' : `${stats.totalOpenBets} pending bets`}
          </div>
        </div>
      </div>

      {/* ── Main content: 2-column layout ── */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="xl:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div>
            <h2 className="mb-4 text-[16px] font-bold text-white">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Create Member */}
              <button
                onClick={() => setShowModal(true)}
                className="group flex items-center gap-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-5 text-left transition-all hover:translate-y-[-2px] hover:border-[#00C37B] hover:bg-[#232d42]"
              >
                <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(0,195,123,0.15)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C37B" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white">Create Member</div>
                  <div className="text-[12px] text-[#64748B]">Generate new login credentials</div>
                </div>
              </button>

              {/* Transfer Credits */}
              <Link
                href="/agent/credits"
                className="group flex items-center gap-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-5 text-left transition-all hover:translate-y-[-2px] hover:border-[#00C37B] hover:bg-[#232d42]"
              >
                <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(59,130,246,0.15)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="16 12 12 8 8 12" />
                    <line x1="12" y1="16" x2="12" y2="8" />
                  </svg>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white">Transfer Credits</div>
                  <div className="text-[12px] text-[#64748B]">Send credits to members</div>
                </div>
              </Link>

              {/* Activity Reports */}
              <Link
                href="/agent/reports"
                className="group flex items-center gap-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-5 text-left transition-all hover:translate-y-[-2px] hover:border-[#00C37B] hover:bg-[#232d42]"
              >
                <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(245,158,11,0.15)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white">Activity Reports</div>
                  <div className="text-[12px] text-[#64748B]">View detailed analytics</div>
                </div>
              </Link>

            </div>
          </div>

          {/* Network Performance chart */}
          <div>
            <h2 className="mb-4 text-[16px] font-bold text-white">Network Performance</h2>
            <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Weekly volume (CR)</span>
                <span className="text-[13px] font-medium text-[#94A3B8]">This Week</span>
              </div>
              <div className="flex h-[160px] items-center justify-center">
                <p className="text-[13px] text-[#64748B]">
                  Performance data will appear as members place bets.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column (1/3) - Recent Activity */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-[16px] font-bold text-white">Recent Activity</h2>
            <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-5">
              {activityItems.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-[#64748B]">No members yet. Create your first member to get started.</p>
              ) : (
                <div className="space-y-4">
                  {activityItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 border-b border-[#1E293B] pb-4 last:border-0 last:pb-0"
                    >
                      <div
                        className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-white">{item.label}</div>
                        <div className="text-[12px] text-[#94A3B8]">{item.detail}</div>
                        <div className="mt-1 text-[11px] text-[#475569]">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Network Summary */}
          <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(168,85,247,0.12)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <span className="text-[13px] font-semibold text-white">Network Summary</span>
            </div>
            <p className="text-[13px] leading-relaxed text-[#94A3B8]">
              {isLoading
                ? 'Loading...'
                : stats.memberCount === 0
                  ? 'Your network is empty. Create members to start distributing credits and tracking performance.'
                  : `You have ${stats.activeMembers} active member${stats.activeMembers !== 1 ? 's' : ''} with ${fmt(stats.distributed)} CR distributed across your network.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
