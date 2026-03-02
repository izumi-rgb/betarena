'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { BalanceBadge } from '@/components/app/BalanceBadge';

type TxType = 'all' | 'received' | 'bet_placed' | 'won' | 'lost' | 'void' | 'cash_out';

type TxRow = {
  id: number | string;
  createdAt: string;
  type: TxType;
  description: string;
  amount: number;
};

const NAV = [
  { href: '/sports', label: 'Sports' },
  { href: '/in-play', label: 'In-Play' },
  { href: '/live', label: 'Live Stream' },
  { href: '/my-bets', label: 'My Bets' },
  { href: '/results', label: 'Results' },
  { href: '/account', label: 'Account' },
];

const TYPE_LABELS: Record<TxType, string> = {
  all: 'All',
  received: 'Received',
  bet_placed: 'Bet Placed',
  won: 'Won',
  lost: 'Lost',
  void: 'Void',
  cash_out: 'Cash Out',
};

const TYPE_ICON: Record<TxType, string> = {
  all: '•',
  received: '💰',
  bet_placed: '🎯',
  won: '🏆',
  lost: '❌',
  void: '⚪',
  cash_out: '💵',
};

type TransactionsApiResponse = {
  transactions: Array<{
    id: number;
    amount: number | string;
    created_at: string;
    type: string;
    note?: string;
  }>;
};

function parseAmount(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapApiType(rawType: string): TxType {
  if (rawType === 'transfer') return 'received';
  if (rawType === 'create') return 'received';
  if (rawType === 'deduct') return 'bet_placed';
  return 'all';
}

function TopHeader() {
  const pathname = usePathname();
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#1E293B] bg-[#111827]/80 px-6">
      <nav className="flex gap-1">
        {NAV.map((t) => (
          <Link key={t.href} href={t.href} className={`rounded px-4 py-2 text-sm ${pathname === t.href ? 'bg-[#1A2235] text-white' : 'text-[#94A3B8] hover:bg-[#1A2235]'}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <BalanceBadge className="rounded-full border border-[#1E293B] bg-[#0B0E1A] px-3 py-1.5 font-mono text-[#00C37B]" />
    </header>
  );
}

export default function TransactionsPage() {
  const [type, setType] = useState<TxType>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<TxRow[]>([]);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ page: '1', limit: '200', ts: String(Date.now()) });
      const res = await apiGet<TransactionsApiResponse>(`/api/credits/transactions?${qs.toString()}`, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      const allRows = (res.data?.transactions || []).map((transaction): TxRow => ({
        id: transaction.id,
        createdAt: transaction.created_at,
        type: mapApiType(transaction.type),
        description: transaction.note || transaction.type,
        amount: parseAmount(transaction.amount),
      }));

      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
      }

      const data = allRows.filter((row) => {
        if (type !== 'all' && row.type !== type) return false;
        const rowDate = new Date(row.createdAt);
        if (fromDate && rowDate < fromDate) return false;
        if (toDate && rowDate > toDate) return false;
        return true;
      });
      setRows(data);
    } catch {
      setRows([]);
    }
  }, [from, to, type]);

  useEffect(() => {
    load();
  }, [load]);

  const paged = useMemo(() => rows.slice((page - 1) * 20, page * 20), [rows, page]);
  const totalPages = Math.max(1, Math.ceil(rows.length / 20));

  const exportCsv = () => {
    const headers = ['DateTime', 'Type', 'Description', 'Amount'];
    const lines = rows.map((row) => [
      new Date(row.createdAt).toISOString(),
      TYPE_LABELS[row.type],
      `"${(row.description || '').replace(/"/g, '""')}"`,
      row.amount.toFixed(2),
    ].join(','));
    const csv = [headers.join(','), ...lines].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] text-white">
      <TopHeader />
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-bold">Transaction History</h1>

        <section className="mt-4 grid gap-3 rounded-xl border border-[#1E293B] bg-[#1A2235] p-4 md:grid-cols-[1fr_170px_170px_auto]">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABELS) as TxType[]).map((k) => (
              <button key={k} onClick={() => setType(k)} className={`rounded px-3 py-1.5 text-xs ${type === k ? 'bg-[#00C37B] text-[#0B0E1A]' : 'bg-[#0B0E1A] text-[#94A3B8]'}`}>
                {TYPE_LABELS[k]}
              </button>
            ))}
          </div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-2" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-2" />
          <button onClick={exportCsv} className="rounded border border-[#00C37B] px-4 py-2 text-[#00C37B]">📥 Export CSV</button>
        </section>

        <section className="mt-4 overflow-hidden rounded-xl border border-[#1E293B] bg-[#1A2235]">
          <div className="grid grid-cols-[180px_120px_1fr_140px] border-b border-[#1E293B] px-4 py-3 text-xs uppercase text-[#64748B]">
            <div>Date/Time</div><div>Type</div><div>Description</div><div>Amount</div>
          </div>
          {paged.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[#94A3B8]">No transactions found.</div>
          ) : null}
          {paged.map((r) => (
            <div key={r.id} className="grid grid-cols-[180px_120px_1fr_140px] border-b border-[#1E293B] px-4 py-3 text-sm">
              <div className="text-[#94A3B8]">{new Date(r.createdAt).toLocaleString()}</div>
              <div>{TYPE_ICON[r.type]} {TYPE_LABELS[r.type]}</div>
              <div className="text-white">{r.description}</div>
              <div className={r.amount >= 0 ? 'font-mono text-[#00C37B]' : 'font-mono text-[#EF4444]'}>{r.amount >= 0 ? '+' : ''}{r.amount.toFixed(2)} CR</div>
            </div>
          ))}
        </section>

        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-[#1E293B] px-3 py-1.5 disabled:opacity-40">Prev</button>
          <span className="text-[#94A3B8]">{page}/{totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded border border-[#1E293B] px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      </main>
    </div>
  );
}
