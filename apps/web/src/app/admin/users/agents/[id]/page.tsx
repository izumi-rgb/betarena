'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPatch } from '@/lib/api';

type MemberRow = { id: string; balance: number; openBets: number; pnl: number; status: string };
type SubAgentRow = { id: string; members: number; balance: number };

type AgentDetail = {
  id: string;
  displayId?: string;
  createdAt?: string;
  status?: string;
  balance?: number;
  totalCreditsReceived?: number;
  totalMembers?: number;
  pnl?: number;
  canCreateSubAgent?: boolean;
  members?: MemberRow[];
  subAgents?: SubAgentRow[];
  creditHistory?: Array<{ id: string; ts: string; amount: number; from: string; to: string }>;
};

export default function AdminAgentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const [data, setData] = useState<AgentDetail | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiGet<AgentDetail>(`/api/admin/agents/${id}`);
      setData(res.data);
    } catch {
      setData({
        id,
        displayId: id,
        createdAt: new Date().toISOString(),
        status: 'active',
        balance: 5000,
        totalCreditsReceived: 25000,
        totalMembers: 24,
        pnl: 1250,
        canCreateSubAgent: true,
        members: [{ id: 'M1001', balance: 320, openBets: 3, pnl: 44, status: 'active' }],
        subAgents: [{ id: 'SA12', members: 8, balance: 1200 }],
        creditHistory: [{ id: 'h1', ts: new Date().toISOString(), amount: 5000, from: 'Admin', to: id }],
      });
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patchStatus = async (status: 'active' | 'suspended') => {
    try {
      await apiPatch(`/api/admin/agents/${id}/status`, { status });
      setMessage(`Status updated to ${status}`);
      await load();
    } catch {
      setMessage('Failed to update status');
    }
  };

  const patchPrivilege = async (canCreateSubAgent: boolean) => {
    try {
      await apiPatch(`/api/admin/agents/${id}/privilege`, { canCreateSubAgent });
      setMessage('Privilege updated');
      await load();
    } catch {
      setMessage('Failed to update privilege');
    }
  };

  const stats = useMemo(() => [
    { label: 'Current Balance', value: `${(data?.balance || 0).toLocaleString()} CR` },
    { label: 'Total Credits Received', value: `${(data?.totalCreditsReceived || 0).toLocaleString()} CR` },
    { label: 'Total Members', value: String(data?.totalMembers || 0) },
    { label: 'Agent P&L', value: `${(data?.pnl || 0).toLocaleString()} CR` },
  ], [data]);

  if (!data) return <div className="min-h-screen bg-[#0B0E1A] p-6 text-[#94A3B8]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0B0E1A] p-6 text-white">
      <h1 className="text-2xl font-bold">Agent Detail</h1>
      {message ? <div className="mt-2 rounded border border-[#1E293B] bg-[#1A2235] px-3 py-2 text-sm text-[#94A3B8]">{message}</div> : null}

      <section className="mt-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded bg-[#111827] px-3 py-1 text-sm font-semibold">{data.displayId || data.id}</span>
          <span className={`rounded px-2 py-1 text-xs ${data.status === 'active' ? 'bg-[#00C37B]/20 text-[#00C37B]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>{data.status}</span>
          <span className="text-sm text-[#94A3B8]">Created: {new Date(data.createdAt || Date.now()).toLocaleDateString()}</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => patchStatus('suspended')} className="rounded border border-[#EF4444] px-3 py-1.5 text-sm text-[#EF4444]">Suspend</button>
            <button onClick={() => patchStatus('active')} className="rounded border border-[#00C37B] px-3 py-1.5 text-sm text-[#00C37B]">Activate</button>
            <button onClick={() => patchPrivilege(!(data.canCreateSubAgent || false))} className="rounded border border-[#1E293B] px-3 py-1.5 text-sm">Edit Privilege</button>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-4">
        {stats.map((s) => <div key={s.label} className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4"><div className="text-xs text-[#64748B]">{s.label}</div><div className="mt-1 text-lg font-bold">{s.value}</div></div>)}
      </section>

      <section className="mt-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
        <h2 className="font-semibold">Privilege</h2>
        <label className="mt-2 flex items-center justify-between text-sm">
          <span>Master Agent Status / Sub-Agent Creation Rights</span>
          <input type="checkbox" checked={!!data.canCreateSubAgent} onChange={(e) => patchPrivilege(e.target.checked)} />
        </label>
      </section>

      <section className="mt-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
        <h2 className="mb-2 font-semibold">Members</h2>
        <table className="w-full text-sm"><thead className="text-xs text-[#64748B]"><tr><th className="text-left">ID</th><th>Balance</th><th>Open Bets</th><th>P&L</th><th>Status</th><th>Actions</th></tr></thead><tbody>{(data.members || []).map((m) => <tr key={m.id} className="border-t border-[#1E293B]"><td>{m.id}</td><td>{m.balance}</td><td>{m.openBets}</td><td>{m.pnl}</td><td>{m.status}</td><td>View</td></tr>)}</tbody></table>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4"><h2 className="mb-2 font-semibold">Sub-agents</h2>{(data.subAgents || []).map((s) => <div key={s.id} className="mb-2 rounded border border-[#1E293B] bg-[#111827] px-3 py-2 text-sm">{s.id} · Members: {s.members} · Balance: {s.balance} CR</div>)}</div>
        <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4"><h2 className="mb-2 font-semibold">Credit History</h2>{(data.creditHistory || []).map((h) => <div key={h.id} className="mb-2 rounded border border-[#1E293B] bg-[#111827] px-3 py-2 text-sm">{new Date(h.ts).toLocaleString()} · {h.from} → {h.to} · {h.amount} CR</div>)}</div>
      </section>
    </div>
  );
}
