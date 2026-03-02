'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';

/* ── Types ────────────────────────────────────────────────── */
type UserProfile = {
  id: number;
  display_id: string;
  username: string;
  role: string;
  is_active: boolean;
  can_create_sub_agent: boolean;
  created_at: string;
  preferences: {
    oddsFormat: string;
    timezone: string;
    notifyBetSettled: boolean;
    notifyOddsMovement: boolean;
    notifyCreditReceived: boolean;
  };
};
type Preferences = UserProfile['preferences'];

/* ── API helpers ──────────────────────────────────────────── */
async function fetchProfile(): Promise<UserProfile> {
  const res = await apiGet<UserProfile>('/api/auth/me');
  return res.data;
}
async function updatePreferences(prefs: Preferences): Promise<Preferences> {
  const res = await apiPatch<Preferences>('/api/auth/preferences', prefs);
  return res.data;
}
async function changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }) {
  const res = await apiPost('/api/auth/change-password', payload);
  return res.data;
}

/* ── Session type ────────────────────────────────────────── */
type Session = {
  id: string;
  device: string;
  browser: string;
  location: string;
  flag: string;
  ip: string;
  lastActive: string;
  status: 'online' | 'idle';
  icon: 'phone' | 'desktop' | 'tablet' | 'laptop';
  current?: boolean;
};

const INITIAL_SESSIONS: Session[] = [
  { id: 'sess-1', device: 'iPhone 15 Pro', browser: 'Mobile App \u2022 iOS 17.4', location: 'Singapore, Central', flag: '\uD83C\uDDF8\uD83C\uDDEC', ip: '192.168.1.45', lastActive: 'Active Now', status: 'online', icon: 'phone', current: true },
  { id: 'sess-2', device: 'Windows Desktop', browser: 'Chrome v122.0.1 \u2022 Win 11', location: 'Hong Kong, HK', flag: '\uD83C\uDDED\uD83C\uDDF0', ip: '203.0.113.88', lastActive: '2 hours ago', status: 'idle', icon: 'desktop' },
  { id: 'sess-3', device: 'iPad Air', browser: 'Safari \u2022 iPadOS 17.2', location: 'Los Angeles, US', flag: '\uD83C\uDDFA\uD83C\uDDF8', ip: '72.14.201.112', lastActive: '6 hours ago', status: 'idle', icon: 'tablet' },
  { id: 'sess-4', device: 'MacBook Pro 16"', browser: 'Safari \u2022 macOS Sonoma', location: 'Singapore, West', flag: '\uD83C\uDDF8\uD83C\uDDEC', ip: '116.15.22.109', lastActive: 'Yesterday, 11:42 PM', status: 'idle', icon: 'laptop' },
  { id: 'sess-5', device: 'Windows Workstation', browser: 'Firefox v123.0 \u2022 Win 10', location: 'Hanoi, VN', flag: '\uD83C\uDDFB\uD83C\uDDF3', ip: '171.244.10.5', lastActive: '3 days ago', status: 'idle', icon: 'desktop' },
];

