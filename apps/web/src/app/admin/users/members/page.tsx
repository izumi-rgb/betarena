'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { ResetPasswordModal } from '@/components/shared/ResetPasswordModal';

type MemberRow = {
  id: number;
  display_id: string;
  username: string;
  parent_agent_id?: number;
  balance?: number | string;
  is_active?: boolean;
  created_at?: string;
  last_login?: string;
  last_ip?: string;
  role?: string;
  can_create_sub?: boolean;
  is_master_agent?: boolean;
};

function fmt(n: number | string | undefined): string {
  const val = typeof n === 'number' ? n : Number.parseFloat(String(n ?? 0));
  if (!Number.isFinite(val)) return '0.00';
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  });
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export default function AdminMembersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [resetTarget, setResetTarget] = useState<{ id: number; name: string } | null>(null);
  const pageSize = 10;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: () => apiGet<MemberRow[]>('/api/admin/members').then((r) => r.data || []),
    refetchInterval: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      apiPatch(`/api/admin/members/${id}/status`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'members'] }),
  });

  const privilegeMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      apiPatch(`/api/admin/agents/${id}/privilege`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'members'] }),
  });

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.display_id?.toLowerCase().includes(q) || m.username?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const activeMasterAgents = members.filter((m) => m.is_master_agent).length;
  const subAgentRights = members.filter((m) => m.can_create_sub).length;
  const suspended = members.filter((m) => m.is_active === false).length;

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100vh' }}>
      {/* Page Header */}
      <header className="h-16 bg-[#111827] border-b border-[#1E293B] px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4 w-1/4">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B]">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
            </svg>
            <div className="text-[20px] font-extrabold tracking-tight text-white leading-none">
              BET<span className="text-[#00C37B]">ARENA</span>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-[#1E293B] mx-2" />
          <div className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">User Management</div>
        </div>

        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#00C37B]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h1 className="text-white font-bold text-[16px]">Member Directory</h1>
        </div>

        <div className="flex items-center justify-end gap-6 w-1/4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00C37B]" />
            <span className="text-[#94A3B8] text-[12px] font-semibold">Dashboard</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 border-2 border-[#1E293B]" />
        </div>
      </header>

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* Title + Search Row */}
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Manage Users</h2>
            <p className="text-[#64748B] text-sm">Search, filter and adjust permissions for all platform members.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by username, IP or ID..."
                className="bg-[#111827] border border-[#1E293B] rounded-lg py-2 pl-10 pr-4 text-sm text-white w-80 focus:outline-none focus:border-[#00C37B] focus:shadow-[0_0_0_1px_#00C37B] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Member Table */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B0E1A] border-b border-[#1E293B]">
                <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Member Details</th>
                <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Status</th>
                <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Last Active</th>
                <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Balance</th>
                <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Privileges</th>
                <th className="py-4 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 px-6 text-[#64748B]">Loading members...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={6} className="py-8 px-6 text-[#64748B]">No members found.</td></tr>
              ) : (
                paged.map((member, i) => {
                  const isActive = member.is_active !== false;
                  const isSuspended = !isActive;
                  const isMasterAgent = member.is_master_agent || member.role === 'agent';
                  const canCreateSub = member.can_create_sub;
                  const initials = getInitials(member.username || member.display_id || 'U');
                  return (
                    <tr
                      key={member.id}
                      className={`border-b border-[#1E293B] hover:bg-white/[0.02] ${i % 2 === 0 ? 'bg-[#1A2235]' : 'bg-[#161b2e]'}`}
                    >
                      {/* Member Details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isSuspended
                                ? 'bg-[#EF444420] border border-[#EF444440] text-[#EF4444]'
                                : isMasterAgent
                                ? 'bg-[#00C37B20] border border-[#00C37B40] text-[#00C37B]'
                                : 'bg-[#232d42] text-[#94A3B8]'
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className={`font-bold ${isSuspended ? 'text-[#EF4444]' : 'text-white'}`}>
                              {member.username || member.display_id}
                            </div>
                            <div className="text-[#64748B] text-[11px]">ID: {member.display_id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            isActive
                              ? 'bg-[rgba(0,195,123,0.1)] text-[#00C37B] border-[rgba(0,195,123,0.2)]'
                              : 'bg-[rgba(239,68,68,0.1)] text-[#EF4444] border-[rgba(239,68,68,0.2)]'
                          }`}
                        >
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="py-4 px-6">
                        <div className={`font-mono text-[12px] ${isSuspended ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                          {fmtDate(member.last_login || member.created_at)}
                        </div>
                        {member.last_ip && (
                          <div className="text-[#64748B] text-[11px]">IP: {member.last_ip}</div>
                        )}
                      </td>

                      {/* Balance */}
                      <td className="py-4 px-6">
                        <div className={`font-mono font-bold ${isSuspended ? 'text-[#64748B]' : 'text-white'}`}>
                          {fmt(member.balance)} <span className="text-[#64748B] text-[10px]">CR</span>
                        </div>
                      </td>

                      {/* Privileges */}
                      <td className="py-4 px-6">
                        {isSuspended ? (
                          <div className="flex gap-2 opacity-50">
                            <span className="bg-[#1E293B] text-[#94A3B8] text-[9px] px-2 py-0.5 rounded border border-[#2D3748]">LOCKED</span>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            {!isMasterAgent && !canCreateSub && (
                              <span className="bg-[#1E293B] text-[#94A3B8] text-[9px] px-2 py-0.5 rounded border border-[#2D3748]">STANDARD</span>
                            )}
                            {isMasterAgent && (
                              <span className="bg-[rgba(59,130,246,0.15)] text-[#3B82F6] text-[9px] px-2 py-0.5 rounded border border-[rgba(59,130,246,0.3)] font-bold">MASTER AGENT</span>
                            )}
                            {canCreateSub && (
                              <span className="bg-[rgba(139,92,246,0.15)] text-[#8B5CF6] text-[9px] px-2 py-0.5 rounded border border-[rgba(139,92,246,0.3)] font-bold">CAN_CREATE_SUB</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {isSuspended ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => statusMutation.mutate({ id: member.id, is_active: true })}
                              className="flex items-center gap-2 bg-[#00C37B10] border border-[#00C37B40] text-[#00C37B] px-3 py-1.5 rounded text-[10px] font-bold hover:bg-[#00C37B20] transition-all"
                              title="Activate User"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
                              ACTIVATE
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            {/* Crown / Master Agent */}
                            <button
                              onClick={() => privilegeMutation.mutate({ id: member.id, action: isMasterAgent ? 'revoke_master' : 'grant_master' })}
                              title={isMasterAgent ? 'Revoke Master Agent' : 'Grant Master Agent'}
                              className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                                isMasterAgent
                                  ? 'text-[#3B82F6] border-[#3B82F640] bg-[#3B82F610] hover:bg-[#3B82F620]'
                                  : 'text-[#64748B] border-[#1E293B] hover:border-[#00C37B] hover:text-[#00C37B] hover:bg-[#00C37B05]'
                              }`}
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                              </svg>
                            </button>
                            {/* User+ / Sub-Agent Rights */}
                            <button
                              onClick={() => privilegeMutation.mutate({ id: member.id, action: canCreateSub ? 'revoke_sub' : 'grant_sub' })}
                              title={canCreateSub ? 'Revoke Sub-Agent Rights' : 'Grant Sub-Agent Rights'}
                              className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                                canCreateSub
                                  ? 'text-[#8B5CF6] border-[#8B5CF640] bg-[#8B5CF610] hover:bg-[#8B5CF620]'
                                  : 'text-[#64748B] border-[#1E293B] hover:border-[#00C37B] hover:text-[#00C37B] hover:bg-[#00C37B05]'
                              }`}
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                {canCreateSub ? (
                                  <>
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                  </>
                                ) : (
                                  <>
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M20 8v6M23 11h-6" />
                                  </>
                                )}
                              </svg>
                            </button>
                            {/* Reset Password */}
                            <button
                              onClick={() => setResetTarget({ id: member.id, name: member.username || member.display_id })}
                              title="Reset Password"
                              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#1E293B] text-[#64748B] hover:border-[#F59E0B] hover:text-[#F59E0B] hover:bg-[#F59E0B05] transition-all"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                            </button>
                            {/* Ban / Suspend */}
                            <button
                              onClick={() => statusMutation.mutate({ id: member.id, is_active: false })}
                              title="Suspend User"
                              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#1E293B] text-[#64748B] hover:border-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF444405] transition-all"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Table Footer — Pagination */}
          <div className="bg-[#0B0E1A] p-4 flex items-center justify-between border-t border-[#1E293B]">
            <div className="text-[#64748B] text-xs">
              Showing <span className="text-white font-bold">{filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)}</span> of {filtered.length} members
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded bg-[#1A2235] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors disabled:opacity-40"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded font-bold text-xs ${
                    p === page
                      ? 'bg-[#00C37B] text-[#0B0E1A]'
                      : 'bg-[#1A2235] border border-[#1E293B] text-[#94A3B8] hover:text-white transition-colors'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded bg-[#1A2235] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors disabled:opacity-40"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center text-[#3B82F6]">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[#64748B] font-bold tracking-widest">Active Master Agents</div>
              <div className="text-2xl font-bold text-white font-mono">{activeMasterAgents}</div>
            </div>
          </div>
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[#8B5CF6]">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[#64748B] font-bold tracking-widest">Sub-Agent Rights</div>
              <div className="text-2xl font-bold text-white font-mono">{subAgentRights}</div>
            </div>
          </div>
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[rgba(239,68,68,0.1)] flex items-center justify-center text-[#EF4444]">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[#64748B] font-bold tracking-widest">Suspended Accounts</div>
              <div className="text-2xl font-bold text-[#EF4444] font-mono">{suspended}</div>
            </div>
          </div>
        </div>
      </main>

      {resetTarget && (
        <ResetPasswordModal
          targetId={resetTarget.id}
          targetName={resetTarget.name}
          apiEndpoint={`/api/admin/users/${resetTarget.id}/reset-password`}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}
