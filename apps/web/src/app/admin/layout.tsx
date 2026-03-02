'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CreditsProvider } from '@/contexts/CreditsContext';
import { useAuthStore } from '@/stores/authStore';

const NAV_ITEMS = [
  {
    href: '/admin/overview',
    label: 'Overview',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/admin/agents',
    label: 'Agents',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/credits-panel',
    label: 'Credits',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    href: '/admin/users/members',
    label: 'Users',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: '/admin/logs',
    label: 'System Logs',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
];

/* ── Logout Confirmation Modal ──────────────────────────────── */
function LogoutModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(11, 14, 26, 0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-[440px] bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#1E293B] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-[18px]">End Admin Session</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-[#94A3B8] text-[14px] leading-relaxed">
            You are about to log out of your <span className="text-white font-semibold">Administrator</span> session.
          </p>
          <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg p-4">
            <p className="text-[#EF4444] text-[12px] font-medium">
              <strong>Warning:</strong> This will terminate your active session immediately. You will need to sign in again to access the admin panel.
            </p>
          </div>
          <p className="text-[#64748B] text-[12px]">Are you sure you want to continue?</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-[#0D1120] border-t border-[#1E293B] flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1A2235] text-[13px] font-semibold transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] font-bold shadow-lg shadow-[#EF4444]/20 transition-all disabled:opacity-50"
          >
            {loading ? 'LOGGING OUT...' : 'LOGOUT'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Admin Sidebar ─────────────────────────────────────────── */
function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : 'Super Admin';

  return (
    <aside
      className="w-56 bg-[#0D1120] border-r border-[#1E293B] flex flex-col shrink-0 overflow-y-auto"
      style={{ height: '100vh', position: 'sticky', top: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-[#1E293B]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B] shrink-0">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
        </svg>
        <span className="text-white font-extrabold text-[15px] tracking-tight">
          BET<span className="text-[#00C37B]">ARENA</span>
        </span>
      </div>

      {/* Nav */}
      <div className="px-3 pt-4 pb-2 flex-1">
        <p className="text-[#64748B] text-[9px] font-bold uppercase tracking-widest px-2 mb-2">Admin Panel</p>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                  active
                    ? 'bg-[#00C37B]/10 border border-[#00C37B]/20 text-[#00C37B] font-semibold'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1A2235] font-medium'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile + Dropdown */}
      <div className="mt-auto px-3 pb-4 border-t border-[#1E293B] pt-4 relative" ref={dropdownRef}>
        {/* Dropdown menu */}
        {dropdownOpen && (
          <div className="absolute bottom-[60px] left-0 right-0 bg-[#111827] border border-[#1E293B] rounded-[10px] overflow-hidden shadow-[0_-8px_24px_rgba(0,0,0,0.5)] z-[100]">
            {/* User info header */}
            <div className="px-3 py-3 border-b border-[#1E293B]">
              <div className="text-white text-[12px] font-bold">{displayName}</div>
              <div className="text-[#64748B] text-[10px]">Administrator</div>
            </div>

            {/* My Profile */}
            <button
              onClick={() => { setDropdownOpen(false); router.push('/admin/profile'); }}
              className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-[12px] font-semibold text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#F1F5F9] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              My Profile
            </button>

            {/* Settings */}
            <button
              onClick={() => { setDropdownOpen(false); router.push('/admin/settings'); }}
              className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-[12px] font-semibold text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#F1F5F9] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>

            {/* Divider */}
            <div className="h-px bg-[#1E293B] mx-0 my-[2px]" />

            {/* Logout */}
            <button
              onClick={() => { setDropdownOpen(false); onLogout(); }}
              className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-[12px] font-semibold text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        )}

        {/* Profile trigger */}
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex w-full items-center gap-3 px-2 cursor-pointer rounded-lg hover:bg-[#1A2235] py-1.5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0" />
          <div className="text-left">
            <div className="text-white text-[12px] font-bold">{displayName}</div>
            <div className="text-[#64748B] text-[10px]">Full Access</div>
          </div>
          <svg
            className={`ml-auto text-[#64748B] transition-transform ${dropdownOpen ? '' : 'rotate-180'}`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = async () => {
    await useAuthStore.getState().logout();
    router.push('/login');
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <CreditsProvider>
        <div className="min-h-screen bg-[#0B0E1A] text-[#F1F5F9] flex overflow-hidden">
          <AdminSidebar onLogout={() => setShowLogoutModal(true)} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>
        {showLogoutModal && (
          <LogoutModal
            onCancel={() => setShowLogoutModal(false)}
            onConfirm={handleLogoutConfirm}
          />
        )}
      </CreditsProvider>
    </AuthGuard>
  );
}
