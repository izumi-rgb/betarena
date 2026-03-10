'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useBalance } from '@/hooks/useBalance';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/lib/format';

interface CreditsContextValue {
  balance: number;
  isLoading: boolean;
  isAuthenticated: boolean;
  formatBalance: (value?: number) => string;
  refetchBalance: () => void;
  // Variant-export backward compat
  fetchTransactions: () => void;
  placeBet: (amount: number, selections: unknown[]) => Promise<unknown>;
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
      placeBet: async () => ({}),
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

  return (
    <CreditsContext.Provider
      value={{
        balance: balance ?? 0,
        isLoading,
        isAuthenticated,
        formatBalance,
        refetchBalance: refetch,
        fetchTransactions: () => {},
        placeBet: async () => ({}),
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}
