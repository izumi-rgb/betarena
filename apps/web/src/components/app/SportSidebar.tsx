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

const FOOTBALL_LEAGUES = [
  { slug: 'premier-league', label: 'Premier League' },
  { slug: 'la-liga', label: 'La Liga' },
  { slug: 'champions-league', label: 'Champions Lg' },
  { slug: 'bundesliga', label: 'Bundesliga' },
  { slug: 'serie-a', label: 'Serie A' },
];

const SPORT_LINKS = [
  { href: '/sports/football', label: 'Football', icon: '\u26BD' },
  { href: '/sports/tennis', label: 'Tennis', icon: '\uD83C\uDFBE' },
  { href: '/sports/basketball', label: 'Basketball', icon: '\uD83C\uDFC0' },
  { href: '/sports/golf', label: 'Golf', icon: '\u26F3' },
  { href: '/sports/esports', label: 'Esports', icon: '\uD83C\uDFAE' },
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
  const [footballOpen, setFootballOpen] = useState(
    () => !!pathname?.startsWith('/sports/football'),
  );

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

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
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

        <div className="mt-4 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
          All Sports
        </div>

        {SPORT_LINKS.map((sport) => {
          const isFootball = sport.href === '/sports/football';
          const sportActive = !!pathname?.startsWith(sport.href);

          return (
            <div key={sport.href}>
              <div className="flex items-center">
                <Link
                  href={sport.href}
                  className={`flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    sportActive
                      ? 'border-l-[3px] border-[#00C37B] bg-[#1A2235] text-white'
                      : 'text-[#94A3B8] hover:bg-[#1A2235] hover:text-white'
                  }`}
                >
                  <span className="text-base">{sport.icon}</span>
                  {sport.label}
                </Link>
                {isFootball && (
                  <button
                    onClick={() => setFootballOpen((v) => !v)}
                    className="mr-1 rounded p-1 text-[#64748B] hover:bg-[#1A2235] hover:text-white transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform ${footballOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}
              </div>

              {isFootball && footballOpen && (
                <div className="ml-1 space-y-0.5">
                  {FOOTBALL_LEAGUES.map((league) => {
                    const leagueHref = `/sports/football?league=${league.slug}`;
                    const leagueActive = pathname === '/sports/football' &&
                      typeof window !== 'undefined' &&
                      new URLSearchParams(window.location.search).get('league') === league.slug;
                    return (
                      <Link
                        key={league.slug}
                        href={leagueHref}
                        className={`block rounded-md py-1.5 pl-10 pr-3 text-xs font-medium transition-colors ${
                          leagueActive
                            ? 'text-[#00C37B]'
                            : 'text-[#64748B] hover:bg-[#1A2235] hover:text-[#94A3B8]'
                        }`}
                      >
                        {league.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
