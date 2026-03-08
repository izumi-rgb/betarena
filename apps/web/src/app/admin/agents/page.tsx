'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { copyToClipboard as copyText } from '@/lib/copyToClipboard';
import { ResetPasswordModal } from '@/components/shared/ResetPasswordModal';

type SubAgent = {
  id: number;
  username?: string;
  display_id?: string;
  balance?: number | string;
  member_count?: number;
};

type AgentRow = {
  id: number;
  username?: string;
  display_id?: string;
  balance?: number | string;
  is_active?: boolean;
  member_count?: number;
  sub_agents?: SubAgent[];
  bet_count_24h?: number;
};

type CreatedAgent = {
  username: string;
  password: string;
  display_id?: string;
};

function fmt(n: number | string | undefined): string {
  const val = typeof n === 'number' ? n : Number.parseFloat(String(n ?? 0));
  if (!Number.isFinite(val)) return '0.00';
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AgentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [createdAgent, setCreatedAgent] = useState<CreatedAgent | null>(null);
  const [page, setPage] = useState(1);
  const [resetTarget, setResetTarget] = useState<{ id: number; name: string } | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['admin', 'agents'],
    queryFn: () => apiGet<AgentRow[]>('/api/admin/agents').then((r) => r.data || []),
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: { nickname: string }) => apiPost<CreatedAgent>('/api/admin/agents', data),
    onSuccess: (res) => {
      if (res.data) setCreatedAgent(res.data);
      qc.invalidateQueries({ queryKey: ['admin', 'agents'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      apiPatch(`/api/admin/agents/${id}/status`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'agents'] }),
  });

  const filtered = agents.filter((a) => {
    const q = search.toLowerCase();
    const hitSearch = !q || a.display_id?.toLowerCase().includes(q) || a.username?.toLowerCase().includes(q);
    const hitStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? !!a.is_active : !a.is_active);
    return hitSearch && hitStatus;
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalBalance = agents.reduce((s, a) => s + (Number(a.balance) || 0), 0);
  const activeSessions = agents.filter((a) => a.is_active).length;

  const handleCreate = () => {
    if (!nickname.trim()) return;
    createMutation.mutate({ nickname });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setNickname('');
    setCreatedAgent(null);
  };


  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100vh' }}>
      {/* Page Header */}
      <header className="h-16 bg-[#111827] border-b border-[#1E293B] px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-2 w-1/4">
          <div className="text-[#94A3B8] text-[13px] font-semibold uppercase tracking-wider">Agent Management</div>
        </div>

        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#00C37B]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h1 className="text-white font-bold text-[16px]">Agent Network Directory</h1>
        </div>

        <div className="flex items-center justify-end gap-4 w-1/4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#00C37B] hover:bg-[#00ab6c] text-[#0B0E1A] text-[12px] font-bold px-4 py-2 rounded flex items-center gap-2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New Agent
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 border-2 border-[#1E293B]" />
        </div>
      </header>

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* Filter Bar */}
        <div className="flex justify-between items-end">
          <div className="flex gap-4">
            <div className="space-y-1.5">
              <label className="text-[#64748B] text-[10px] font-bold uppercase">Search Agents</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by ID or Name..."
                  className="bg-[#111827] border border-[#1E293B] rounded-lg px-4 py-2.5 w-64 text-sm text-white focus:outline-none focus:border-[#00C37B]"
                />
                <svg className="absolute right-3 top-3 text-[#64748B]" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[#64748B] text-[10px] font-bold uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-[#111827] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex gap-8 bg-[#111827] border border-[#1E293B] rounded-xl px-6 py-3">
            <div>
              <div className="text-[#64748B] text-[10px] font-bold uppercase">Total Network Balance</div>
              <div className="text-[#00C37B] font-mono font-bold text-lg">
                {fmt(totalBalance)} <span className="text-[12px] opacity-70">CR</span>
              </div>
            </div>
            <div className="w-[1px] bg-[#1E293B]" />
            <div>
              <div className="text-[#64748B] text-[10px] font-bold uppercase">Active Sessions</div>
              <div className="text-white font-mono font-bold text-lg">{activeSessions}</div>
            </div>
          </div>
        </div>

        {/* Agent Table */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B0E1A] border-b border-[#1E293B]">
                <th className="py-4 px-6 text-[#64748B] text-[11px] uppercase font-bold tracking-wider">Agent Identity</th>
                <th className="py-4 px-6 text-[#64748B] text-[11px] uppercase font-bold tracking-wider">Current Balance</th>
                <th className="py-4 px-6 text-[#64748B] text-[11px] uppercase font-bold tracking-wider text-center">Member Count</th>
                <th className="py-4 px-6 text-[#64748B] text-[11px] uppercase font-bold tracking-wider">24h Bet Activity</th>
                <th className="py-4 px-6 text-[#64748B] text-[11px] uppercase font-bold tracking-wider">Status</th>
                <th className="py-4 px-6 text-right text-[#64748B] text-[11px] uppercase font-bold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-[#64748B] text-sm">Loading agents...</td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-[#64748B] text-sm">No agents found.</td>
                </tr>
              ) : (
                paged.map((agent) => {
                  const isActive = agent.is_active !== false;
                  const betPct = Math.min(100, ((agent.bet_count_24h || 0) / 1000) * 100);
                  const isExpanded = expandedId === agent.id;
                  const initials = (agent.display_id || agent.username || `A${agent.id}`).slice(0, 3).toUpperCase();
                  return [
                    <tr
                      key={`row-${agent.id}`}
                      className={`hover:bg-[#232d42] transition-colors ${isActive ? 'bg-[#1A2235]' : 'bg-[#1A2235]'}`}
                      style={{ borderLeft: `3px solid ${isActive ? '#00C37B' : '#EF4444'}` }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                              isActive ? 'bg-[#00C37B]/10 text-[#00C37B]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className={`font-bold text-sm ${isActive ? 'text-white' : 'text-[#EF4444] line-through decoration-1'}`}>
                              {agent.username || agent.display_id || `Agent #${agent.id}`}
                            </div>
                            <div className="text-[#64748B] text-[11px]">ID: {agent.display_id || `AG-${agent.id}`}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-white">
                        {isActive ? (
                          <>{fmt(agent.balance)} <span className="text-[#64748B] text-xs">CR</span></>
                        ) : (
                          <span className="text-[#EF4444]/60">Locked</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-white font-bold text-sm">{agent.member_count ?? 0}</span>
                        <div className="text-[#64748B] text-[10px]">
                          {agent.sub_agents?.length ? `${agent.sub_agents.length} Sub-Agents` : 'Direct Members'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-[#0B0E1A] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${betPct}%`, backgroundColor: isActive ? '#00C37B' : '#EF4444' }}
                            />
                          </div>
                          <span className={`text-[11px] font-mono ${isActive ? 'text-[#00C37B]' : 'text-[#64748B]'}`}>
                            {isActive ? `${agent.bet_count_24h ?? 0} bets` : 'Disabled'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            isActive
                              ? 'bg-[#00C37B]/10 text-[#00C37B] border-[#00C37B]/30'
                              : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                          }`}
                        >
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {isActive ? (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : agent.id)}
                              className="border border-[#1E293B] text-[#94A3B8] text-[11px] font-bold px-4 py-1.5 rounded bg-[#111827] hover:bg-[#00C37B]/10 hover:border-[#00C37B] hover:text-[#00C37B] transition-all"
                            >
                              Manage Network
                            </button>
                          ) : (
                            <button
                              onClick={() => statusMutation.mutate({ id: agent.id, is_active: true })}
                              className="border border-[#EF4444]/30 text-[#EF4444] text-[11px] font-bold px-4 py-1.5 rounded bg-[#111827] hover:bg-[#EF4444]/10 transition-all"
                            >
                              Unsuspend
                            </button>
                          )}
                          <button
                            onClick={() => setResetTarget({ id: agent.id, name: agent.username || agent.display_id || `Agent #${agent.id}` })}
                            className="border border-[#F59E0B]/20 text-[#F59E0B]/60 text-[11px] font-bold px-3 py-1.5 rounded bg-[#111827] hover:text-[#F59E0B] hover:border-[#F59E0B]/40 transition-all"
                            title="Reset password"
                          >
                            Reset PW
                          </button>
                          {isActive && (
                            <button
                              onClick={() => statusMutation.mutate({ id: agent.id, is_active: false })}
                              className="border border-[#EF4444]/20 text-[#EF4444]/60 text-[11px] font-bold px-3 py-1.5 rounded bg-[#111827] hover:text-[#EF4444] hover:border-[#EF4444]/40 transition-all"
                              title="Suspend agent"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>,
                    isExpanded && (
                      <tr key={`subtree-${agent.id}`} className="bg-[#0F1421]">
                        <td colSpan={6} className="p-0">
                          <div className="px-16 py-6 bg-gradient-to-b from-[#0F1421] to-[#0B0E1A]">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#00C37B]" />
                              <h4 className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-widest">Sub-Agent Network Tree</h4>
                            </div>
                            {agent.sub_agents && agent.sub_agents.length > 0 ? (
                              <div className="space-y-4 ml-4">
                                {agent.sub_agents.map((sub) => (
                                  <div key={sub.id} className="flex items-center justify-between relative pl-4">
                                    <div className="absolute left-0 top-0 bottom-0 w-px bg-[#1E293B]" />
                                    <div className="absolute left-0 top-1/2 w-4 h-px bg-[#1E293B]" />
                                    <div className="flex items-center gap-4">
                                      <div className="bg-[#1A2235] border border-[#1E293B] rounded-lg p-3 w-[400px] flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                          <div className="w-6 h-6 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] text-[10px] font-bold">SA</div>
                                          <span className="text-white text-sm font-semibold">{sub.username || sub.display_id || `Sub #${sub.id}`}</span>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-white font-mono text-xs font-bold">{fmt(sub.balance)} CR</div>
                                          <div className="text-[#64748B] text-[10px]">{sub.member_count ?? 0} Players</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[#64748B] text-sm ml-4">No sub-agents found for this agent.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="bg-[#0B0E1A] px-6 py-4 flex justify-between items-center border-t border-[#1E293B]">
            <span className="text-[#64748B] text-xs font-medium">
              Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} Total Agents
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-[#1A2235] border border-[#1E293B] rounded text-[#64748B] text-xs hover:text-white disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded text-xs font-bold border ${
                    p === page
                      ? 'bg-[#00C37B] border-[#00C37B] text-[#0B0E1A]'
                      : 'bg-[#1A2235] border-[#1E293B] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-[#1A2235] border border-[#1E293B] rounded text-[#64748B] text-xs hover:text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-8 w-[480px] shadow-2xl">
            {createdAgent ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#00C37B]/10 flex items-center justify-center text-[#00C37B]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-[15px]">Agent Created Successfully</h3>
                    <p className="text-[#64748B] text-[11px]">Save these credentials — shown only once</p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Username</label>
                    <div className="mt-1 bg-[#1A2235] border border-[#1E293B] rounded-lg px-4 py-3 font-mono text-white text-sm flex justify-between items-center">
                      {createdAgent.username}
                      <button onClick={() => copyText(createdAgent.username)} className="text-[#64748B] hover:text-[#00C37B]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Password</label>
                    <div className="mt-1 bg-[#1A2235] border border-[#1E293B] rounded-lg px-4 py-3 font-mono text-white text-sm flex justify-between items-center">
                      {createdAgent.password}
                      <button onClick={() => copyText(createdAgent.password)} className="text-[#64748B] hover:text-[#00C37B]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg p-3 mb-6">
                  <p className="text-[#F59E0B] text-[11px] font-medium">⚠ These credentials will not be shown again. Copy and store them securely before closing.</p>
                </div>
                <button onClick={closeModal} className="w-full bg-[#1A2235] border border-[#1E293B] text-white font-bold py-3 rounded-lg hover:bg-[#1E293B] transition-colors">
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#00C37B]/10 flex items-center justify-center text-[#00C37B]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-[15px]">Create New Agent</h3>
                    <p className="text-[#64748B] text-[11px]">Credentials will be auto-generated</p>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider mb-2">Agent Nickname</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. Agent_Alpha"
                      className="w-full bg-[#1A2235] border border-[#1E293B] rounded-lg py-3 px-4 text-white text-sm focus:outline-none focus:border-[#00C37B]"
                    />
                  </div>
                </div>
                {createMutation.isError && (
                  <div className="text-[#EF4444] text-sm mb-4">Failed to create agent. Please try again.</div>
                )}
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 bg-[#1A2235] border border-[#1E293B] text-[#94A3B8] font-bold py-3 rounded-lg hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={createMutation.isPending || !nickname.trim()}
                    className="flex-1 bg-[#00C37B] hover:bg-[#00ab6c] text-[#0B0E1A] font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Agent'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
