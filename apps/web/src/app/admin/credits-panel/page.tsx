'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

type LedgerRow = {
  id: number;
  created_at: string;
  from_user?: string;
  to_user?: string;
  from_display_id?: string;
  to_display_id?: string;
  type: string;
  amount: number | string;
  transaction_id?: string;
};

type LedgerEnvelope = { transactions: LedgerRow[]; total: number };

type AgentRow = { id: number; username?: string; display_id?: string; balance?: number | string };

function fmt(n: number | string | undefined): string {
  const val = typeof n === 'number' ? n : Number.parseFloat(String(n ?? 0));
  if (!Number.isFinite(val)) return '0';
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

function TypeBadge({ type }: { type: string }) {
  const t = (type || '').toLowerCase();
  if (t.includes('issu') || t.includes('mint') || t.includes('create')) {
    return <span className="bg-[rgba(0,195,123,0.1)] text-[#00C37B] border border-[rgba(0,195,123,0.2)] text-[9px] px-2 py-0.5 rounded uppercase font-bold">Issuance</span>;
  }
  if (t.includes('recall') || t.includes('revok')) {
    return <span className="bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.2)] text-[9px] px-2 py-0.5 rounded uppercase font-bold">Recall</span>;
  }
  return <span className="bg-[rgba(59,130,246,0.1)] text-[#3B82F6] border border-[rgba(59,130,246,0.2)] text-[9px] px-2 py-0.5 rounded uppercase font-bold">Distribution</span>;
}

function amountColor(type: string, amount: number): string {
  const t = (type || '').toLowerCase();
  if (t.includes('issu') || t.includes('mint') || t.includes('create')) return 'text-[#00C37B]';
  if (t.includes('recall') || t.includes('revok') || amount < 0) return 'text-[#EF4444]';
  return 'text-[#F1F5F9]';
}

export default function CreditsPage() {
  const qc = useQueryClient();
  const [mintAmount, setMintAmount] = useState('');
  const [mintPin, setMintPin] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data: ledgerData, isLoading: ledgerLoading } = useQuery({
    queryKey: ['admin', 'credits-ledger', page],
    queryFn: () => apiGet<LedgerEnvelope>(`/api/admin/credits/ledger?page=${page}&limit=${pageSize}`).then((r) => r.data || { transactions: [], total: 0 }),
    refetchInterval: 20_000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['admin', 'agents'],
    queryFn: () => apiGet<AgentRow[]>('/api/admin/agents').then((r) => r.data || []),
  });

  const filteredAgents = agents.filter((a) => {
    const q = agentSearch.toLowerCase();
    return !q || a.username?.toLowerCase().includes(q) || a.display_id?.toLowerCase().includes(q);
  });

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const mintMutation = useMutation({
    mutationFn: () => apiPost('/api/admin/credits/create', { amount: Number(mintAmount), pin: mintPin }),
    onSuccess: () => {
      setMintAmount('');
      setMintPin('');
      qc.invalidateQueries({ queryKey: ['admin', 'credits-ledger'] });
    },
  });

  const transferMutation = useMutation({
    mutationFn: () => apiPost('/api/credits/transfer', { to_user_id: selectedAgentId, amount: Number(transferAmount) }),
    onSuccess: () => {
      setTransferAmount('');
      setSelectedAgentId(null);
      setAgentSearch('');
      qc.invalidateQueries({ queryKey: ['admin', 'credits-ledger'] });
    },
  });

  const transactions = useMemo(() => ledgerData?.transactions || [], [ledgerData?.transactions]);
  const total = ledgerData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const exportCSV = useCallback(() => {
    if (transactions.length === 0) return;
    const header = 'Timestamp,Transaction ID,From,To,Type,Amount';
    const rows = transactions.map((tx) => {
      const ts = fmtDate(tx.created_at);
      const txId = tx.transaction_id || `TX-${tx.id}`;
      const from = tx.from_display_id || tx.from_user || 'Admin';
      const to = tx.to_display_id || tx.to_user || 'Admin';
      const type = tx.type || 'distribution';
      const amt = Number(tx.amount) || 0;
      return `"${ts}","${txId}","${from}","${to}","${type}",${amt}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transactions]);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100vh' }}>
      {/* Page Header */}
      <header className="h-16 bg-[#111827] border-b border-[#1E293B] px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-2 w-1/4">
          <div className="text-[#94A3B8] text-[13px] font-semibold uppercase tracking-wider">Admin Control Center</div>
        </div>

        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#00C37B]">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <h1 className="text-white font-bold text-[16px]">Credit Management</h1>
        </div>

        <div className="flex items-center justify-end gap-6 w-1/4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00C37B]" />
            <span className="text-[#94A3B8] text-[12px] font-semibold">System Secure</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 border-2 border-[#1E293B] shadow-lg" />
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-4 space-y-6">
            {/* Mint New Credits */}
            <div
              className="bg-[#111827] border border-[#1E293B] rounded-xl p-6"
              style={{ boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(0,195,123,0.18)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[rgba(0,195,123,0.1)] flex items-center justify-center text-[#00C37B]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-[15px]">Mint New Credits</h3>
                  <p className="text-[#64748B] text-[11px]">Increase total system supply</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider mb-2">Amount to Create</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#1A2235] border border-[#1E293B] rounded-lg py-3 px-4 text-white font-mono text-[18px] font-bold focus:outline-none focus:border-[#00C37B] focus:shadow-[0_0_0_2px_rgba(0,195,123,0.1)]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] font-bold text-[14px]">CR</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider mb-2">Security PIN</label>
                  <input
                    type="password"
                    value={mintPin}
                    onChange={(e) => setMintPin(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-[#1A2235] border border-[#1E293B] rounded-lg py-3 px-4 text-white font-mono tracking-widest focus:outline-none focus:border-[#00C37B]"
                  />
                </div>
                {mintMutation.isError && (
                  <p className="text-[#EF4444] text-xs">Failed to mint credits. Check PIN and try again.</p>
                )}
                {mintMutation.isSuccess && (
                  <p className="text-[#00C37B] text-xs">Credits minted successfully.</p>
                )}
                <button
                  onClick={() => mintMutation.mutate()}
                  disabled={mintMutation.isPending || !mintAmount || !mintPin}
                  className="w-full bg-[#00C37B] hover:bg-[#00a368] text-[#0B0E1A] font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {mintMutation.isPending ? 'Processing...' : 'Confirm Issuance'}
                </button>
              </div>
            </div>

            {/* Assign to Agent */}
            <div
              className="bg-[#111827] border border-[#1E293B] rounded-xl p-6"
              style={{ boxShadow: '0 0 0 1px #1E293B, 0 0 16px rgba(245,158,11,0.20)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.1)] flex items-center justify-center text-[#F59E0B]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <polyline points="16 11 18 13 22 9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-[15px]">Assign to Agent</h3>
                  <p className="text-[#64748B] text-[11px]">Distribute credits from Admin pool</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider mb-2">Select Agent</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={agentSearch}
                      onChange={(e) => { setAgentSearch(e.target.value); setSelectedAgentId(null); }}
                      placeholder="Search agent name..."
                      className="w-full bg-[#1A2235] border border-[#1E293B] rounded-lg py-2.5 px-10 text-white text-[13px] focus:outline-none focus:border-[#00C37B]"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  {agentSearch && filteredAgents.length > 0 && !selectedAgent && (
                    <div className="mt-1 bg-[#1A2235] border border-[#1E293B] rounded-lg overflow-hidden max-h-32 overflow-y-auto">
                      {filteredAgents.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => { setSelectedAgentId(a.id); setAgentSearch(a.username || a.display_id || `Agent #${a.id}`); }}
                          className="w-full text-left px-4 py-2 text-sm text-[#94A3B8] hover:bg-[#1E293B] hover:text-white"
                        >
                          {a.username || a.display_id || `Agent #${a.id}`}
                          <span className="ml-2 text-[#64748B] text-xs">{fmt(a.balance)} CR</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-[10px] font-bold uppercase tracking-wider mb-2">Transfer Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#1A2235] border border-[#1E293B] rounded-lg py-2.5 px-4 text-white font-mono font-bold text-[14px] focus:outline-none focus:border-[#00C37B]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] font-bold text-[11px]">CR</span>
                  </div>
                  {selectedAgent && (
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[#64748B] text-[10px]">Agent Balance: {fmt(selectedAgent.balance)} CR</span>
                      <button
                        type="button"
                        onClick={() => setTransferAmount(String(selectedAgent.balance || 0))}
                        className="text-[#F59E0B] text-[10px] font-bold hover:underline"
                      >
                        Max
                      </button>
                    </div>
                  )}
                </div>
                {transferMutation.isError && <p className="text-[#EF4444] text-xs">Transfer failed. Please try again.</p>}
                {transferMutation.isSuccess && <p className="text-[#00C37B] text-xs">Transfer completed.</p>}
                <button
                  onClick={() => transferMutation.mutate()}
                  disabled={transferMutation.isPending || !selectedAgentId || !transferAmount}
                  className="w-full bg-[#1A2235] border border-[#1E293B] hover:border-[#F59E0B] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {transferMutation.isPending ? 'Processing...' : 'Complete Transfer'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column — Transaction History */}
          <div className="col-span-8 bg-[#111827] border border-[#1E293B] rounded-xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[#1E293B] flex justify-between items-center bg-[#0B0E1A]/50">
              <div>
                <h3 className="text-white font-bold text-[15px]">Credit Transaction History</h3>
                <p className="text-[#64748B] text-[11px]">Real-time audit of all credit movements</p>
              </div>
              <button
                onClick={exportCSV}
                disabled={transactions.length === 0}
                className="bg-[#1A2235] border border-[#1E293B] text-[#94A3B8] text-[11px] px-3 py-1.5 rounded-md hover:text-white transition-colors disabled:opacity-40"
              >
                Export CSV
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#161b2e] border-b border-[#1E293B]">
                    <th className="py-3 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Timestamp</th>
                    <th className="py-3 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Transaction ID</th>
                    <th className="py-3 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">From / To</th>
                    <th className="py-3 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider">Type</th>
                    <th className="py-3 px-6 text-[#64748B] text-[10px] uppercase font-bold tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {ledgerLoading ? (
                    <tr><td colSpan={5} className="py-8 px-6 text-[#64748B]">Loading transactions...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 px-6 text-[#64748B]">No transactions found.</td></tr>
                  ) : (
                    transactions.map((tx) => {
                      const amt = Number(tx.amount) || 0;
                      const txType = tx.type || 'distribution';
                      return (
                        <tr key={tx.id} className="border-b border-[#1E293B] hover:bg-white/[0.03]">
                          <td className="py-4 px-6 font-mono text-[#64748B]">{fmtDate(tx.created_at)}</td>
                          <td className="py-4 px-6 font-mono text-[#94A3B8]">{tx.transaction_id || `TX-${tx.id}`}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className={`${txType.includes('issu') || txType.includes('mint') ? 'text-[#00C37B] font-bold' : txType.includes('recall') ? 'text-[#EF4444] font-bold' : 'text-[#64748B]'}`}>
                                {tx.from_display_id || tx.from_user || 'Admin'}
                              </span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                              <span className="text-white font-bold">
                                {tx.to_display_id || tx.to_user || 'Admin'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6"><TypeBadge type={txType} /></td>
                          <td className={`py-4 px-6 text-right font-mono font-bold ${amountColor(txType, amt)}`}>
                            {txType.includes('issu') || txType.includes('mint') ? '+' : txType.includes('recall') ? '-' : ''}{fmt(Math.abs(amt))} CR
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-[#1E293B] flex justify-between items-center text-[11px] text-[#64748B]">
              <span>
                Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()} transactions
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 rounded border border-[#1E293B] hover:bg-[#1A2235] disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2 py-1 rounded border font-bold ${
                      p === page
                        ? 'border-[#00C37B] bg-[#00C37B] text-[#0B0E1A]'
                        : 'border-[#1E293B] hover:bg-[#1A2235]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 rounded border border-[#1E293B] hover:bg-[#1A2235] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
