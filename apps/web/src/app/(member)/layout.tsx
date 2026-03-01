'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MemberGlobalChrome } from '@/components/app/MemberGlobalChrome';
import { SocketBootstrap } from '@/components/app/SocketBootstrap';
import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CreditsProvider } from '@/contexts/CreditsContext';
import { AppShell } from '@/components/app/AppShell';

// Sports that already include SportSidebar + TopHeader inline in their event detail pages.
// Listing pages (/sports/cricket, not /sports/cricket/some-id) still get AppShell.
const SPORTS_WITH_INLINE_CHROME = ['basketball', 'tennis', 'esports', 'golf', 'cricket'];

function needsAppShell(pathname: string | null): boolean {
  if (!pathname) return false;
  if (!pathname.startsWith('/sports/')) return false;
  if (pathname === '/sports') return false;
  // /sports/basketball/someId → has inline chrome → skip AppShell
  return !SPORTS_WITH_INLINE_CHROME.some((sport) => pathname.startsWith(`/sports/${sport}/`));
}

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const requireAuth = Boolean(pathname?.startsWith('/my-bets') || pathname?.startsWith('/account'));
  const showAppShell = needsAppShell(pathname);

  return (
    <>
      <SocketBootstrap />
      <CreditsProvider>
        <AuthGuard requireAuth={requireAuth}>
          <ErrorBoundary>
            {showAppShell ? (
              <AppShell>{children}</AppShell>
            ) : (
              <div>{children}</div>
            )}
          </ErrorBoundary>
        </AuthGuard>
        <MemberGlobalChrome />
      </CreditsProvider>
    </>
  );
}
