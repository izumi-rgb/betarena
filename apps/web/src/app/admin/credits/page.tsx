'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

type LedgerRow = { id: string; timestamp: string; from: string; to: string; amount: number; type: string; balanceAfter: number };

type Agent = { id: string | number; display_id?: string; username?: string };
type Overview = { balance?: number };

export default function AdminCreditsPage() {
  const [amount, setAmount] = useState('100000');
  const [assignAmount, setAssignAmount] = useState('5000');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState('');
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [agentsRes, overviewRes, ledgerRes] = await Promise.all([
        apiGet<Agent[]>('/api/admin/agents'),
        apiGet<Overview>('/api/credits/admin/overview'),
        apiGet<LedgerRow[]>('/api/admin/credits/ledger'),
      ]);
      setAgents(agentsRes.data || []);
      setAgentId(String(agentsRes.data?.[0]?.id || ''));
      setBalance(Number(overviewRes.data?.balance || 0));
      setLedger((ledgerRes.data || []).map((r, i) => ({ ...r, id: String(r.id || i) })));
    } catch {
      setBalance(0);
      setLedger([]);
      setAgents([]);
      setAgentId('');
      setLoadError(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createCredits = async () => {
    try {
      await apiPost('/api/admin/credits/create', { amount: Number(amount) });
      setMessage(`+${Number(amount).toLocaleString()}.00 CR added to your balance`);
      await load();
    } catch {
      setMessage('Failed to create credits');
    }
  };

  const assignCredits = async () => {
    if (Number(assignAmount) > balance) {
      setMessage('Cannot assign more than current balance');
      return;
    }
    try {
      await apiPost('/api/credits/transfer', { to_user_id: Number(agentId), amount: Number(assignAmount) });
      setMessage(`Assigned ${assignAmount} CR to ${agentId}`);
      await load();
    } catch {
      setMessage('Failed to assign credits');
    }
  };

  const filtered = useMemo(() => ledger.filter((r) => {
    const t = typeFilter ? r.type === typeFilter : true;
    const a = agentFilter ? r.to.includes(agentFilter) || r.from.includes(agentFilter) : true;
    const ts = new Date(r.timestamp).getTime();
    const f = from ? ts >= new Date(from).getTime() : true;
    const tt = to ? ts <= new Date(to).getTime() + 86400000 : true;
    return t && a && f && tt;
  }), [agentFilter, from, ledger, to, typeFilter]);

  return (
    <div className="min-h-screen bg-[#0B0E1A] p-6 text-white">
      <h1 className="mb-4 text-2xl font-bold">Credit Management</h1>
      {message ? <div className="mb-3 rounded border border-[#1E293B] bg-[#1A2235] px-3 py-2 text-sm text-[#94A3B8]">{message}</div> : null}
      {loadError && (
        <div className="mb-4 flex items-center gap-3 rounded border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <span>Unable to load credit data.</span>
          <button onClick={load} className="ml-auto rounded border border-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-900/40 transition-colors">Retry</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
          <h2 className="mb-2 font-semibold">Create New Credits</h2>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-2 text-lg" placeholder="Amount (CR)" />
          <p className="mt-2 text-xs text-[#94A3B8]">Only you can create credits. They will be added to your admin balance.</p>
          <button onClick={createCredits} className="mt-3 w-full rounded bg-[#00C37B] py-2 font-bold text-[#0B0E1A]">CREATE CREDITS</button>
          <div className="mt-3 text-sm text-[#94A3B8]">Admin Balance: <span className="font-mono text-white">{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} CR</span></div>
        </section>

        <section className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
          <h2 className="mb-2 font-semibold">Assign Credits to Agent</h2>
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="w-full rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-2">
            {agents.map((a) => <option key={a.id} value={a.id}>{a.display_id || a.username || a.id}</option>)}
          </select>
          <input value={assignAmount} onChange={(e) => setAssignAmount(e.target.value)} className="mt-2 w-full rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-2" placeholder="Amount (CR)" />
          <div className="mt-2 text-sm text-[#94A3B8]">Your Balance: {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} CR</div>
          <button onClick={assignCredits} className="mt-3 w-full rounded bg-[#00C37B] py-2 font-bold text-[#0B0E1A]">ASSIGN CREDITS</button>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-semibold">Full Credit Ledger</h2>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-1.5 text-sm"><option value="">Type</option><option value="create">create</option><option value="assign">assign</option></select>
          <input value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} placeholder="Agent" className="rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-1.5 text-sm" />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-1.5 text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-1.5 text-sm" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-xs uppercase text-[#64748B]"><tr><th className="text-left">Timestamp</th><th className="text-left">From</th><th className="text-left">To</th><th className="text-left">Amount</th><th className="text-left">Type</th><th className="text-left">Balance After</th></tr></thead>
            <tbody>{filtered.map((r) => <tr key={r.id} className="border-t border-[#1E293B]"><td>{new Date(r.timestamp).toLocaleString()}</td><td>{r.from}</td><td>{r.to}</td><td className={r.amount >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'}>{r.amount >= 0 ? '+' : ''}{r.amount.toLocaleString()} CR</td><td>{r.type}</td><td>{r.balanceAfter.toLocaleString()} CR</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
