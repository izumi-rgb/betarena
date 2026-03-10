'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';

type BalanceResponse = {
  balance: number | string;
};

export const BALANCE_QUERY_KEY = ['credits', 'balance'] as const;

async function fetchBalance(): Promise<number> {
  const response = await apiGet<BalanceResponse>('/api/credits/balance');
  const rawBalance = response?.data?.balance ?? 0;
  const parsed = typeof rawBalance === 'number' ? rawBalance : Number.parseFloat(rawBalance);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function useBalance(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const enabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: BALANCE_QUERY_KEY,
    queryFn: fetchBalance,
    enabled: enabled && isAuthenticated && !isHydrating,
    staleTime: 10_000,
  });

  const queryRefetch = query.refetch;
  const refetch = useCallback(async () => {
    return queryRefetch();
  }, [queryRefetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const socket = getSocket();
    const onBalanceUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: BALANCE_QUERY_KEY });
    };

    socket.on('balance:updated', onBalanceUpdated);
    return () => {
      socket.off('balance:updated', onBalanceUpdated);
    };
  }, [isAuthenticated, queryClient]);

  return {
    balance: isAuthenticated ? (query.data ?? 0) : null,
    isLoading: query.isLoading,
    error: query.error,
    refetch,
  };
}
