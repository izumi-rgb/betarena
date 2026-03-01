'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BalanceBadge } from '@/components/app/BalanceBadge';

const MEMBER_NAV_LINKS = [
  { href: '/sports', label: 'Home' },
  { href: '/in-play', label: 'In-Play' },
  { href: '/results', label: 'Results' },
  { href: '/my-bets', label: 'My Bets' },
  { href: '/account', label: 'Account' },
];

export function SportSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] shrink-0 border-r border-[#1E293B] bg-[#111827]">
      <div className="flex h-16 items-center gap-2 border-b border-[#1E293B] px-6">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-[#00C37B]">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
        </svg>
        <span className="text-[20px] font-extrabold tracking-tight text-white">
          BET<span className="text-[#00C37B]">ARENA</span>
        </span>
      </div>
      <nav className="space-y-1 p-3">
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
