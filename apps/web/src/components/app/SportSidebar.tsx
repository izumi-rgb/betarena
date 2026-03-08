'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';
import { BalanceBadge } from '@/components/app/BalanceBadge';
import { MemberSidebarProfile } from '@/components/app/MemberSidebarProfile';

const MEMBER_NAV_LINKS = [
  { href: '/sports', label: 'Home' },
  { href: '/in-play', label: 'In-Play' },
  { href: '/results', label: 'Results' },
  { href: '/my-bets', label: 'My Bets' },
  { href: '/account', label: 'Account' },
];

function getInitials(name?: string): string {
  if (!name) return '??';
  const parts = name.split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function SportSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { balance } = useBalance();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    router.push('/login');
  };

  return (
    <aside className="w-[240px] shrink-0 border-r border-[#1E293B] bg-[#111827] flex flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-[#1E293B] px-6">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B]">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
        </svg>
        <span className="text-[20px] font-extrabold tracking-tight text-white">
          BET<span className="text-[#00C37B]">ARENA</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {MEMBER_NAV_LINKS.map((l) => {
          const active = pathname === l.href || (l.href === '/sports' && pathname?.startsWith('/sports/'));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-l-[3px] border-[#00C37B] bg-[#1A2235] text-white'
                  : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      {isAuthenticated && user && (
        <div className="relative border-t border-[#1E293B] p-4">
          <MemberSidebarProfile
            initials={getInitials(user.username)}
            username={user.username}
            balanceLabel={balance != null ? `${balance.toFixed(2)} CR` : '...'}
            onClick={() => setShowMenu((v) => !v)}
          />
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute bottom-full left-4 right-4 mb-2 z-50 bg-[#1A2235] border border-[#1E293B] rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-[13px] font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

export function TopHeader() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#1E293B] bg-[#111827]/80 px-6 backdrop-blur">
      <nav className="flex gap-1">
        {MEMBER_NAV_LINKS.map((t) => {
          const active = pathname === t.href || (t.href === '/sports' && pathname?.startsWith('/sports/'));
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#1A2235] text-white'
                  : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {isAuthenticated && (
        <div className="flex items-center gap-3">
          {user && <span className="text-xs text-[#94A3B8]">{user.username}</span>}
          <BalanceBadge />
        </div>
      )}
    </header>
  );
}
