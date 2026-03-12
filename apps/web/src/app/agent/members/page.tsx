'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { copyToClipboard as copyText } from '@/lib/copyToClipboard';
import { ResetPasswordModal } from '@/components/shared/ResetPasswordModal';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MemberRow = {
  id: number;
  display_id?: string;
  username?: string;
  balance?: number | string;
  is_active?: boolean;
  open_bets?: number;
  pnl_7d?: number | string;
};

type CreatedMember = {
  display_id: string;
  username: string;
  password: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseAmount(value: number | string | undefined): number {
  const parsed =
    typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const ROWS_PER_PAGE = 15;

/* ------------------------------------------------------------------ */
/*  CreateMemberModal                                                  */
/* ------------------------------------------------------------------ */

function CreateMemberModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CreatedMember | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const reset = useCallback(() => {
    setNickname('');
    setLoading(false);
    setError('');
    setCreated(null);
    setCopiedField(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleCreate = useCallback(async () => {
    if (!nickname.trim()) {
      setError('Nickname is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiPost<CreatedMember>('/api/agents/members', {
        nickname: nickname.trim(),
      });
      setCreated(res.data);
      onCreated();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to create member';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [nickname, onCreated]);

  const handleCopyField = useCallback(
    (text: string, field: string) => {
      copyText(text).then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      });
    },
    [],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 shadow-2xl">
        {!created ? (
          <>
            <h2 className="mb-1 text-[20px] font-bold text-white">
              Create New Member
            </h2>
            <p className="mb-6 text-[13px] text-[#64748B]">
              Enter a nickname. Credentials will be auto-generated.
            </p>

            <label className="mb-1 block text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
              Nickname
            </label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. john_doe"
              className="mb-4 w-full rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-2.5 text-white placeholder-[#475569] outline-none focus:border-[#00C37B]"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />

            {error && (
              <p className="mb-3 text-[13px] text-[#EF4444]">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-4 py-2.5 text-[14px] font-semibold text-[#94A3B8] transition hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 rounded-lg bg-[#00C37B] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#00A366] disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Member'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00C37B]/20">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00C37B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-[20px] font-bold text-white">
                Member Created
              </h2>
            </div>

            <div className="mb-4 rounded-lg border border-yellow-600/40 bg-yellow-900/20 p-3">
              <p className="text-[12px] font-semibold text-yellow-400">
                WARNING: Save these credentials now. The password cannot be
                retrieved later.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Member ID', value: created.display_id, field: 'id' },
                { label: 'Username', value: created.username, field: 'user' },
                { label: 'Password', value: created.password, field: 'pass' },
              ].map(({ label, value, field }) => (
                <div key={field}>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-[#64748B]">
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-2 font-mono text-[14px] text-white">
                      {value}
                    </span>
                    <button
                      onClick={() => handleCopyField(value, field)}
                      className="rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-2 text-[12px] text-[#94A3B8] transition hover:border-[#00C37B] hover:text-[#00C37B]"
                    >
                      {copiedField === field ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleClose}
              className="mt-6 w-full rounded-lg bg-[#00C37B] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#00A366]"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CreditTransferModal                                                */
/* ------------------------------------------------------------------ */

function CreditTransferModal({
  member,
  direction,
  onClose,
  onSuccess,
}: {
  member: MemberRow;
  direction: 'add' | 'remove';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const numAmount = Number.parseFloat(amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        throw new Error('Enter a valid positive amount');
      }
      const payload =
        direction === 'add'
          ? { to_user_id: member.id, amount: numAmount }
          : { to_user_id: member.id, amount: -numAmount };
      await apiPost('/api/credits/transfer', payload);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : 'Transfer failed');
      setError(msg);
    },
  });

  const label = direction === 'add' ? 'Add Credits' : 'Remove Credits';
  const color = direction === 'add' ? '#00C37B' : '#EF4444';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-bold text-white">{label}</h2>
        <p className="mb-5 text-[13px] text-[#64748B]">
          Member: <span className="text-white">@{member.username || member.display_id || `#${member.id}`}</span>
          {' '}· Current balance: <span className="font-mono text-white">{fmt(parseAmount(member.balance))} CR</span>
        </p>

        <label className="mb-1 block text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
          Amount (CR)
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError('');
          }}
          placeholder="0.00"
          className="mb-4 w-full rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-2.5 font-mono text-white placeholder-[#475569] outline-none focus:border-[#00C37B]"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && mutation.mutate()}
        />

        {error && <p className="mb-3 text-[13px] text-[#EF4444]">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-4 py-2.5 text-[14px] font-semibold text-[#94A3B8] transition hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 rounded-lg px-4 py-2.5 text-[14px] font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: color }}
          >
            {mutation.isPending ? 'Processing...' : label}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MemberDetailModal                                                  */
/* ------------------------------------------------------------------ */

function MemberDetailModal({
  member,
  onClose,
}: {
  member: MemberRow;
  onClose: () => void;
}) {
  const bal = parseAmount(member.balance);
  const pnl = parseAmount(member.pnl_7d);
  const isActive = member.is_active !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#1E293B] bg-[#1A2235] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Member Details
          </h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white">
            Close
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between border-b border-[#1E293B] pb-2">
            <span className="text-[13px] text-[#64748B]">Member ID</span>
            <span className="font-mono text-[14px] text-white">{member.display_id || `#${member.id}`}</span>
          </div>
          <div className="flex justify-between border-b border-[#1E293B] pb-2">
            <span className="text-[13px] text-[#64748B]">Username</span>
            <span className="text-[14px] text-white">@{member.username || 'unknown'}</span>
          </div>
          <div className="flex justify-between border-b border-[#1E293B] pb-2">
            <span className="text-[13px] text-[#64748B]">Balance</span>
            <span className="font-mono text-[14px] text-white">{fmt(bal)} CR</span>
          </div>
          <div className="flex justify-between border-b border-[#1E293B] pb-2">
            <span className="text-[13px] text-[#64748B]">Open Bets</span>
            <span className="font-mono text-[14px] text-white">{member.open_bets ?? 0}</span>
          </div>
          <div className="flex justify-between border-b border-[#1E293B] pb-2">
            <span className="text-[13px] text-[#64748B]">7-Day P&L</span>
            <span className={`font-mono text-[14px] ${pnl >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'}`}>
              {pnl >= 0 ? '+' : ''}{fmt(pnl)} CR
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[13px] text-[#64748B]">Status</span>
            {isActive ? (
              <span className="inline-block rounded-full bg-[#00C37B]/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#00C37B]">
                Active
              </span>
            ) : (
              <span className="inline-block rounded-full bg-[#EF4444]/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#EF4444]">
                Suspended
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-[#00C37B] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#00A366]"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AgentMembersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: number; name: string } | null>(null);
  const [creditTarget, setCreditTarget] = useState<{ member: MemberRow; direction: 'add' | 'remove' } | null>(null);
  const [manageTarget, setManageTarget] = useState<MemberRow | null>(null);

  /* ---------- data ---------- */

  const {
    data: members = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['agent', 'members'],
    queryFn: () =>
      apiGet<MemberRow[]>('/api/agents/members').then((r) => r.data || []),
    refetchInterval: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      apiPatch(`/api/agents/members/${id}/status`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent', 'members'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/agents/members/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent', 'members'] }),
  });

  const handleDeleteMember = useCallback((m: MemberRow) => {
    const confirmed = window.confirm(
      `Delete member ${m.display_id || m.username}?\n\n` +
      `This cannot be undone.\n` +
      `Member must have no open bets.`
    );
    if (!confirmed) return;
    deleteMutation.mutate(m.id);
  }, [deleteMutation]);

  /* ---------- search / pagination ---------- */

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        (m.display_id ?? '').toLowerCase().includes(q) ||
        (m.username ?? '').toLowerCase().includes(q),
    );
  }, [members, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * ROWS_PER_PAGE,
    safePage * ROWS_PER_PAGE,
  );

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, safePage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  /* ---------- handlers ---------- */

  const handleCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['agent', 'members'] });
  }, [queryClient]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    [],
  );

  /* ---------- render ---------- */

  return (
    <div className="min-h-screen bg-[#0B0E1A] p-6 text-white">
      {/* ---- Header ---- */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">
            Management
          </p>
          <h1 className="text-[26px] font-bold leading-tight text-white">
            My Members
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-[320px]">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search by ID or nickname..."
              className="w-full rounded-lg border border-[#1E293B] bg-[#1A2235] py-2.5 pl-10 pr-4 text-[14px] text-white placeholder-[#475569] outline-none transition focus:border-[#00C37B]"
            />
          </div>

          {/* Create button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#00C37B] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#00A366]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New Member
          </button>
        </div>
      </div>

      {/* ---- Table ---- */}
      <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#1A2235] shadow-2xl">
        <table className="w-full min-w-[960px] text-[13px]">
          <thead>
            <tr className="sticky top-0 z-10 bg-[#111827] text-[11px] uppercase tracking-wider text-[#64748B]">
              <th className="px-4 py-3 text-left font-semibold">Member ID</th>
              <th className="px-4 py-3 text-left font-semibold">Nickname</th>
              <th className="px-4 py-3 text-left font-semibold">
                Current Balance
              </th>
              <th className="px-4 py-3 text-center font-semibold">
                Adjustment
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                Active Bets
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                Total P&amp;L
              </th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[#64748B]">
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin text-[#00C37B]"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Loading members...
                  </div>
                </td>
              </tr>
            )}

            {isError && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-[#EF4444]"
                >
                  Failed to load members. Please try again later.
                </td>
              </tr>
            )}

            {!isLoading && !isError && pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-[#64748B]"
                >
                  {search
                    ? 'No members match your search.'
                    : 'No members yet. Create your first member above.'}
                </td>
              </tr>
            )}

            {pageRows.map((m, idx) => {
              const bal = parseAmount(m.balance);
              const pnl = parseAmount(m.pnl_7d);
              const isActive = m.is_active !== false;
              const isEven = idx % 2 === 1;

              return (
                <tr
                  key={m.id}
                  className={`border-t border-[#1E293B] transition-colors hover:bg-[#232d42] ${
                    isEven ? 'bg-[#161b2e]' : ''
                  }`}
                >
                  {/* Member ID */}
                  <td className="px-4 py-3 font-mono font-medium text-white">
                    {m.display_id || `#${m.id}`}
                  </td>

                  {/* Nickname */}
                  <td className="px-4 py-3 text-[#94A3B8]">
                    @{m.username || 'unknown'}
                  </td>

                  {/* Balance */}
                  <td className="px-4 py-3 font-mono text-white">
                    {fmt(bal)} CR
                  </td>

                  {/* Adjustment +/- */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setCreditTarget({ member: m, direction: 'add' })}
                        className="flex h-7 w-7 items-center justify-center rounded border border-[#1E293B] bg-[#0B0E1A] text-[14px] font-bold text-[#94A3B8] transition hover:border-[#00C37B] hover:text-[#00C37B]"
                        title="Add credits"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setCreditTarget({ member: m, direction: 'remove' })}
                        className="flex h-7 w-7 items-center justify-center rounded border border-[#1E293B] bg-[#0B0E1A] text-[14px] font-bold text-[#94A3B8] transition hover:border-[#EF4444] hover:text-[#EF4444]"
                        title="Remove credits"
                      >
                        &minus;
                      </button>
                    </div>
                  </td>

                  {/* Active Bets */}
                  <td className="px-4 py-3 font-mono text-white">
                    {m.open_bets ?? 0}
                  </td>

                  {/* Total P&L */}
                  <td
                    className={`px-4 py-3 font-mono ${
                      pnl >= 0 ? 'text-[#00C37B]' : 'text-[#EF4444]'
                    }`}
                  >
                    {pnl >= 0 ? '+' : ''}
                    {fmt(pnl)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {isActive ? (
                      <span className="inline-block rounded-full bg-[#00C37B]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#00C37B]">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-[#EF4444]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#EF4444]">
                        Suspended
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setResetTarget({ id: m.id, name: m.username || m.display_id || `Member #${m.id}` })}
                        className="rounded border border-[#1E293B] bg-[#0B0E1A] px-2 py-1 text-[12px] font-bold text-[#F59E0B]/60 transition hover:text-[#F59E0B] hover:border-[#F59E0B]/40"
                        title="Reset Password"
                      >
                        RESET PW
                      </button>
                      {isActive ? (
                        <button
                          onClick={() => statusMutation.mutate({ id: m.id, is_active: false })}
                          disabled={statusMutation.isPending}
                          className="rounded border border-[#EF4444]/20 bg-[#0B0E1A] px-2 py-1 text-[12px] font-bold text-[#EF4444]/60 transition hover:text-[#EF4444] hover:border-[#EF4444]/40 disabled:opacity-50"
                          title="Suspend member"
                        >
                          SUSPEND
                        </button>
                      ) : (
                        <button
                          onClick={() => statusMutation.mutate({ id: m.id, is_active: true })}
                          disabled={statusMutation.isPending}
                          className="rounded border border-[#00C37B]/20 bg-[#0B0E1A] px-2 py-1 text-[12px] font-bold text-[#00C37B]/60 transition hover:text-[#00C37B] hover:border-[#00C37B]/40 disabled:opacity-50"
                          title="Unsuspend member"
                        >
                          UNSUSPEND
                        </button>
                      )}
                      {!isActive && (
                        <button
                          onClick={() => handleDeleteMember(m)}
                          disabled={deleteMutation.isPending}
                          className="rounded border border-red-800 bg-red-900/30 px-2 py-1 text-[12px] font-bold text-red-400 transition hover:bg-red-900/50 disabled:opacity-50"
                          title="Delete member permanently"
                        >
                          DELETE
                        </button>
                      )}
                      <button
                        onClick={() => setManageTarget(m)}
                        className="rounded border border-[#1E293B] bg-[#0B0E1A] px-2 py-1 text-[12px] font-bold text-[#64748B] transition hover:text-white"
                      >
                        MANAGE
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---- Pagination Footer ---- */}
      {!isLoading && filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[13px] text-[#64748B]">
            Showing{' '}
            <span className="font-medium text-[#94A3B8]">
              {(safePage - 1) * ROWS_PER_PAGE + 1}
            </span>
            {' - '}
            <span className="font-medium text-[#94A3B8]">
              {Math.min(safePage * ROWS_PER_PAGE, filtered.length)}
            </span>{' '}
            of{' '}
            <span className="font-medium text-[#94A3B8]">
              {filtered.length}
            </span>{' '}
            members
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-1.5 text-[12px] font-semibold text-[#94A3B8] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${
                  n === safePage
                    ? 'border-[#00C37B] bg-[#00C37B]/15 text-[#00C37B]'
                    : 'border-[#1E293B] bg-[#0B0E1A] text-[#94A3B8] hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-[#1E293B] bg-[#0B0E1A] px-3 py-1.5 text-[12px] font-semibold text-[#94A3B8] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ---- Modal ---- */}
      <CreateMemberModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />

      {resetTarget && (
        <ResetPasswordModal
          targetName={resetTarget.name}
          apiEndpoint={`/api/agents/users/${resetTarget.id}/reset-password`}
          onClose={() => setResetTarget(null)}
        />
      )}

      {creditTarget && (
        <CreditTransferModal
          member={creditTarget.member}
          direction={creditTarget.direction}
          onClose={() => setCreditTarget(null)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ['agent', 'members'] });
          }}
        />
      )}

      {manageTarget && (
        <MemberDetailModal
          member={manageTarget}
          onClose={() => setManageTarget(null)}
        />
      )}
    </div>
  );
}
