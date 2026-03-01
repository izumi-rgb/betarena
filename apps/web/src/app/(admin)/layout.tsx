'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CreditsProvider } from '@/contexts/CreditsContext';

const NAV_ITEMS = [
  { href: '/overview', label: 'Dashboard' },
  { href: '/agents', label: 'Agents' },
  { href: '/credits-panel', label: 'Credits' },
  { href: '/logs', label: 'Audit Logs' },
  { href: '/settings', label: 'Settings' },
];

function AdminTopNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-[#1A2235] text-[#00C37B]' : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <CreditsProvider>
        <div className="min-h-screen bg-[#0B0E1A] text-[#F1F5F9]">
          <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#1E293B] bg-[#111827] px-8">
            <div className="flex w-1/4 items-center gap-4">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B]">
                  <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                </svg>
                <span className="text-[20px] font-extrabold tracking-tight text-white">
                  BET<span className="text-[#00C37B]">ARENA</span>
                </span>
              </div>
              <div className="mx-2 h-6 w-px bg-[#1E293B]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Admin Control Center</span>
            </div>

            <AdminTopNav />

            <div className="flex w-1/4 items-center justify-end gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[#EF4444]" />
                <span className="text-[12px] font-semibold text-[#EF4444]">Platform Live</span>
              </div>
              <div className="h-9 w-9 cursor-pointer rounded-full border-2 border-[#1E293B] bg-gradient-to-br from-red-500 to-orange-500 shadow-lg transition-colors hover:border-[#00C37B]" />
            </div>
          </header>

          <main>
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </CreditsProvider>
    </AuthGuard>
  );
}
