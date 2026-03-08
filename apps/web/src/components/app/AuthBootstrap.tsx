'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

const PUBLIC_BROWSE_ROUTES = [
  '/',
  '/sports',
  '/in-play',
  '/results',
  '/live',
];

function isPublicBrowseRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return PUBLIC_BROWSE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function AuthBootstrap() {
  const pathname = usePathname();
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    void hydrateSession({ publicOnly: isPublicBrowseRoute(pathname) });
  }, [hydrateSession, pathname]);

  return null;
}
