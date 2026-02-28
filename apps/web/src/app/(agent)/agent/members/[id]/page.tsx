'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';

type Member = {
  id: number;
  display_id: string;
  username: string;
  is_active?: boolean;
  created_at?: string;
  balance?: number;
  total_bets?: number;
  pnl?: number;
};

type CreditRow = { date: string; amount: number; by: string; balance_after: number };
type BetRow = { id: string; title: string; status: string; stake: number; returns: number; sport: string; date: string };
type BetApiRow = Partial<BetRow>;
type CreditApiRow = Partial<CreditRow>;

export default function AgentMemberDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [member, setMember] = useState<Member | null>(null);
  const [bets, setBets] = useState<BetRow[]>([]);
  const [credits, setCredits] = useState<CreditRow[]>([]);
  const [tab, setTab] = useState<'bets' | 'credits' | 'overview'>('bets');
  const [amount, setAmount] = useState('10');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [m, b, c] = await Promise.allSettled([
          apiGet<Member>(`/api/agents/members/${id}`),
          apiGet<BetApiRow[]>(`/api/agents/members/${id}/bets`),
          apiGet<CreditApiRow[]>(`/api/agents/members/${id}/credits`),
        ]);

        if (m.status === 'fulfilled' && m.value.data) setMember(m.value.data);
        else setMember(demoMember(Number(id)));

        if (b.status === 'fulfilled') setBets((b.value.data || []).map((x, i) => ({ id: String(x.id || i + 1), title: x.title || 'Accumulator · 3 selections', status: x.status || 'open', stake: Number(x.stake || 10), returns: Number(x.returns || 0), sport: x.sport || 'Football', date: x.date || new Date().toISOString() })));
        else setBets(demoBets);

        if (c.status === 'fulfilled') setCredits((c.value.data || []).map((x) => ({ date: x.date || new Date().toISOString(), amount: Number(x.amount || 0), by: x.by || 'Agent_20', balance_after: Number(x.balance_after || 0) })));
        else setCredits(demoCredits);
      } catch {
        setMember(demoMember(Number(id)));
        setBets(demoBets);
        setCredits(demoCredits);
      }
    })();
  }, [id]);

  const transfer = async () => {
    if (!member) return;
    await apiPost('/api/credits/transfer', { to_user_id: member.id, amount: Number(amount) });
  };

  const winRate = useMemo(() => {
    if (!bets.length) return 0;
    const won = bets.filter((b) => b.status === 'won').length;
    return (won / bets.length) * 100;
  }, [bets]);

  return (
    <div className="min-h-screen bg-[#0B0E1A] p-6 text-white">
      <div className="mb-4 rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#111827] px-3 py-1 text-xs text-[#00C37B]">{member?.display_id || `MEM_${id}`}</span>
          <h1 className="text-xl font-bold">{member?.username || 'Member'}</h1>
          <span className={`rounded px-2 py-1 text-xs ${member?.is_active !== false ? 'bg-[#14532D] text-[#00C37B]' : 'bg-[#7F1D1D] text-[#FCA5A5]'}`}>{member?.is_active !== false ? 'Active' : 'Suspended'}</span>
          <span className="text-xs text-[#94A3B8]">Joined: {member?.created_at ? new Date(member.created_at).toLocaleDateString() : '-'}</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <Stat title="Balance" value={`${Number(member?.balance || 0).toFixed(2)} CR`} />
        <Stat title="Total Bets" value={String(member?.total_bets || 0)} />
        <Stat title="P&L" value={`${Number(member?.pnl || 0).toFixed(2)} CR`} />
        <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-3">
          <div className="text-xs text-[#94A3B8]">Credit Transfer</div>
          <div className="mt-2 flex gap-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded border border-[#1E293B] bg-[#111827] px-2 py-1" />
            <button onClick={transfer} className="rounded bg-[#00C37B] px-3 py-1 text-[#0B0E1A]">Transfer</button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('bets')} className={`rounded px-3 py-1.5 ${tab === 'bets' ? 'bg-[#00C37B] text-[#0B0E1A]' : 'bg-[#1A2235]'}`}>Bet History</button>
        <button onClick={() => setTab('credits')} className={`rounded px-3 py-1.5 ${tab === 'credits' ? 'bg-[#00C37B] text-[#0B0E1A]' : 'bg-[#1A2235]'}`}>Credit History</button>
        <button onClick={() => setTab('overview')} className={`rounded px-3 py-1.5 ${tab === 'overview' ? 'bg-[#00C37B] text-[#0B0E1A]' : 'bg-[#1A2235]'}`}>Overview</button>
      </div>

      {tab === 'bets' ? (
        <div className="space-y-3">
          {bets.map((b) => (
            <div key={b.id} className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{b.title}</div>
                  <div className="text-xs text-[#94A3B8]">{b.sport} · {new Date(b.date).toLocaleString()}</div>
                </div>
                <div className="text-right text-sm">
                  <div>Stake: {b.stake.toFixed(2)} CR</div>
                  <div className={b.status === 'won' ? 'text-[#00C37B]' : b.status === 'lost' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}>{b.status.toUpperCase()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'credits' ? (
        <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#1A2235]">
          <table className="w-full text-sm">
            <thead className="bg-[#111827] text-xs uppercase text-[#64748B]"><tr><th className="px-3 py-2 text-left">Date</th><th className="text-left">Amount</th><th className="text-left">Transferred by</th><th className="text-left">Balance after</th></tr></thead>
            <tbody>
              {credits.map((c, i) => (
                <tr key={i} className="border-t border-[#1E293B]"><td className="px-3 py-2">{new Date(c.date).toLocaleString()}</td><td className="font-mono text-[#00C37B]">+{c.amount.toFixed(2)} CR</td><td>{c.by}</td><td className="font-mono">{c.balance_after.toFixed(2)} CR</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'overview' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4"><div className="text-xs text-[#94A3B8]">Win Rate</div><div className="mt-2 text-2xl font-bold text-[#00C37B]">{winRate.toFixed(1)}%</div></div>
          <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4"><div className="text-xs text-[#94A3B8]">Favourite Sports</div><div className="mt-2">Football, Tennis, Basketball</div></div>
          <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4"><div className="text-xs text-[#94A3B8]">Peak Activity</div><div className="mt-2">18:00 - 22:00</div></div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-3">
      <div className="text-xs text-[#94A3B8]">{title}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

function demoMember(id: number): Member {
  return { id, display_id: `MEM_${id}`, username: `nick_${id}`, is_active: true, created_at: new Date().toISOString(), balance: 214.5, total_bets: 68, pnl: 41.2 };
}

const demoBets: BetRow[] = [
  { id: 'b1', title: 'Arsenal to Win · Match Result', status: 'won', stake: 10, returns: 18.5, sport: 'Football', date: new Date().toISOString() },
  { id: 'b2', title: 'Djokovic to Win · Match Winner', status: 'open', stake: 12, returns: 20.4, sport: 'Tennis', date: new Date().toISOString() },
  { id: 'b3', title: 'Lakers -3.5 · Handicap', status: 'lost', stake: 8, returns: 0, sport: 'Basketball', date: new Date().toISOString() },
];

const demoCredits: CreditRow[] = [
  { date: new Date().toISOString(), amount: 50, by: 'Agent_20', balance_after: 180 },
  { date: new Date().toISOString(), amount: 30, by: 'Agent_20', balance_after: 130 },
];
