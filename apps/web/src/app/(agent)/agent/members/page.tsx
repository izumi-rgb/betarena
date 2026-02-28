'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPatch } from '@/lib/api';

type Row = {
  id: number;
  display_id: string;
  username: string;
  balance: number;
  open_bets?: number;
  total_bets?: number;
  pnl?: number;
  win_rate?: number;
  is_active?: boolean;
  last_active?: string;
};

export default function AgentMembersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [sort, setSort] = useState<'id' | 'balance' | 'pnl' | 'last_active'>('id');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<Row[]>('/api/agents/members');
        setRows((res.data || []).length ? (res.data || []) : demoRows);
      } catch {
        setRows(demoRows);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      const q = search.toLowerCase();
      const hit = !q || r.display_id?.toLowerCase().includes(q) || r.username?.toLowerCase().includes(q);
      const hitStatus = status === 'all' || (status === 'active' ? !!r.is_active : !r.is_active);
      return hit && hitStatus;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'balance') return (b.balance || 0) - (a.balance || 0);
      if (sort === 'pnl') return (b.pnl || 0) - (a.pnl || 0);
      if (sort === 'last_active') return (new Date(b.last_active || 0).getTime()) - (new Date(a.last_active || 0).getTime());
      return String(a.display_id).localeCompare(String(b.display_id));
    });

    return list;
  }, [rows, search, status, sort]);

  const toggleStatus = async (row: Row) => {
    const next = !(row.is_active !== false);
    try {
      await apiPatch(`/api/agents/members/${row.id}/status`, { is_active: next });
    } catch {
      // fallback only
    }
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, is_active: next } : r));
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] p-6 text-white">
      <h1 className="mb-4 text-2xl font-bold">Members</h1>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members" className="rounded-lg border border-[#1E293B] bg-[#1A2235] px-3 py-2" />
        <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'suspended')} className="rounded-lg border border-[#1E293B] bg-[#1A2235] px-3 py-2">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as 'id' | 'balance' | 'pnl' | 'last_active')} className="rounded-lg border border-[#1E293B] bg-[#1A2235] px-3 py-2">
          <option value="id">Sort: ID</option>
          <option value="balance">Sort: Balance</option>
          <option value="pnl">Sort: P&L</option>
          <option value="last_active">Sort: Last Active</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#1A2235]">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="bg-[#111827] text-xs uppercase text-[#64748B]">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="text-left">Nickname</th>
              <th className="text-left">Balance</th>
              <th className="text-left">Open Bets</th>
              <th className="text-left">Total Bets</th>
              <th className="text-left">P&L</th>
              <th className="text-left">Win Rate</th>
              <th className="text-left">Status</th>
              <th className="text-left">Last Active</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-[#1E293B]">
                <td className="px-3 py-2">{r.display_id}</td>
                <td>{r.username}</td>
                <td className="font-mono">{Number(r.balance || 0).toFixed(2)} CR</td>
                <td>{Number(r.open_bets || 0)}</td>
                <td>{Number(r.total_bets || 0)}</td>
                <td className={Number(r.pnl || 0) >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'}>{Number(r.pnl || 0).toFixed(2)}</td>
                <td>{Number(r.win_rate || 0).toFixed(1)}%</td>
                <td>{r.is_active !== false ? 'Active' : 'Suspended'}</td>
                <td>{r.last_active ? new Date(r.last_active).toLocaleString() : '-'}</td>
                <td className="space-x-2">
                  <Link href={`/agent/members/${r.id}`} className="rounded border border-[#1E293B] px-2 py-1">View</Link>
                  <button className="rounded border border-[#1E293B] px-2 py-1">Transfer Credits</button>
                  <button onClick={() => toggleStatus(r)} className="rounded border border-[#1E293B] px-2 py-1">{r.is_active !== false ? 'Suspend' : 'Activate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const demoRows: Row[] = Array.from({ length: 18 }).map((_, i) => ({
  id: i + 1,
  display_id: `MEM_${210 + i}`,
  username: `nick_${i + 1}`,
  balance: 80 + i * 13,
  open_bets: i % 4,
  total_bets: 20 + i,
  pnl: (i % 2 === 0 ? 1 : -1) * (10 + i * 2),
  win_rate: 35 + (i % 7) * 4,
  is_active: i % 6 !== 0,
  last_active: new Date(Date.now() - i * 3600 * 1000).toISOString(),
}));
