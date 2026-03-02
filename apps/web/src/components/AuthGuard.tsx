'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

type AuthGuardProps = {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
};

function centeredLoader(label: string) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-md border border-[#1E293B] bg-[#111827] px-4 py-3 text-sm text-[#94A3B8]">
        {label}
      </div>
    </div>
  );
}

export function AuthGuard({ children, requireAuth = true, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!requireAuth || isHydrating) {
      return;
    }

    if (allowedRoles?.length && user && !allowedRoles.includes(user.role)) {
      if (user.role === 'admin') {
        router.replace('/admin/overview');
        return;
      }
      if (user.role === 'agent' || user.role === 'sub_agent') {
        router.replace('/agent/dashboard');
        return;
      }
      router.replace('/sports');
    }
  }, [allowedRoles, isAuthenticated, isHydrating, pathname, requireAuth, router, user]);

  if (requireAuth && isHydrating) {
    return centeredLoader('Checking session...');
  }

  if (requireAuth && !isAuthenticated) {
    router.push(`/login?next=${encodeURIComponent(pathname || '/sports')}`);
    return null;
  }

  if (allowedRoles?.length && user && !allowedRoles.includes(user.role)) {
    return centeredLoader('Redirecting...');
  }

  return <>{children}</>;
}