/* ── Device Icon ─────────────────────────────────────────── */
function DeviceIcon({ type, size = 14 }: { type: Session['icon']; size?: number }) {
  if (type === 'phone' || type === 'tablet') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

/* ── Modal overlay wrapper ───────────────────────────────── */
function ModalOverlay({ children, zIndex = 100 }: { children: React.ReactNode; zIndex?: number }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(11, 14, 26, 0.9)', backdropFilter: 'blur(8px)', zIndex }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MODAL: Revoke Confirm                                     */
/* ═══════════════════════════════════════════════════════════ */
function RevokeConfirmModal({
  session,
  onCancel,
  onConfirm,
}: {
  session: Session;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const deviceLabel = session.location
    ? `${session.device} (${session.location.split(',')[0]})`
    : session.device;

  return (
    <ModalOverlay>
      <div className="w-full max-w-[440px] bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1E293B] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-[18px]">Revoke Active Session</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-[#94A3B8] text-[14px] leading-relaxed">
            You are about to terminate the active session on{' '}
            <span className="text-white font-semibold">{deviceLabel}</span>.
          </p>
          <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg p-4">
            <p className="text-[#EF4444] text-[12px] font-medium">
              <strong>Warning:</strong> This will trigger an immediate forced logout on that device. Any unsaved progress in the admin terminal will be lost.
            </p>
          </div>
          <p className="text-[#64748B] text-[12px]">Are you sure you want to continue?</p>
        </div>
        <div className="px-6 py-5 bg-[#0D1120] border-t border-[#1E293B] flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1A2235] text-[13px] font-semibold transition-colors">
            CANCEL
          </button>
          <button onClick={onConfirm} className="px-5 py-2.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-bold shadow-lg shadow-[#EF4444]/20 transition-all">
            REVOKE SESSION
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MODAL: Revoking Loading                                   */
/* ═══════════════════════════════════════════════════════════ */
function RevokingLoadingModal({ session }: { session: Session }) {
  return (
    <ModalOverlay zIndex={200}>
      <div className="w-full max-w-[440px] bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-10 flex flex-col items-center text-center space-y-6">
          {/* Spinner */}
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#1E293B] border-t-[#EF4444] rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" className="opacity-50">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-white font-bold text-[18px]">Terminating session...</h2>
            <p className="text-[#94A3B8] text-[14px] leading-relaxed">
              Communicating with <span className="text-white font-semibold">{session.device}</span> to perform a remote forced logout.
            </p>
          </div>

          <div className="w-full bg-[#0D1120] border border-[#1E293B] rounded-lg p-3 flex items-center justify-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#EF4444] animate-pulse" />
            <span className="text-[#64748B] text-[11px] font-mono tracking-wider uppercase">Executing Revocation Command</span>
          </div>
        </div>

        <div className="px-6 py-5 bg-[#0D1120]/50 border-t border-[#1E293B] flex items-center justify-end gap-3 opacity-50 pointer-events-none">
          <button className="px-5 py-2.5 rounded-lg text-[#94A3B8] text-[13px] font-semibold">CANCEL</button>
          <button className="px-5 py-2.5 rounded-lg bg-[#1E293B] text-white text-[13px] font-bold">REVOKING...</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MODAL: Session Revoked Success                            */
/* ═══════════════════════════════════════════════════════════ */
function SessionRevokedModal({ session, onDismiss }: { session: Session; onDismiss: () => void }) {
  const deviceLabel = session.location
    ? `${session.device} (${session.location.split(',')[0]})`
    : session.device;

  const timestamp =
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' \u2022 ' +
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <ModalOverlay>
      <div className="w-full max-w-[440px] bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1E293B] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00C37B]/10 flex items-center justify-center text-[#00C37B]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-[18px]">Session Revoked</h2>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-[#94A3B8] text-[14px]">The active session has been successfully terminated.</p>
          <div className="bg-[#1A2235] border border-[#1E293B] rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">Device</span>
              <span className="text-white text-[12px] font-medium">{deviceLabel}</span>
            </div>
            <div className="h-[1px] bg-[#1E293B] w-full" />
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">IP Address</span>
              <span className="text-white text-[12px] font-mono">{session.ip}</span>
            </div>
            <div className="h-[1px] bg-[#1E293B] w-full" />
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider">Timestamp</span>
              <span className="text-white text-[12px]">{timestamp}</span>
            </div>
          </div>
          <div className="bg-[#00C37B]/5 border border-[#00C37B]/20 rounded-lg p-3 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00C37B] animate-pulse shrink-0" />
            <p className="text-[#00C37B] text-[12px] font-medium">Forced logout command transmitted successfully.</p>
          </div>
        </div>
        <div className="px-6 py-5 bg-[#0D1120] border-t border-[#1E293B]">
          <button onClick={onDismiss} className="w-full py-2.5 rounded-lg bg-[#00C37B] hover:bg-[#00AB6B] text-[#0B0E1A] text-[13px] font-bold shadow-lg shadow-[#00C37B]/10 transition-all">
            OK, UNDERSTOOD
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MODAL: Global Terminate All Sessions                      */
/* ═══════════════════════════════════════════════════════════ */
function GlobalTerminateModal({
  sessions,
  onCancel,
  onConfirm,
}: {
  sessions: Session[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const nonCurrent = sessions.filter((s) => !s.current);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    onConfirm();
  };

  return (
    <ModalOverlay>
      <div className="w-full max-w-[500px] bg-[#111827] border border-[#EF4444]/30 rounded-2xl shadow-[0_0_50px_-12px_rgba(239,68,68,0.25)] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#1E293B] flex items-center gap-3 bg-[#EF4444]/5">
          <div className="w-10 h-10 rounded-full bg-[#EF4444] flex items-center justify-center text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-extrabold text-[20px]">Critical Action Required</h2>
            <p className="text-[#EF4444] text-[12px] font-bold uppercase tracking-widest">Revoke All Active Sessions</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-5">
            <p className="text-white text-[14px] leading-relaxed font-medium mb-3">
              You are initiating a <span className="text-[#EF4444] font-bold underline">global termination</span> of all active access points.
            </p>
            <p className="text-[#94A3B8] text-[13px] leading-relaxed">
              This will immediately disconnect all devices listed below. Every connected user, including your current device if not exempted, will be forced to the login screen instantly.
            </p>
          </div>

          {/* Impacted devices */}
          <div>
            <p className="text-[#64748B] text-[11px] font-bold uppercase tracking-wider mb-3 px-1">
              Impacted Devices ({nonCurrent.length})
            </p>
            <div className="max-h-[180px] overflow-y-auto pr-2 space-y-2">
              {nonCurrent.map((s) => (
                <div key={s.id} className="bg-[#1A2235] border border-[#1E293B] p-3 rounded-lg flex items-center gap-3">
                  <div className={`w-10 h-10 rounded flex items-center justify-center ${
                    s.status === 'online' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'bg-[#94A3B8]/10 text-[#94A3B8]'
                  }`}>
                    <DeviceIcon type={s.icon} size={18} />
                  </div>
                  <div>
                    <p className="text-white text-[13px] font-bold">{s.device}</p>
                    <p className="text-[#64748B] text-[11px]">{s.location.split(',')[0]} \u2022 {s.ip}</p>
                  </div>
                  <div className="ml-auto">
                    {s.status === 'online' ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#00C37B]/10 text-[#00C37B] border border-[#00C37B]/20">ACTIVE NOW</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#1E293B] text-[#64748B]">IDLE</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation input */}
          <div className="bg-[#0B0E1A] p-4 rounded-xl border border-dashed border-[#1E293B]">
            <p className="text-[#64748B] text-[12px] text-center">
              Type <span className="text-white font-mono">&quot;TERMINATE ALL&quot;</span> to confirm this action
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Confirmation required"
              className="bg-[#1A2235] border border-[#1E293B] rounded-lg px-[14px] py-[10px] text-white text-[13px] w-full outline-none transition-colors focus:border-[#EF4444] mt-3 text-center font-mono placeholder:text-[#334155]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-[#0D1120] border-t border-[#1E293B] flex items-center justify-between">
          <button onClick={onCancel} disabled={loading} className="text-[#94A3B8] hover:text-white text-[13px] font-semibold transition-colors flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            ABORT ACTION
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText !== 'TERMINATE ALL' || loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white text-[14px] font-extrabold shadow-xl shadow-[#EF4444]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'TERMINATING...' : 'TERMINATE ALL SESSIONS'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MODAL: Suspicious Login Detected                          */
/* ═══════════════════════════════════════════════════════════ */
function SuspiciousLoginModal({
  onBlockAll,
  onLockAccount,
  onTrust,
}: {
  onBlockAll: () => void;
  onLockAccount: () => void;
  onTrust: () => void;
}) {
  return (
    <ModalOverlay zIndex={200}>
      <div className="w-full max-w-[520px] bg-[#111827] border border-[#EF4444]/30 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-[18px]">Suspicious Login Detected</h2>
              <p className="text-[#EF4444] text-[11px] font-bold uppercase tracking-widest">Immediate Action Required</p>
            </div>
          </div>
          <div className="px-2 py-1 bg-[#EF4444]/10 rounded text-[#EF4444] text-[10px] font-bold font-mono">CODE: SEV-1</div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-[#94A3B8] text-[14px] leading-relaxed">
            An unrecognized device has just accessed the <span className="text-white font-semibold">Super Admin</span> account from an unusual location.
          </p>

          {/* Map snippet */}
          <div className="relative h-32 w-full rounded-xl overflow-hidden border border-[#1E293B] bg-[#1A2235]">
            {/* Simplified map grid */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 200" fill="none">
              <path d="M0 50h400M0 100h400M0 150h400M100 0v200M200 0v200M300 0v200" stroke="#1E293B" strokeWidth="1" />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-3 rounded-full bg-[#EF4444] animate-ping absolute" />
              <div className="w-3 h-3 rounded-full bg-[#EF4444] relative" />
            </div>
            <div className="absolute bottom-2 left-2 bg-[#0B0E1A]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1E293B]">
              <p className="text-white text-[11px] font-bold">Moscow, Russia</p>
              <p className="text-[#64748B] text-[9px]">IP: 95.161.226.14</p>
            </div>
          </div>

          {/* Device details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1A2235] p-3 rounded-xl border border-[#1E293B]">
              <label className="text-[#64748B] text-[9px] font-bold uppercase tracking-wider block mb-1">Device Identity</label>
              <p className="text-white text-[12px] font-semibold">Linux x86_64</p>
              <p className="text-[#94A3B8] text-[11px]">Chrome 121.0.0 (Unstable)</p>
            </div>
            <div className="bg-[#1A2235] p-3 rounded-xl border border-[#1E293B]">
              <label className="text-[#64748B] text-[9px] font-bold uppercase tracking-wider block mb-1">Access Time</label>
              <p className="text-white text-[12px] font-semibold">Just now</p>
              <p className="text-[#94A3B8] text-[11px]">{new Date().toISOString().split('T')[0]} {new Date().toTimeString().slice(0, 8)} UTC</p>
            </div>
          </div>

          {/* Fingerprint */}
          <div className="bg-[#0B0E1A] p-3 rounded-lg border border-[#1E293B] font-mono">
            <label className="text-[#64748B] text-[9px] font-bold uppercase tracking-wider block mb-1">Unique Fingerprint</label>
            <p className="text-[#00C37B] text-[11px] break-all">FPR_9a2b_44c1_ee88_1092_00x_7822_bf11</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-5 bg-[#0D1120] border-t border-[#1E293B] flex flex-col gap-3">
          <button
            onClick={onBlockAll}
            className="w-full py-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-[14px] font-bold shadow-lg shadow-[#EF4444]/20 transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            BLOCK ACCESS &amp; LOGOUT ALL SESSIONS
          </button>
          <div className="flex gap-3">
            <button onClick={onLockAccount} className="flex-1 py-2.5 rounded-lg border border-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#1A2235] text-[12px] font-semibold transition-colors">
              NOT ME, LOCK ACCOUNT
            </button>
            <button onClick={onTrust} className="flex-1 py-2.5 rounded-lg bg-[#1A2235] text-white hover:bg-[#1E293B] text-[12px] font-semibold transition-colors">
              THIS WAS ME (TRUST)
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  SUBSCREEN: Active Sessions Management                     */
/* ═══════════════════════════════════════════════════════════ */
function SessionManagementView({
  sessions,
  onBack,
  onRevoke,
  onRevokeAll,
  onShowAlert,
}: {
  sessions: Session[];
  onBack: () => void;
  onRevoke: (s: Session) => void;
  onRevokeAll: () => void;
  onShowAlert: () => void;
}) {
  const nonCurrent = sessions.filter((s) => !s.current);
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-[#111827] border-b border-[#1E293B] px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-[#64748B] hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="h-4 w-[1px] bg-[#1E293B]" />
          <h1 className="text-white font-bold text-[16px]">Active Sessions Management</h1>
        </div>
        <div className="flex items-center gap-3">
          {nonCurrent.length > 0 && (
            <button
              onClick={onRevokeAll}
              className="px-4 py-2 bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/20 font-bold text-[12px] rounded-lg transition-all"
            >
              REVOKE ALL SESSIONS
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto bg-[#0B0E1A]">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Title + counter */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-[20px]">Current Sessions</h2>
              <p className="text-[#64748B] text-[13px] mt-1">
                Managing all active authenticated instances of your account across devices.
              </p>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] px-4 py-2 rounded-lg flex items-center gap-3">
              <span className="text-[#64748B] text-[12px]">Active Devices:</span>
              <span className="text-white font-bold text-[14px]">{sessions.length}</span>
            </div>
          </div>

          {/* Sessions table */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0D1120] border-b border-[#1E293B]">
                  <th className="px-6 py-4 text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Device &amp; Browser</th>
                  <th className="px-6 py-4 text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-[#64748B] text-[10px] font-bold uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-4 text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-4 text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[#64748B] text-[10px] font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#1A2235]/40 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          s.current ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'bg-[#94A3B8]/10 text-[#94A3B8]'
                        }`}>
                          <DeviceIcon type={s.icon} size={20} />
                        </div>
                        <div>
                          <p className="text-white text-[14px] font-bold">{s.device}</p>
                          <p className="text-[#64748B] text-[11px]">{s.browser}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px]">{s.flag}</span>
                        <p className="text-[#94A3B8] text-[13px]">{s.location}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-white font-mono text-[12px]">{s.ip}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[#94A3B8] text-[13px]">{s.lastActive}</p>
                    </td>
                    <td className="px-6 py-5">
                      {s.status === 'online' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00C37B]/10 text-[#00C37B] border border-[#00C37B]/20">Online</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">Idle</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {s.current ? (
                        <span className="text-[#64748B] text-[11px] font-bold italic">CURRENT SESSION</span>
                      ) : (
                        <button
                          onClick={() => onRevoke(s)}
                          className="px-4 py-1.5 rounded text-[11px] font-bold uppercase border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444] hover:text-white hover:border-[#EF4444] transition-all"
                        >
                          REVOKE
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Security best practices */}
          <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B] shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-white text-[14px] font-bold mb-1">Security Best Practices</h4>
              <p className="text-[#94A3B8] text-[12px] leading-relaxed">
                If you see a device or location you don&apos;t recognize, revoke the session immediately and change your password.
                We recommend using <span className="text-white font-medium">2-Factor Authentication</span> to prevent unauthorized access.
              </p>
            </div>
            <button
              onClick={onShowAlert}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-[#1E293B] text-[#64748B] hover:text-[#EF4444] hover:border-[#EF4444]/30 text-[10px] font-bold transition-colors"
              title="Test suspicious login alert"
            >
              TEST ALERT
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Toggle ───────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-block w-9 h-5 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={() => onChange(!checked)} className="sr-only peer" />
      <span className="absolute inset-0 rounded-full bg-[#1A2235] border border-[#1E293B] transition-colors peer-checked:bg-[#00C37B] peer-checked:border-[#00C37B]" />
      <span className="absolute top-[3px] left-[3px] h-3 w-3 rounded-full bg-[#94A3B8] transition-transform peer-checked:translate-x-4 peer-checked:bg-white" />
    </label>
  );
}

/* ── Input classes ────────────────────────────────────────── */
const inputClass =
  'bg-[#0D1120] border border-[#1E293B] rounded-lg px-[14px] py-[10px] text-white text-[13px] w-full outline-none transition-colors focus:border-[#00C37B]';
const selectClass = `${inputClass} appearance-none`;

/* ═══════════════════════════════════════════════════════════ */
/*  PAGE                                                      */
/* ═══════════════════════════════════════════════════════════ */
export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const profileQuery = useQuery({ queryKey: ['admin', 'profile'], queryFn: fetchProfile });
  const profile = profileQuery.data;

  /* ── General Account state ── */
  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : 'Super Admin';
  const [name, setName] = useState(displayName);
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('UTC +00:00 (Greenwich Mean Time)');
  const [language, setLanguage] = useState('English (US)');

  /* ── Preferences state ── */
  const [oddsFormat, setOddsFormat] = useState('decimal');
  const [notifyBetSettled, setNotifyBetSettled] = useState(true);
  const [notifyOddsMovement, setNotifyOddsMovement] = useState(true);
  const [notifyCreditReceived, setNotifyCreditReceived] = useState(true);
  const [prefsPrimed, setPrefsPrimed] = useState(false);

  useEffect(() => {
    if (profile && !prefsPrimed) {
      setOddsFormat(profile.preferences.oddsFormat);
      setNotifyBetSettled(profile.preferences.notifyBetSettled);
      setNotifyOddsMovement(profile.preferences.notifyOddsMovement);
      setNotifyCreditReceived(profile.preferences.notifyCreditReceived);
      setPrefsPrimed(true);
    }
  }, [profile, prefsPrimed]);

  const prefsMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] });
      toast({ title: 'Settings saved', description: 'Your settings have been updated.' });
    },
    onError: () => {
      toast({ title: 'Failed to save', description: 'Could not update settings.', variant: 'destructive' });
    },
  });

  /* ── Password state ── */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast({ title: 'Password changed', description: 'Your admin password has been updated.' });
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (err as { response: { data: { message: string } } }).response.data.message
          : 'Failed to change password';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });

  const passwordMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Minimum 6 characters.', variant: 'destructive' });
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword, confirmPassword });
  };

  /* ── Notification toggles ── */
  const [notifSecurityInApp, setNotifSecurityInApp] = useState(true);
  const [notifSecurityEmail, setNotifSecurityEmail] = useState(true);
  const [notifSecuritySms, setNotifSecuritySms] = useState(true);
  const [notifTxInApp, setNotifTxInApp] = useState(true);
  const [notifTxEmail, setNotifTxEmail] = useState(true);
  const [notifTxSms, setNotifTxSms] = useState(false);
  const [notifAgentInApp, setNotifAgentInApp] = useState(true);
  const [notifAgentEmail, setNotifAgentEmail] = useState(false);
  const [notifAgentSms, setNotifAgentSms] = useState(false);

  /* ── Active Sessions ── */
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [sessionView, setSessionView] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Session | null>(null);
  const [revokingSession, setRevokingSession] = useState<Session | null>(null);
  const [revokedSession, setRevokedSession] = useState<Session | null>(null);
  const [showTerminateAll, setShowTerminateAll] = useState(false);
  const [showSuspiciousLogin, setShowSuspiciousLogin] = useState(false);

  const handleRevokeConfirm = () => {
    if (!revokeTarget) return;
    const target = revokeTarget;
    setRevokeTarget(null);
    setRevokingSession(target);
    setTimeout(() => {
      setRevokingSession(null);
      setRevokedSession(target);
    }, 2000);
  };

  const handleRevokedDismiss = () => {
    if (revokedSession) {
      setSessions((prev) => prev.filter((s) => s.id !== revokedSession.id));
    }
    setRevokedSession(null);
  };

  const handleTerminateAll = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    setShowTerminateAll(false);
    toast({ title: 'All sessions terminated', description: 'All remote sessions have been revoked.' });
  };

  const handleSuspiciousBlockAll = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    setShowSuspiciousLogin(false);
    toast({ title: 'All sessions blocked', description: 'All remote sessions have been terminated.', variant: 'destructive' });
  };

  /* ── System Preferences ── */
  const [theme, setTheme] = useState<'green' | 'indigo'>('green');
  const [compactMode, setCompactMode] = useState(false);
  const [highContrast, setHighContrast] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('Real-time (3s)');

  /* ── Save handler ── */
  const handleSaveAll = () => {
    prefsMutation.mutate({
      oddsFormat,
      timezone: profile?.preferences.timezone || 'UTC',
      notifyBetSettled,
      notifyOddsMovement,
      notifyCreditReceived,
    });
  };

  /* ── Shared modals (rendered in both views) ── */
  const modals = (
    <>
      {revokeTarget && (
        <RevokeConfirmModal
          session={revokeTarget}
          onCancel={() => setRevokeTarget(null)}
          onConfirm={handleRevokeConfirm}
        />
      )}
      {revokingSession && <RevokingLoadingModal session={revokingSession} />}
      {revokedSession && <SessionRevokedModal session={revokedSession} onDismiss={handleRevokedDismiss} />}
      {showTerminateAll && (
        <GlobalTerminateModal
          sessions={sessions}
          onCancel={() => setShowTerminateAll(false)}
          onConfirm={handleTerminateAll}
        />
      )}
      {showSuspiciousLogin && (
        <SuspiciousLoginModal
          onBlockAll={handleSuspiciousBlockAll}
          onLockAccount={() => {
            setShowSuspiciousLogin(false);
            toast({ title: 'Account locked', description: 'Your account has been locked. Contact support to unlock.' });
          }}
          onTrust={() => {
            setShowSuspiciousLogin(false);
            toast({ title: 'Device trusted', description: 'This device has been marked as trusted.' });
          }}
        />
      )}
    </>
  );

  /* ═══ SESSION MANAGEMENT SUBSCREEN ═══ */
  if (sessionView) {
    return (
      <>
        <SessionManagementView
          sessions={sessions}
          onBack={() => setSessionView(false)}
          onRevoke={(s) => setRevokeTarget(s)}
          onRevokeAll={() => setShowTerminateAll(true)}
          onShowAlert={() => setShowSuspiciousLogin(true)}
        />
        {modals}
      </>
    );
  }

  /* ═══ MAIN SETTINGS PAGE ═══ */
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-[#111827] border-b border-[#1E293B] px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold text-[18px]">System Settings</h1>
          <div className="h-4 w-[1px] bg-[#1E293B]" />
          <p className="text-[#64748B] text-[11px] font-semibold uppercase tracking-wider">
            Configure Account &amp; Platform
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-[#94A3B8] font-bold text-[12px] hover:text-white transition-colors">
            Discard Changes
          </button>
          <button
            onClick={handleSaveAll}
            disabled={prefsMutation.isPending}
            className="px-6 py-2 bg-[#00C37B] text-[#0B0E1A] font-extrabold text-[12px] rounded-lg shadow-[0_0_15px_rgba(0,195,123,0.3)] disabled:opacity-50"
          >
            {prefsMutation.isPending ? 'SAVING...' : 'SAVE SETTINGS'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#0B0E1A]">
        <div className="max-w-6xl mx-auto p-8 space-y-8">

          {/* ═══════ General Account ═══════ */}
          <section className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C37B" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <h2 className="text-white font-bold text-[15px]">General Account</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Display Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@betarena.io" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectClass}>
                  <option>UTC +00:00 (Greenwich Mean Time)</option>
                  <option>UTC +08:00 (Singapore Standard Time)</option>
                  <option>UTC -05:00 (Eastern Standard Time)</option>
                  <option>UTC -08:00 (Pacific Standard Time)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Interface Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClass}>
                  <option>English (US)</option>
                  <option>Spanish (ES)</option>
                  <option>Vietnamese (VN)</option>
                  <option>Russian (RU)</option>
                </select>
              </div>
            </div>
          </section>

          {/* ═══════ Security & Access ═══════ */}
          <section className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <h2 className="text-white font-bold text-[15px]">Security &amp; Access</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-12 gap-10">
                {/* Left: Password + Sessions */}
                <div className="col-span-7 space-y-6">
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <p className="text-[#F1F5F9] text-[13px] font-bold">Change Password</p>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        className={inputClass}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="password"
                          placeholder="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          className={inputClass}
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          className={inputClass}
                        />
                      </div>
                      {passwordMismatch && (
                        <p className="text-[11px] text-[#EF4444]">Passwords do not match.</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={passwordMutation.isPending || !currentPassword || !newPassword || !confirmPassword || Boolean(passwordMismatch)}
                      className="w-full py-2 bg-[#1A2235] border border-[#1E293B] text-white text-[12px] font-bold rounded-lg hover:bg-[#1E293B] transition-colors disabled:opacity-50"
                    >
                      {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>

                  <div className="h-[1px] bg-[#1E293B]" />

                  {/* Active Sessions compact view */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[#F1F5F9] text-[13px] font-bold">Active Sessions</p>
                      <button
                        onClick={() => setSessionView(true)}
                        className="text-[#00C37B] text-[11px] font-bold hover:underline flex items-center gap-1"
                      >
                        Manage All Sessions
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {sessions.slice(0, 3).map((session) => (
                        <div
                          key={session.id}
                          className={`flex items-center justify-between p-3 bg-[#0D1120] border border-[#1E293B] rounded-lg${
                            session.status === 'idle' ? ' opacity-70' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${
                              session.current
                                ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                                : 'bg-[#94A3B8]/10 text-[#94A3B8]'
                            }`}>
                              <DeviceIcon type={session.icon} />
                            </div>
                            <div>
                              <p className="text-white text-[12px] font-bold">
                                {session.device}
                                {session.location ? ` \u2022 ${session.location.split(',')[0]}` : ''}
                              </p>
                              <p className="text-[#64748B] text-[10px]">
                                {session.lastActive}
                                {session.ip ? ` \u2022 ${session.ip}` : ''}
                              </p>
                            </div>
                          </div>
                          {session.current ? (
                            <span className="text-[#00C37B] text-[10px] font-bold uppercase">Online</span>
                          ) : (
                            <button
                              onClick={() => setRevokeTarget(session)}
                              className="text-[#EF4444] text-[10px] font-bold uppercase hover:underline"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                      {sessions.length > 3 && (
                        <button
                          onClick={() => setSessionView(true)}
                          className="w-full py-2 text-[#64748B] text-[11px] font-semibold hover:text-white transition-colors"
                        >
                          +{sessions.length - 3} more session{sessions.length - 3 > 1 ? 's' : ''}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: 2FA */}
                <div className="col-span-5 bg-[#0D1120] border border-[#1E293B] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white font-bold text-[13px]">Two-Factor Auth</p>
                    <Toggle checked={false} onChange={() => {}} />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-[#1A2235] border border-[#1E293B] rounded-lg p-6 mb-4 flex items-center justify-center">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="3" height="3" />
                        <rect x="18" y="14" width="3" height="3" />
                        <rect x="14" y="18" width="3" height="3" />
                        <rect x="18" y="18" width="3" height="3" />
                      </svg>
                    </div>
                    <p className="text-[#64748B] text-[11px] text-center mb-4">
                      Enable 2FA and scan the QR code with your authenticator app to secure your account.
                    </p>
                    <div className="w-full flex items-center gap-2 p-2 bg-[#1A2235] border border-[#1E293B] rounded font-mono text-[11px] text-center justify-center text-[#64748B]">
                      Not configured
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════ Notification Rules ═══════ */}
          <section className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <h2 className="text-white font-bold text-[15px]">Notification Rules</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#1A2235]/50 border-b border-[#1E293B]">
                  <tr>
                    <th className="px-6 py-4 text-[#64748B] text-[10px] font-bold uppercase tracking-widest">Event Type</th>
                    <th className="px-6 py-4 text-[#64748B] text-[10px] font-bold uppercase tracking-widest text-center">In-App</th>
                    <th className="px-6 py-4 text-[#64748B] text-[10px] font-bold uppercase tracking-widest text-center">Email</th>
                    <th className="px-6 py-4 text-[#64748B] text-[10px] font-bold uppercase tracking-widest text-center">SMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  <tr className="hover:bg-[#1A2235]/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white text-[13px] font-bold">Security Alerts</p>
                      <p className="text-[#64748B] text-[10px]">Failed logins, password changes, new device</p>
                    </td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Toggle checked={notifSecurityInApp} onChange={setNotifSecurityInApp} /></div></td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Toggle checked={notifSecurityEmail} onChange={setNotifSecurityEmail} /></div></td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Toggle checked={notifSecuritySms} onChange={setNotifSecuritySms} /></div></td>
                  </tr>
                  <tr className="hover:bg-[#1A2235]/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white text-[13px] font-bold">Large Transactions</p>
                      <p className="text-[#64748B] text-[10px]">Withdrawals or allocations exceeding 10,000 CR</p>
                    </td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Toggle checked={notifTxInApp} onChange={setNotifTxInApp} /></div></td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Toggle checked={notifTxEmail} onChange={setNotifTxEmail} /></div></td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Toggle checked={notifTxSms} onChange={setNotifTxSms} /></div></td>
                  </tr>
                  <tr className="hover:bg-[#1A2235]/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white text-[13px] font-bold">Agent Activity</p>
                      <p className="text-[#64748B] text-[10px]">New agent onboarding or status updates</p>
                    </td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Toggle checked={notifAgentInApp} onChange={setNotifAgentInApp} /></div></td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Toggle checked={notifAgentEmail} onChange={setNotifAgentEmail} /></div></td>
                    <td className="px-6 py-4"><div className="flex justify-center"><Toggle checked={notifAgentSms} onChange={setNotifAgentSms} /></div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ═══════ System Preferences ═══════ */}
          <section className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              <h2 className="text-white font-bold text-[15px]">System Preferences</h2>
            </div>
            <div className="p-6 grid grid-cols-3 gap-8">
              {/* UI Theme */}
              <div className="space-y-4">
                <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">UI Theme</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('green')}
                    className={`flex-1 bg-[#0D1120] border-2 rounded-lg p-3 text-center transition-all ${
                      theme === 'green' ? 'border-[#00C37B]' : 'border-[#1E293B] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="h-3 w-3 bg-[#00C37B] rounded-full mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-white">Midnight Green</p>
                  </button>
                  <button
                    onClick={() => setTheme('indigo')}
                    className={`flex-1 bg-[#0D1120] border-2 rounded-lg p-3 text-center transition-all ${
                      theme === 'indigo' ? 'border-[#3B82F6]' : 'border-[#1E293B] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="h-3 w-3 bg-[#3B82F6] rounded-full mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-white">Deep Indigo</p>
                  </button>
                </div>
              </div>

              {/* Display Options */}
              <div className="space-y-4 border-l border-[#1E293B] pl-8">
                <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Display Options</p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white">Compact Mode</span>
                  <Toggle checked={compactMode} onChange={setCompactMode} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-white">High Contrast Graphs</span>
                  <Toggle checked={highContrast} onChange={setHighContrast} />
                </div>
              </div>

              {/* Data Refresh Interval */}
              <div className="space-y-4 border-l border-[#1E293B] pl-8">
                <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">Data Refresh Interval</p>
                <div className="space-y-2">
                  <select value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)} className={selectClass}>
                    <option>Real-time (3s)</option>
                    <option>10 seconds</option>
                    <option>30 seconds</option>
                    <option>Manual only</option>
                  </select>
                  <p className="text-[#64748B] text-[10px]">Faster refreshes consume more API bandwidth.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="h-12" />
        </div>
      </main>

      {modals}
    </div>
  );
}
