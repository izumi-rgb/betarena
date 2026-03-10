'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthBootstrap() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    void hydrateSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
