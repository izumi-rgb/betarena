'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPatch } from '@/lib/api';

type MemberRow = {
  id: number;
  display_id: string;
  username: string;
  parent_agent_id?: number;
  balance?: number;
  total_bets?: number;
  pnl?: number;
  is_active?: boolean;
  created_at?: string;
};

export default function AdminMembersPage() {
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [agent, setAgent] = useState('all');

  const load = async () => {
    try {
      const res = await apiGet<MemberRow[]>('/api/admin/members');
      const data = res.data || [];
      setRows(data.length ? data : demoRows);
    } catch {
      setRows(demoRows);
    }
  };

  useEffect(() => { load(); }, []);

  const agents = useMemo(() => ['all', ...Array.from(new Set(rows.map((r) => String(r.parent_agent_id || 'N/A'))))], [rows]);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const hitSearch = !q || r.display_id?.toLowerCase().includes(q) || r.username?.toLowerCase().includes(q);
    const hitStatus = status === 'all' || (status === 'active' ? !!r.is_active : !r.is_active);
    const hitAgent = agent === 'all' || String(r.parent_agent_id || 'N/A') === agent;
    return hitSearch && hitStatus && hitAgent;
  });

  const totalActive = filtered.filter((r) => r.is_active !== false).length;
  const totalSuspended = filtered.length - totalActive;
  const totalBalance = filtered.reduce((acc, r) => acc + Number(r.balance || 0), 0);

  const toggleStatus = async (row: MemberRow) => {
    const next = !(row.is_active !== false);
    try {
      await apiPatch(`/api/admin/members/${row.id}/status`, { is_active: next });
    } catch {
      // fallback only
    }
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, is_active: next } : r));
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] p-6 text-white">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold">All Members</h1>
        <span className="rounded-full bg-[#1A2235] px-3 py-1 text-xs text-[#00C37B]">{filtered.length}</span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by member ID or nickname" className="rounded-lg border border-[#1E293B] bg-[#1A2235] px-3 py-2" />
        <select value={agent} onChange={(e) => setAgent(e.target.value)} className="rounded-lg border border-[#1E293B] bg-[#1A2235] px-3 py-2">
          {agents.map((a) => <option key={a} value={a}>{a === 'all' ? 'All Agents' : `Agent ${a}`}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'suspended')} className="rounded-lg border border-[#1E293B] bg-[#1A2235] px-3 py-2">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <input type="date" className="rounded-lg border border-[#1E293B] bg-[#1A2235] px-3 py-2" />
      </div>

      <div className="mb-4 rounded-lg border border-[#1E293B] bg-[#1A2235] p-3 text-sm text-[#94A3B8]">
        Total Active: <span className="text-white">{totalActive}</span> | Total Suspended: <span className="text-white">{totalSuspended}</span> | Total Balance in circulation: <span className="font-mono text-[#00C37B]">{totalBalance.toFixed(2)} CR</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#1A2235]">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-[#111827] text-xs uppercase text-[#64748B]">
            <tr>
              <th className="px-3 py-2 text-left">Member ID</th>
              <th className="text-left">Agent</th>
              <th className="text-left">Balance</th>
              <th className="text-left">Total Bets</th>
              <th className="text-left">P&L</th>
              <th className="text-left">Status</th>
              <th className="text-left">Joined</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((r) => (
              <tr key={r.id} className="border-t border-[#1E293B]">
                <td className="px-3 py-2">{r.display_id || `MEM-${r.id}`}</td>
                <td>Agent_{r.parent_agent_id || 'N/A'}</td>
                <td className="font-mono">{Number(r.balance || 0).toFixed(2)} CR</td>
                <td>{Number(r.total_bets || 0)}</td>
                <td className={Number(r.pnl || 0) >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'}>{Number(r.pnl || 0).toFixed(2)}</td>
                <td>{r.is_active !== false ? 'Active' : 'Suspended'}</td>
                <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                <td className="space-x-2">
                  <Link href={`/agent/members/${r.id}`} className="rounded border border-[#1E293B] px-2 py-1">View</Link>
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

const demoRows: MemberRow[] = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  display_id: `MEM_${100 + i}`,
  username: `member_${i + 1}`,
  parent_agent_id: i % 3 === 0 ? 20 : 21,
  balance: 100 + i * 23,
  total_bets: 20 + i * 3,
  pnl: (i % 2 === 0 ? 1 : -1) * (20 + i * 2),
  is_active: i % 5 !== 0,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));
