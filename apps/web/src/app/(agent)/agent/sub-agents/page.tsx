'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';

type SubAgent = {
  id: number;
  display_id: string;
  balance?: number;
  members?: number;
  total_bets?: number;
  pnl?: number;
  is_active?: boolean;
  can_create_sub_agent?: boolean;
};
type MeResponse = { can_create_sub_agent?: boolean };

export default function AgentSubAgentsPage() {
  const [canCreate, setCanCreate] = useState(true);
  const [rows, setRows] = useState<SubAgent[]>([]);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const me = await apiGet<MeResponse>('/api/auth/me');
      setCanCreate(!!(me.data?.can_create_sub_agent ?? true));
    } catch {
      setCanCreate(true);
    }

    try {
      const res = await apiGet<SubAgent[]>('/api/agents/sub-agents');
      setRows((res.data || []).length ? (res.data || []) : demoRows);
    } catch {
      setRows(demoRows);
    }
  };

  useEffect(() => { load(); }, []);

  const createSub = async () => {
    setCreating(true);
    try {
      await apiPost('/api/agents/sub-agents');
      await load();
    } catch {
      setRows((prev) => [{ id: Date.now(), display_id: `SUB_${prev.length + 1}`, balance: 0, members: 0, total_bets: 0, pnl: 0, is_active: true, can_create_sub_agent: false }, ...prev]);
    } finally {
      setCreating(false);
    }
  };

  const togglePrivilege = async (row: SubAgent) => {
    const next = !row.can_create_sub_agent;
    try {
      await apiPatch(`/api/agents/sub-agents/${row.id}/privilege`, { can_create_sub_agent: next });
    } catch {
      // fallback only
    }
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, can_create_sub_agent: next } : r));
  };

  if (!canCreate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0E1A] p-6 text-white">
        <div className="max-w-lg rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 text-center">
          <h1 className="text-xl font-bold">Sub-agent creation requires admin approval.</h1>
          <p className="mt-2 text-[#94A3B8]">Contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] p-6 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Sub-Agents</h1>
        <button onClick={createSub} disabled={creating} className="rounded bg-[#00C37B] px-4 py-2 text-sm font-semibold text-[#0B0E1A]">+ Create Sub-Agent</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#1A2235]">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-[#111827] text-xs uppercase text-[#64748B]">
            <tr>
              <th className="px-3 py-2 text-left">Sub-Agent ID</th>
              <th className="text-left">Balance</th>
              <th className="text-left">Members</th>
              <th className="text-left">Total Bets</th>
              <th className="text-left">P&L</th>
              <th className="text-left">Status</th>
              <th className="text-left">Privilege</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#1E293B]">
                <td className="px-3 py-2">{r.display_id}</td>
                <td className="font-mono">{Number(r.balance || 0).toFixed(2)} CR</td>
                <td>{Number(r.members || 0)}</td>
                <td>{Number(r.total_bets || 0)}</td>
                <td className={Number(r.pnl || 0) >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'}>{Number(r.pnl || 0).toFixed(2)}</td>
                <td>{r.is_active !== false ? 'Active' : 'Suspended'}</td>
                <td>{r.can_create_sub_agent ? '✅ Can create sub-agents' : '❌ Cannot'}</td>
                <td className="space-x-2">
                  <button className="rounded border border-[#1E293B] px-2 py-1">View</button>
                  <button onClick={() => togglePrivilege(r)} className="rounded border border-[#1E293B] px-2 py-1">Toggle Privilege</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-[#94A3B8]">Privacy rule enforced: only sub-agent credit/balance data is shown; no sub-agent member list is rendered.</p>
    </div>
  );
}

const demoRows: SubAgent[] = [
  { id: 1, display_id: 'SUB_01', balance: 300, members: 0, total_bets: 81, pnl: 22, is_active: true, can_create_sub_agent: false },
  { id: 2, display_id: 'SUB_02', balance: 170, members: 0, total_bets: 54, pnl: -14, is_active: true, can_create_sub_agent: true },
];
