'use client';

import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/api';

type AgentRow = { id: string; name: string; status: 'active' | 'suspended'; master: boolean; canCreateSubAgent: boolean; members: number };
type AgentApiRow = { id?: string | number; display_id?: string; username?: string; status?: 'active' | 'suspended'; can_create_sub_agent?: boolean; members?: number };

export default function AdminPrivilegesPage() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [selected, setSelected] = useState<AgentRow | null>(null);
  const [draft, setDraft] = useState<{ master: boolean; canCreateSubAgent: boolean }>({ master: false, canCreateSubAgent: false });
  const [confirming, setConfirming] = useState(false);

  const load = async () => {
    try {
      const res = await apiGet<AgentApiRow[]>('/api/admin/agents');
      const mapped = (res.data || []).map((a, i) => ({
        id: String(a.display_id || a.id || `Agent_${20 + i}`),
        name: a.username || a.display_id || `Agent_${20 + i}`,
        status: (a.status || 'active') as 'active' | 'suspended',
        master: !!a.can_create_sub_agent,
        canCreateSubAgent: !!a.can_create_sub_agent,
        members: Number(a.members || 0),
      }));
      setRows(mapped.length ? mapped : [
        { id: 'Agent_20', name: 'Agent_20', status: 'active', master: true, canCreateSubAgent: true, members: 24 },
        { id: 'Agent_21', name: 'Agent_21', status: 'active', master: false, canCreateSubAgent: false, members: 12 },
        { id: 'Agent_22', name: 'Agent_22', status: 'suspended', master: false, canCreateSubAgent: false, members: 8 },
      ]);
    } catch {
      setRows([
        { id: 'Agent_20', name: 'Agent_20', status: 'active', master: true, canCreateSubAgent: true, members: 24 },
        { id: 'Agent_21', name: 'Agent_21', status: 'active', master: false, canCreateSubAgent: false, members: 12 },
        { id: 'Agent_22', name: 'Agent_22', status: 'suspended', master: false, canCreateSubAgent: false, members: 8 },
      ]);
    }
  };

  useEffect(() => { load(); }, []);

  const openManage = (row: AgentRow) => {
    setSelected(row);
    setDraft({ master: row.master, canCreateSubAgent: row.canCreateSubAgent });
    setConfirming(false);
  };

  const save = async () => {
    if (!selected) return;
    try {
      await apiPatch(`/api/admin/agents/${selected.id}/privilege`, { canCreateSubAgent: draft.canCreateSubAgent || draft.master });
    } catch {
      // local fallback
    }
    setRows((prev) => prev.map((r) => r.id === selected.id ? { ...r, master: draft.master, canCreateSubAgent: draft.canCreateSubAgent } : r));
    setSelected(null);
    setConfirming(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] p-6 text-white">
      <h1 className="text-2xl font-bold">Privilege Management</h1>
      <p className="mb-4 text-sm text-[#94A3B8]">Control who can create sub-agents</p>

      <div className="overflow-hidden rounded-xl border border-[#1E293B] bg-[#1A2235]">
        <table className="w-full text-sm">
          <thead className="bg-[#111827] text-xs uppercase text-[#64748B]">
            <tr><th className="px-3 py-2 text-left">Agent ID</th><th className="text-left">Name</th><th className="text-left">Status</th><th>Master Agent</th><th>Can Create Sub-Agents</th><th>Members</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#1E293B]">
                <td className="px-3 py-2">{r.id}</td>
                <td>{r.name}</td>
                <td>{r.status === 'active' ? '🟢 Active' : '🔴 Suspended'}</td>
                <td className="text-center">{r.master ? '✅ Master' : '❌ Standard'}</td>
                <td className="text-center">{r.canCreateSubAgent ? '✅ Can create' : '❌ Cannot'}</td>
                <td className="text-center">{r.members}</td>
                <td className="text-center"><button onClick={() => openManage(r)} className="rounded border border-[#1E293B] px-3 py-1.5">Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="fixed inset-y-0 right-0 w-[360px] border-l border-[#1E293B] bg-[#111827] p-4">
          <h2 className="text-lg font-semibold">Manage {selected.id}</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between text-sm"><span>Grant Master Agent Status</span><input type="checkbox" checked={draft.master} onChange={(e) => setDraft((d) => ({ ...d, master: e.target.checked }))} /></label>
            <label className="flex items-center justify-between text-sm"><span>Allow Sub-Agent Creation</span><input type="checkbox" checked={draft.canCreateSubAgent} onChange={(e) => setDraft((d) => ({ ...d, canCreateSubAgent: e.target.checked }))} /></label>
          </div>

          {confirming ? (
            <div className="mt-4 rounded border border-[#1E293B] bg-[#1A2235] p-3 text-sm text-[#94A3B8]">
              Are you sure? This will allow {selected.id} to create sub-agents under their account.
            </div>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button onClick={() => setConfirming(true)} className="rounded border border-[#1E293B] px-3 py-1.5">Save</button>
            <button onClick={() => setSelected(null)} className="rounded border border-[#1E293B] px-3 py-1.5">Cancel</button>
            {confirming ? <button onClick={save} className="rounded bg-[#00C37B] px-3 py-1.5 font-semibold text-[#0B0E1A]">Confirm</button> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
