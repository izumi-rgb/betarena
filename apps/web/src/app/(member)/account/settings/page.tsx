'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

type Prefs = {
  oddsFormat: 'decimal' | 'fractional' | 'american';
  timezone: string;
  notifyBetSettled: boolean;
  notifyOddsMovement: boolean;
  notifyCreditReceived: boolean;
};
type MeResponse = {
  preferences?: Partial<Prefs>;
};

const NAV = [
  { href: '/sports', label: 'Sports' },
  { href: '/in-play', label: 'In-Play' },
  { href: '/live', label: 'Live Stream' },
  { href: '/my-bets', label: 'My Bets' },
  { href: '/results', label: 'Results' },
  { href: '/account', label: 'Account' },
];

export default function SettingsPage() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const mustChangePassword = user?.must_change_password === true;
  const [prefs, setPrefs] = useState<Prefs>({
    oddsFormat: 'decimal',
    timezone: 'UTC',
    notifyBetSettled: true,
    notifyOddsMovement: true,
    notifyCreditReceived: true,
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiGet<MeResponse>('/api/auth/me')
      .then((res) => {
        const p = res.data?.preferences || {};
        setPrefs((prev) => ({
          ...prev,
          oddsFormat: p.oddsFormat || prev.oddsFormat,
          timezone: p.timezone || prev.timezone,
          notifyBetSettled: p.notifyBetSettled ?? prev.notifyBetSettled,
          notifyOddsMovement: p.notifyOddsMovement ?? prev.notifyOddsMovement,
          notifyCreditReceived: p.notifyCreditReceived ?? prev.notifyCreditReceived,
        }));
      })
      .catch(() => undefined);
  }, []);

  const savePrefs = async (next: Partial<Prefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    try {
      await apiPatch('/api/auth/preferences', merged);
    } catch {
      setMessage('Failed to save preferences');
    }
  };

  const updatePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      setMessage('Password validation failed');
      return;
    }
    try {
      await apiPost('/api/auth/change-password', { currentPassword, newPassword, confirmPassword });
      setMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await fetchMe({ silent: true });
    } catch {
      setMessage('Password update failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E1A] text-white">
      <header className="flex h-16 items-center justify-between border-b border-[#1E293B] bg-[#111827]/80 px-6">
        <nav className="flex gap-1">
          {NAV.map((t) => <Link key={t.href} href={t.href} className={`rounded px-4 py-2 text-sm ${pathname === t.href ? 'bg-[#1A2235]' : 'text-[#94A3B8]'}`}>{t.label}</Link>)}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        {mustChangePassword ? (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            You must change your password before continuing.
          </div>
        ) : null}
        {message ? <div className="rounded border border-[#1E293B] bg-[#1A2235] px-3 py-2 text-sm text-[#94A3B8]">{message}</div> : null}

        <section className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
          <h2 className="mb-3 font-semibold">Preferences</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-[#94A3B8]">Odds Format</label>
              <div className="flex gap-2">
                {(['decimal', 'fractional', 'american'] as const).map((fmt) => (
                  <button key={fmt} onClick={() => savePrefs({ oddsFormat: fmt })} className={`rounded px-3 py-1.5 text-sm ${prefs.oddsFormat === fmt ? 'bg-[#00C37B] text-[#0B0E1A]' : 'bg-[#0B0E1A]'}`}>
                    {fmt[0].toUpperCase() + fmt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-[#94A3B8]">Timezone</label>
              <select value={prefs.timezone} onChange={(e) => savePrefs({ timezone: e.target.value })} className="w-full rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-2">
                <option>UTC</option>
                <option>Africa/Nairobi</option>
                <option>Europe/London</option>
                <option>America/New_York</option>
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#64748B]">Theme: Dark only (locked)</p>
        </section>

        <section className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
          <h2 className="mb-3 font-semibold">Security</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-2" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-2" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="rounded border border-[#1E293B] bg-[#0B0E1A] px-3 py-2" />
          </div>
          <button onClick={updatePassword} className="mt-3 rounded bg-[#00C37B] px-4 py-2 font-semibold text-[#0B0E1A]">Update Password</button>
        </section>

        <section className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
          <h2 className="mb-3 font-semibold">Session</h2>
          <div className="text-sm text-[#94A3B8]">Device: Chrome on Linux · IP: 192.168.x.x · Last active: Today 14:23</div>
          <button className="mt-3 rounded border border-[#EF4444] px-4 py-2 text-sm text-[#EF4444]">Sign Out All Devices</button>
        </section>

        <section className="rounded-xl border border-[#1E293B] bg-[#1A2235] p-4">
          <h2 className="mb-3 font-semibold">Notifications</h2>
          <div className="space-y-2 text-sm">
            <label className="flex items-center justify-between"><span>Bet Settled notifications</span><input type="checkbox" checked={prefs.notifyBetSettled} onChange={(e) => savePrefs({ notifyBetSettled: e.target.checked })} /></label>
            <label className="flex items-center justify-between"><span>Odds Movement alerts</span><input type="checkbox" checked={prefs.notifyOddsMovement} onChange={(e) => savePrefs({ notifyOddsMovement: e.target.checked })} /></label>
            <label className="flex items-center justify-between"><span>Credit Received alerts</span><input type="checkbox" checked={prefs.notifyCreditReceived} onChange={(e) => savePrefs({ notifyCreditReceived: e.target.checked })} /></label>
          </div>
        </section>
      </main>
    </div>
  );
}
