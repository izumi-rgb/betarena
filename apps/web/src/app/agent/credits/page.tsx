'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';
import { useBalance } from '@/hooks/useBalance';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MemberRow = {
  id: number;
  display_id?: string;
  username?: string;
  balance?: number | string;
  open_bets?: number;
};

type TxRow = {
  id: number;
  created_at: string;
  amount: number | string;
  type: string;
  note?: string;
  recipient_display_id?: string;
  recipient_username?: string;
};

type TransactionsEnvelope = { transactions: TxRow[] };

type TxFilter = 'all' | 'transfers' | 'topups';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseAmount(value: number | string | undefined): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ------------------------------------------------------------------ */
/*  Icons (inline SVGs)                                                */
/* ------------------------------------------------------------------ */

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#00C37B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AgentCreditsPage() {
  const user = useAuthStore((s) => s.user);

  /* ---------- queries ---------- */
  const membersQuery = useQuery({
    queryKey: ['agent', 'members', 'credits'],
    queryFn: () => apiGet<MemberRow[]>('/api/agents/members').then((r) => r.data || []),
  });

  const transactionsQuery = useQuery({
    queryKey: ['agent', 'credits', 'transactions'],
    queryFn: () => apiGet<TransactionsEnvelope>('/api/credits/transactions?page=1&limit=100').then((r) => r.data?.transactions || []),
  });

  const { balance, refetch: refetchBalance } = useBalance();

  /* ---------- form state ---------- */
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------- filter state ---------- */
  const [txFilter, setTxFilter] = useState<TxFilter>('all');

  /* ---------- transfer handler ---------- */
  const submitTransfer = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedMemberId) {
      toast({ title: 'Select member', description: 'Choose a member before transferring credits.', variant: 'destructive' });
      return;
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast({ title: 'Invalid amount', description: 'Enter a valid transfer amount.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost('/api/credits/transfer', {
        to_user_id: Number(selectedMemberId),
        amount: numericAmount,
      });
      await Promise.all([membersQuery.refetch(), transactionsQuery.refetch(), refetchBalance()]);
      toast({ title: 'Transfer complete', description: `${fmt(numericAmount)} credits sent successfully.` });
      setAmount('');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Transfer failed';
      toast({ title: 'Transfer failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- derived data ---------- */
  const members = membersQuery.data || [];
  const transactions = transactionsQuery.data || [];

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === 'all') return true;
    if (txFilter === 'transfers') return tx.type?.toLowerCase().includes('transfer');
    if (txFilter === 'topups') return tx.type?.toLowerCase().includes('top') || tx.type?.toLowerCase().includes('deposit');
    return true;
  });

  const sortedMembers = [...members]
    .map((m) => ({ ...m, balanceNum: parseAmount(m.balance) }))
    .sort((a, b) => b.balanceNum - a.balanceNum);

  /* ---------- render ---------- */
  return (
    <main className="min-h-screen bg-[#0B0E1A] p-6 text-white">
      <div className="mx-auto max-w-[1400px]">
        {/* ============ HEADER ============ */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-[24px] font-bold">Credit Management</h1>
          <button className="flex items-center gap-2 rounded-md border border-[#1E293B] bg-[#111827] px-4 py-2 text-sm text-[#94A3B8] hover:text-white transition-colors">
            <DownloadIcon />
            Export Log
          </button>
        </header>

        {/* ============ TOP ROW ============ */}
        <div className="mb-6 grid grid-cols-12 gap-6">
          {/* --- Balance Card (col-span-4) --- */}
          <div className="col-span-12 lg:col-span-4">
            <div className="h-full rounded-xl border border-[#1E293B] border-l-4 border-l-[#00C37B] bg-[#111827] p-6">
              <p className="mb-1 text-sm text-[#94A3B8]">Total Credit Balance</p>
              <p className="font-mono text-[36px] font-bold leading-tight text-[#00C37B]">
                {fmt(balance)}
                <span className="ml-2 text-[18px] font-semibold text-[#94A3B8]">CR</span>
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-[#64748B]">
                  Agent: <span className="font-mono text-[#94A3B8]">{user?.username || user?.display_id || '—'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#00C37B]" />
                  <span className="text-[#00C37B]">Active</span>
                </span>
              </div>
            </div>
          </div>

          {/* --- Quick Transfer (col-span-8) --- */}
          <div className="col-span-12 lg:col-span-8">
            <div className="h-full rounded-xl border border-[#1E293B] bg-[#111827] p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircleIcon />
                <h2 className="text-lg font-bold">Quick Transfer to Member</h2>
              </div>

              <form onSubmit={submitTransfer} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {/* Member select */}
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs text-[#64748B] uppercase tracking-wider">Member</label>
                  <div className="relative">
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="w-full appearance-none bg-[#0B0E1A] border border-[#1E293B] rounded-md text-white p-2.5 text-sm focus:border-[#00C37B] outline-none pr-10"
                    >
                      <option value="">Select member...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.display_id || m.username || `Member ${m.id}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                </div>

                {/* Amount input */}
                <div className="w-full sm:w-[200px]">
                  <label className="mb-1.5 block text-xs text-[#64748B] uppercase tracking-wider">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0B0E1A] border border-[#1E293B] rounded-md text-white p-2.5 text-sm font-mono focus:border-[#00C37B] outline-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#00C37B] text-black font-bold py-2.5 px-5 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap text-sm"
                >
                  {isSubmitting ? 'Sending...' : 'Assign Credits'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ============ BOTTOM ROW ============ */}
        <div className="grid grid-cols-12 gap-6">
          {/* --- Transaction History (col-span-8) --- */}
          <div className="col-span-12 lg:col-span-8">
            <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between border-b border-[#1E293B] px-6 py-4">
                <h2 className="text-lg font-bold">Recent Transaction History</h2>
                <div className="flex gap-1">
                  {(['all', 'transfers', 'topups'] as TxFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setTxFilter(f)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        txFilter === f
                          ? 'bg-[#00C37B]/15 text-[#00C37B]'
                          : 'text-[#64748B] hover:text-white'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'transfers' ? 'Transfers' : 'Top-ups'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_1fr_100px_90px_90px] border-b border-[#1E293B] px-6 py-3 text-xs uppercase tracking-wider text-[#64748B]">
                <div>Timestamp</div>
                <div>Recipient</div>
                <div className="text-right">Amount</div>
                <div className="text-center">Status</div>
                <div className="text-center">Type</div>
              </div>

              {/* Rows */}
              {transactionsQuery.isLoading ? (
                <div className="px-6 py-8 text-center text-sm text-[#64748B]">Loading transactions...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-[#64748B]">No transactions found.</div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto">
                  {filteredTransactions.map((tx) => {
                    const amountValue = parseAmount(tx.amount);
                    const isPositive = amountValue >= 0;
                    return (
                      <div
                        key={tx.id}
                        className="grid grid-cols-[1fr_1fr_100px_90px_90px] items-center border-b border-[#1E293B] px-6 py-3 text-sm hover:bg-[#232d42] transition-colors"
                      >
                        {/* Timestamp */}
                        <div className="font-mono text-[#94A3B8] text-xs">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>

                        {/* Recipient */}
                        <div className="text-white truncate">
                          {tx.recipient_display_id || tx.recipient_username || tx.note || '--'}
                        </div>

                        {/* Amount */}
                        <div className="text-right font-mono font-bold">
                          <span className={isPositive ? 'text-[#00C37B]' : 'text-[#EF4444]'}>
                            {isPositive ? '+' : ''}
                            {fmt(amountValue)}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="text-center">
                          <span className="inline-block rounded-full bg-[#00C37B]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#00C37B]">
                            Completed
                          </span>
                        </div>

                        {/* Type */}
                        <div className="text-center text-xs text-[#94A3B8] capitalize">
                          {tx.type || '--'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* --- Outstanding Balances (col-span-4) --- */}
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] overflow-hidden">
              <div className="border-b border-[#1E293B] px-6 py-4">
                <h2 className="text-lg font-bold">Outstanding Balances</h2>
              </div>

              {membersQuery.isLoading ? (
                <div className="px-6 py-8 text-center text-sm text-[#64748B]">Loading members...</div>
              ) : sortedMembers.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-[#64748B]">No members found.</div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto">
                  {sortedMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between border-b border-[#1E293B] px-6 py-3 hover:bg-[#232d42] transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {m.username || m.display_id || `Member ${m.id}`}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {m.display_id ? `ID: ${m.display_id}` : `#${m.id}`}
                          {typeof m.open_bets === 'number' && (
                            <span className="ml-2">
                              {m.open_bets} active bet{m.open_bets !== 1 ? 's' : ''}
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="font-mono text-sm font-bold text-[#00C37B]">
                        {fmt(m.balanceNum)} <span className="text-[#64748B] text-xs font-normal">CR</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer link */}
              <div className="border-t border-[#1E293B] px-6 py-3">
                <Link
                  href="/agent/members"
                  className="block text-center text-sm font-medium text-[#00C37B] hover:underline"
                >
                  View All Member Balances
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
