'use client';

import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';

export function SocketBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      return;
    }

    connectSocket(accessToken);
  }, [accessToken, isAuthenticated, isHydrating]);

  return null;
}
