'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useBalance } from '@/hooks/useBalance';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/lib/format';
import { apiPost } from '@/lib/api';

interface PlaceBetPayload {
  type: string;
  stake: number;
  selections: unknown[];
}

interface CreditsContextValue {
  balance: number;
  isLoading: boolean;
  isAuthenticated: boolean;
  formatBalance: (value?: number) => string;
  refetchBalance: () => void;
  // Variant-export backward compat
  fetchTransactions: () => void;
  placeBet: (payload: PlaceBetPayload) => Promise<{ success: boolean; message?: string }>;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function useCredits(): CreditsContextValue {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    return {
      balance: 0,
      isLoading: false,
      isAuthenticated: false,
      formatBalance: (v) => formatCurrency(v ?? 0),
      refetchBalance: () => {},
      fetchTransactions: () => {},
      placeBet: async () => ({ success: false, message: 'Not authenticated' }),
    };
  }
  return ctx;
}

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { balance, isLoading, refetch } = useBalance();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const formatBalance = useCallback(
    (value?: number) => formatCurrency(value ?? (balance ?? 0)),
    [balance],
  );

  const placeBet = useCallback(
    async (payload: PlaceBetPayload): Promise<{ success: boolean; message?: string }> => {
      try {
        const res = await apiPost('/api/bets', payload);
        if (res.success) {
          refetch();
          return { success: true, message: 'Bet placed successfully' };
        }
        return { success: false, message: res.message || 'Bet placement failed' };
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const msg =
          axiosErr?.response?.data?.message ||
          (err instanceof Error ? err.message : 'Something went wrong');
        return { success: false, message: msg };
      }
    },
    [refetch],
  );

  return (
    <CreditsContext.Provider
      value={{
        balance: balance ?? 0,
        isLoading,
        isAuthenticated,
        formatBalance,
        refetchBalance: refetch,
        fetchTransactions: () => {},
        placeBet,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}
