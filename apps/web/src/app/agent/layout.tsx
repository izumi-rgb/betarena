'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CreditsProvider, useCredits } from '@/contexts/CreditsContext';
import { useAuthStore } from '@/stores/authStore';

const NAV_ITEMS = [
  {
    href: '/agent/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/agent/members',
    label: 'My Members',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/agent/sub-agents',
    label: 'Sub-Agents',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        <path d="M10 7h4" /><path d="M7 14v-4" /><path d="M14 17h-4" />
      </svg>
    ),
  },
  {
    href: '/agent/credits',
    label: 'Credits',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
      </svg>
    ),
  },
  {
    href: '/agent/reports',
    label: 'Reports',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

function AgentSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { balance, formatBalance, isLoading: balanceLoading } = useCredits();

  const displayName = user?.display_id || user?.username || 'Agent';

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-[#1E293B] bg-[#111827]">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B]">
            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
          </svg>
          <span className="text-[20px] font-extrabold tracking-tight text-white">
            BET<span className="text-[#00C37B]">ARENA</span>
          </span>
        </div>
      </div>

      <div className="h-px w-full bg-[#1E293B]" />

      <nav className="flex-1 px-4 py-4">
        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Main Menu</div>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center gap-3 rounded-md border-l-[3px] px-4 py-2.5 text-[14px] font-medium transition-all ${
                active
                  ? 'border-l-[#00C37B] bg-[#1E2D45] text-[#00C37B]'
                  : 'border-l-transparent text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1E293B] p-4 space-y-3">
        <div className="flex flex-col gap-1">
          <Link
            href="/agent/settings"
            className={`flex items-center gap-2 rounded-md border-l-[3px] px-3 py-2 text-[13px] font-medium transition-all ${
              pathname === '/agent/settings' || pathname?.startsWith('/agent/settings/')
                ? 'border-l-[#00C37B] bg-[#1E2D45] text-[#00C37B]'
                : 'border-l-transparent text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
          <Link
            href="/agent/credits"
            className={`flex items-center gap-2 rounded-md border-l-[3px] px-3 py-2 text-[13px] font-medium transition-all ${
              pathname === '/agent/credits' || pathname?.startsWith('/agent/credits/')
                ? 'border-l-[#00C37B] bg-[#1E2D45] text-[#00C37B]'
                : 'border-l-transparent text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
            </svg>
            Credits
          </Link>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-[#1E293B] bg-[#0B0E1A] p-3">
          <div className="h-8 w-8 rounded-full border border-[#1A2235] bg-gradient-to-br from-purple-500 to-blue-500 shrink-0 flex items-center justify-center text-[10px] font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-white">{displayName}</div>
            <div className="truncate text-[11px] font-mono text-[#00C37B]">
              {balanceLoading ? '…' : formatBalance(balance)}
            </div>
            <div className="truncate text-[10px] text-[#64748B]">
              {user?.role === 'sub_agent' ? 'Sub-Agent' : 'Master Agent'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['agent', 'sub_agent']}>
      <CreditsProvider>
        <div className="flex h-screen overflow-hidden bg-[#0B0E1A] text-[#F1F5F9]">
          <AgentSidebar />
          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </CreditsProvider>
    </AuthGuard>
  );
}
