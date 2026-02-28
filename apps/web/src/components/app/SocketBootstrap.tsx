'use client';

import { useEffect } from 'react';
import { connectSocket } from '@/lib/socket';

export function SocketBootstrap() {
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;
    connectSocket(token);
  }, []);

  return null;
}
