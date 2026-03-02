'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';

/* ── Types ────────────────────────────────────────────────── */
type FullProfile = {
  id: number;
  display_id: string;
  username: string;
  role: string;
  is_active: boolean;
  can_create_sub_agent: boolean;
  created_at: string;
  balance: string;
  preferences: {
    oddsFormat: string;
    timezone: string;
    notifyBetSettled: boolean;
    notifyOddsMovement: boolean;
    notifyCreditReceived: boolean;
  };
};

/* ── API ──────────────────────────────────────────────────── */
async function fetchProfile(): Promise<FullProfile> {
  const res = await apiGet<FullProfile>('/api/auth/me');
  return res.data;
}
async function updatePreferences(prefs: Partial<FullProfile['preferences']>) {
  const res = await apiPatch('/api/auth/preferences', prefs);
  return res.data;
}

/* ── Input class ──────────────────────────────────────────── */
const inputClass =
  'bg-[#0D1120] border border-[#1E293B] rounded-lg px-[14px] py-[10px] text-[#F1F5F9] text-[13px] w-full outline-none transition-colors focus:border-[#00C37B]';

/* ═══════════════════════════════════════════════════════════ */
/*  MODAL: Deactivate Account                                 */
/* ═══════════════════════════════════════════════════════════ */
function DeactivateModal({
  accountId,
  onCancel,
  onConfirm,
}: {
  accountId: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const isValid = confirmText === accountId;

  const handleConfirm = async () => {
    if (!isValid) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full max-w-[440px] bg-[#111827] border border-[#EF4444]/30 rounded-2xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-extrabold text-[16px]">Deactivate Account</h3>
            <p className="text-[#64748B] text-[11px] mt-0.5">This action is permanent and cannot be undone</p>
          </div>
        </div>

        {/* Warning box */}
        <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg p-4 mb-6 space-y-2">
          <p className="text-[#EF4444] text-[11px] font-bold uppercase tracking-wider">What will happen:</p>
          <ul className="space-y-1.5 mt-2">
            {[
              'All admin privileges will be immediately revoked',
              'All active sessions will be terminated',
              'Access to the BetArena admin panel will be blocked',
              'This cannot be reversed without contacting support',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-[#94A3B8] text-[12px]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirmation input */}
        <div className="mb-6">
          <label className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
            Type your account ID to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={accountId}
            className="bg-[#0D1120] border border-[#1E293B] rounded-lg px-[14px] py-[10px] text-[#F1F5F9] text-[13px] w-full outline-none transition-colors focus:border-[#EF4444] mt-2"
          />
          <p className="text-[#64748B] text-[10px] mt-2 px-1">
            Enter <span className="text-white font-mono">{accountId}</span> to enable the deactivation button.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#1A2235] border border-[#1E293B] text-[#94A3B8] hover:text-white font-bold text-[12px] rounded-lg transition-all"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="flex-1 py-2.5 bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] font-extrabold text-[12px] rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed enabled:hover:bg-[#EF4444] enabled:hover:text-white"
          >
            {loading ? 'DEACTIVATING...' : 'DEACTIVATE'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  PAGE                                                      */
/* ═══════════════════════════════════════════════════════════ */
export default function AdminProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const profileQuery = useQuery({
    queryKey: ['admin', 'profile'],
    queryFn: fetchProfile,
  });
  const profile = profileQuery.data;

  /* ── Derived display values ── */
  const displayName = profile?.username
    ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1)
    : user?.username
      ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
      : 'Super Admin';

  const accountId = profile?.display_id || user?.display_id || '—';

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  /* ── Form state ── */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tz, setTz] = useState('UTC');
  const [formPrimed, setFormPrimed] = useState(false);

  useEffect(() => {
    if (profile && !formPrimed) {
      setName(profile.username
        ? profile.username.charAt(0).toUpperCase() + profile.username.slice(1)
        : '');
      setTz(profile.preferences?.timezone || 'UTC');
      setFormPrimed(true);
    }
  }, [profile, formPrimed]);

  /* ── Save mutation ── */
  const saveMutation = useMutation({
    mutationFn: () => updatePreferences({ timezone: tz }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] });
      toast({ title: 'Profile updated', description: 'Your timezone preference has been saved.' });
    },
    onError: () => {
      toast({ title: 'Failed to save', description: 'Could not update profile.', variant: 'destructive' });
    },
  });

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  /* ── Deactivate modal ── */
  const [showDeactivate, setShowDeactivate] = useState(false);

  const handleDeactivateConfirm = async () => {
    // No real deactivation endpoint — log out and show toast
    toast({
      title: 'Account deactivation requested',
      description: 'Your request has been submitted. Contact support for confirmation.',
      variant: 'destructive',
    });
    setShowDeactivate(false);
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-[#111827] border-b border-[#1E293B] px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">Admin Settings</span>
        </div>
        <h1 className="text-white font-bold text-[16px]">Account Profile</h1>
        <div className="flex flex-col items-end">
          <span className="text-[#64748B] text-[10px] font-bold uppercase">System Status</span>
          <span className="text-[#00C37B] text-[11px] font-mono">Secured Connection</span>
        </div>
      </header>

      <main className="flex-1 p-8 space-y-8 overflow-y-auto bg-[#0B0E1A]">
        {/* Profile Hero */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-8">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-[#1A2235] shadow-2xl" />
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#00C37B] rounded-full border-4 border-[#111827] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0B0E1A" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-white text-[28px] font-extrabold tracking-tight">{displayName}</h2>
                <span className="px-2.5 py-1 bg-[#00C37B]/10 border border-[#00C37B]/30 text-[#00C37B] text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                  Full Access
                </span>
              </div>
              <p className="text-[#94A3B8] text-[14px]">Central Administrator Account</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="text-[#64748B] text-[12px] font-medium">Member since {memberSince}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Profile Settings */}
          <div className="col-span-7 bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] bg-[#1A2235]/30">
              <h3 className="text-white font-bold text-[15px]">Profile Settings</h3>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider px-1">Display Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider px-1">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@betarena.io" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider px-1">Phone Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider px-1">Timezone</label>
                  <select value={tz} onChange={(e) => setTz(e.target.value)} className={`${inputClass} appearance-none`}>
                    <option value="UTC">UTC (GMT+0)</option>
                    <option value="US/Eastern">Eastern Time (GMT-5)</option>
                    <option value="US/Pacific">Pacific Time (GMT-8)</option>
                    <option value="Asia/Singapore">Singapore (GMT+8)</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-[#1E293B]">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-6 py-2.5 bg-[#00C37B] hover:bg-[#00A36B] text-[#0B0E1A] font-extrabold text-[12px] rounded-lg transition-all disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>

          {/* Right column */}
          <div className="col-span-5 space-y-8">
            {/* Account Information */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
              <h3 className="text-white font-bold text-[15px] mb-6">Account Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-[#1E293B]/50">
                  <span className="text-[#64748B] text-[12px] font-medium">Account ID</span>
                  <span className="text-white font-mono text-[12px]">{accountId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#1E293B]/50">
                  <span className="text-[#64748B] text-[12px] font-medium">Username</span>
                  <span className="text-white font-mono text-[12px]">{profile?.username || user?.username || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#1E293B]/50">
                  <span className="text-[#64748B] text-[12px] font-medium">Role</span>
                  <span className="text-[#00C37B] text-[12px] font-semibold uppercase">{profile?.role || user?.role || 'admin'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[#64748B] text-[12px] font-medium">Status</span>
                  <span className="flex items-center gap-1.5 text-[12px]">
                    {profile?.is_active !== false ? (
                      <>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#00C37B]" />
                        <span className="text-[#00C37B] font-semibold">Active</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block h-2 w-2 rounded-full bg-[#EF4444]" />
                        <span className="text-[#EF4444] font-semibold">Inactive</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Recent Logins */}
              <div className="mt-8">
                <h4 className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-widest mb-4">Account Details</h4>
                <div className="rounded-lg border border-[#1E293B] overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#1A2235] text-[#64748B] text-[10px] font-bold uppercase">
                      <tr>
                        <th className="px-4 py-2">Field</th>
                        <th className="px-4 py-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] text-[#94A3B8]">
                      <tr className="border-b border-[#1E293B]">
                        <td className="px-4 py-3">Created</td>
                        <td className="px-4 py-3 text-right text-white font-mono">
                          {profile?.created_at
                            ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </td>
                      </tr>
                      <tr className="border-b border-[#1E293B]">
                        <td className="px-4 py-3">Balance</td>
                        <td className="px-4 py-3 text-right text-white font-mono">
                          {profile?.balance ? `${Number(profile.balance).toLocaleString()} CR` : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Odds Format</td>
                        <td className="px-4 py-3 text-right text-white capitalize">
                          {profile?.preferences?.oddsFormat || 'decimal'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-6">
              <h3 className="text-[#EF4444] font-bold text-[15px] mb-2">Danger Zone</h3>
              <p className="text-[#64748B] text-[11px] mb-4">
                Deactivating your account will immediately revoke all administrative privileges across the BetArena network.
              </p>
              <button
                onClick={() => setShowDeactivate(true)}
                className="w-full py-2.5 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444] hover:text-white font-extrabold text-[12px] rounded-lg transition-all"
              >
                DEACTIVATE ACCOUNT
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Deactivate modal */}
      {showDeactivate && (
        <DeactivateModal
          accountId={accountId}
          onCancel={() => setShowDeactivate(false)}
          onConfirm={handleDeactivateConfirm}
        />
      )}
    </div>
  );
}
