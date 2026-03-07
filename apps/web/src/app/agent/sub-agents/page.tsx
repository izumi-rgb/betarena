'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { copyToClipboard } from '@/lib/copyToClipboard';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';

type SubAgentRow = {
  id: number;
  display_id?: string;
  username?: string;
  balance?: number | string;
  is_active?: boolean;
  member_count?: number;
};

type CreatedSubAgent = {
  username: string;
  password: string;
  display_id?: string;
};

function parseAmount(value: number | string | undefined): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CreateSubAgentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<CreatedSubAgent | null>(null);
  const [copied, setCopied] = useState<'username' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await apiPost<CreatedSubAgent>('/api/agents/sub-agents');
      if (res.success && res.data) {
        setCredentials(res.data);
        onSuccess();
      } else {
        setError(res.message || 'Failed to create sub-agent');
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [onSuccess]);

  const handleCopy = (field: 'username' | 'password', value: string) => {
    copyToClipboard(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[440px] rounded-2xl border border-[#1E293B] bg-[#111827] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-white">
            {credentials ? 'Sub-Agent Created' : 'Create Sub-Agent'}
          </h3>
          <button onClick={onClose} className="text-[#64748B] transition-colors hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mb-6 h-px w-full bg-[#1E293B]" />

        {!credentials ? (
          <div>
            <p className="mb-4 text-[13px] text-[#94A3B8]">
              A new sub-agent will be created with auto-generated credentials. Make sure to save the credentials after creation.
            </p>
            {error && <p className="mb-3 text-[13px] text-[#EF4444]">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00C37B] py-3.5 text-[13px] font-bold uppercase tracking-wide text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {creating ? 'Creating...' : 'Generate Sub-Agent'}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C37B]/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C37B" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-bold text-white">Sub-Agent Created Successfully</p>
                <p className="text-[12px] text-[#64748B]">Save these credentials — shown only once</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Username</label>
                <div className="mt-1 bg-[#1A2235] border border-[#1E293B] rounded-lg px-4 py-3 font-mono text-white text-sm flex justify-between items-center">
                  {credentials.username}
                  <button onClick={() => handleCopy('username', credentials.username)} className="text-[#64748B] hover:text-[#00C37B]">
                    {copied === 'username' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C37B" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Password</label>
                <div className="mt-1 bg-[#1A2235] border border-[#1E293B] rounded-lg px-4 py-3 font-mono text-white text-sm flex justify-between items-center">
                  {credentials.password}
                  <button onClick={() => handleCopy('password', credentials.password)} className="text-[#64748B] hover:text-[#00C37B]">
                    {copied === 'password' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C37B" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg p-3 mb-6">
              <p className="text-[#F59E0B] text-[11px] font-medium">
                These credentials will not be shown again. Copy and store them securely before closing.
              </p>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-lg border border-[#1E293B] bg-[#1A2235] py-3 text-[13px] font-bold text-white transition-colors hover:bg-[#2D3B50]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function SubAgentHierarchyPage() {
  const user = useAuthStore((s) => s.user);
  const { balance } = useBalance();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const subAgentsQuery = useQuery({
    queryKey: ['agent', 'sub-agents'],
    queryFn: () => apiGet<SubAgentRow[]>('/api/agents/sub-agents').then((r) => r.data || []),
  });

  const subAgents = subAgentsQuery.data || [];
  const totalNetworkMembers = subAgents.reduce((sum, sa) => sum + (sa.member_count ?? 0), 0);

  return (
    <div className="p-10 text-[#F1F5F9]">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-white">Sub-Agent Hierarchy</h1>
            <span className="rounded-full bg-[rgba(59,130,246,0.1)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#3B82F6]">
              Organizational View
            </span>
          </div>
          <p className="text-[13px] text-[#64748B]">
            Manage and monitor your distribution network structure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-[#1E293B] bg-transparent px-4 py-2.5 text-[13px] font-medium text-[#94A3B8] transition-colors hover:border-[#3B82F6] hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Tree
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#00C37B] px-4 py-2.5 text-[13px] font-bold text-black transition-opacity hover:opacity-90"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Sub-Agent
          </button>
        </div>
      </header>

      {/* Tree Structure */}
      <div className="mx-auto max-w-5xl">
        {/* Root Agent Card */}
        <div className="rounded-xl border border-[rgba(0,195,123,0.1)] bg-[#1E2D45] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#00C37B] bg-gradient-to-br from-purple-500 to-blue-500 text-[16px] font-bold text-white">
                {(user?.display_id || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[15px] font-bold text-white">
                  {user?.display_id || user?.username || 'Agent'}{' '}
                  <span className="text-[#64748B]">(You)</span>
                </div>
                <div className="text-[12px] text-[#64748B]">Master Level - Root Agent</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">
                  Total Allocation
                </div>
                <div className="font-mono text-[18px] font-bold text-[#00C37B]">
                  {fmt(balance ?? 0)}{' '}
                  <span className="text-[12px] font-normal text-[#64748B]">CR</span>
                </div>
              </div>
              <div className="h-8 w-px bg-[#1E293B]" />
              <div className="text-right">
                <div className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">
                  Network Size
                </div>
                <div className="font-mono text-[18px] font-bold text-white">
                  {totalNetworkMembers}{' '}
                  <span className="text-[12px] font-normal text-[#64748B]">members</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Agent Tree */}
        {subAgentsQuery.isLoading ? (
          <div className="mt-6 pl-10">
            <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 text-[13px] text-[#94A3B8]">
              Loading sub-agents...
            </div>
          </div>
        ) : subAgents.length === 0 ? (
          <div className="mt-6 pl-10">
            <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 text-center text-[13px] text-[#64748B]">
              No sub-agents in your network yet.
            </div>
          </div>
        ) : (
          <div className="relative mt-2 pl-10">
            {/* Vertical connector line */}
            <div
              className="absolute left-5 top-0 w-px bg-[#1E293B]"
              style={{ height: `calc(100% - 1.5rem)` }}
            />

            {subAgents.map((sa) => (
              <div key={sa.id} className="relative mt-4">
                {/* Horizontal connector */}
                <div className="absolute left-[-20px] top-6 h-px w-5 bg-[#1E293B]" />

                {/* Sub-Agent Card */}
                <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4 transition-colors hover:border-[#2D3B50]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1E293B] bg-[#111827] text-[13px] font-bold text-[#F59E0B]">
                        {(sa.display_id || sa.username || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-white">
                          {sa.display_id || sa.username || `Sub-Agent #${sa.id}`}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          ID: {sa.display_id || `#${sa.id}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md border border-[#1E293B] bg-[#0B0E1A] px-3 py-1 text-[12px]">
                        <span className="text-[#64748B]">Credits: </span>
                        <span className="font-mono font-semibold text-[#00C37B]">
                          {fmt(parseAmount(sa.balance))}
                        </span>
                      </span>
                      <span className="rounded-md border border-[#1E293B] bg-[#0B0E1A] px-3 py-1 text-[12px]">
                        <span className="text-[#64748B]">Members: </span>
                        <span className="font-mono font-semibold text-white">
                          {sa.member_count ?? 0}
                        </span>
                      </span>
                      <a
                        href={`/agent/sub-agents/${sa.id}`}
                        className="text-[12px] font-medium text-[#64748B] transition-colors hover:text-[#3B82F6]"
                      >
                        Manage -&gt;
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA - Quick Credit Rebalance */}
      <div className="mx-auto mt-10 max-w-5xl">
        <div className="flex items-center justify-between rounded-xl border border-[rgba(59,130,246,0.15)] bg-[rgba(59,130,246,0.05)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(59,130,246,0.15)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white">Quick Credit Rebalance</h3>
              <p className="text-[13px] text-[#64748B]">
                Redistribute credits across your sub-agent network with a single action
              </p>
            </div>
          </div>
          <button className="rounded-lg bg-white px-5 py-2.5 text-[13px] font-bold text-black transition-opacity hover:opacity-90">
            Launch Rebalancer
          </button>
        </div>
      </div>

      {showCreateModal && (
        <CreateSubAgentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['agent', 'sub-agents'] })}
        />
      )}
    </div>
  );
}
