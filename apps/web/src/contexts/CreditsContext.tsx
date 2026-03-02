'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useBalance } from '@/hooks/useBalance';
import { apiPost, apiGet, type ApiResponse } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface BetSelection {
  event_id: number | string;
  market_type: string;
  selection_name: string;
  odds: number;
}

interface PlaceBetParams {
  type: 'single' | 'accumulator';
  stake: number;
  selections: BetSelection[];
}

interface Transaction {
  id: number;
  amount: string;
  type: string;
  note: string | null;
  created_at: string;
}

interface CreditsContextValue {
  balance: number;
  isLoading: boolean;
  isAuthenticated: boolean;
  formatBalance: (value?: number) => string;
  placeBet: (params: PlaceBetParams) => Promise<{ success: boolean; message: string; data?: unknown }>;
  fetchTransactions: (page?: number, limit?: number) => Promise<{ transactions: Transaction[]; total: number }>;
  refetchBalance: () => void;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function useCredits(): CreditsContextValue {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    return {
      balance: 0,
      isLoading: false,
      isAuthenticated: false,
      formatBalance: (v) => {
        const num = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);
        return `${num} CR`;
      },
      placeBet: async () => ({ success: false, message: 'Not connected' }),
      fetchTransactions: async () => ({ transactions: [], total: 0 }),
      refetchBalance: () => {},
    };
  }
  return ctx;
}

function formatCurrency(value: number): string {
  const num = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${num} CR`;
}

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { balance, isLoading, refetch } = useBalance();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const formatBalance = useCallback(
    (value?: number) => formatCurrency(value ?? balance),
    [balance],
  );

  const placeBet = useCallback(
    async (params: PlaceBetParams) => {
      try {
        const res = await apiPost<unknown>('/api/bets', {
          type: params.type,
          stake: params.stake,
          selections: params.selections,
        });
        void refetch();
        return { success: true, message: res.message || 'Bet placed!', data: res.data };
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || 'Failed to place bet';
        return { success: false, message: msg };
      }
    },
    [refetch],
  );

  const fetchTransactions = useCallback(
    async (page = 1, limit = 20) => {
      try {
        const res = await apiGet<{ transactions: Transaction[]; total: number }>(
          `/api/credits/transactions?page=${page}&limit=${limit}`,
        );
        return res.data;
      } catch {
        return { transactions: [], total: 0 };
      }
    },
    [],
  );

  return (
    <CreditsContext.Provider
      value={{
        balance,
        isLoading,
        isAuthenticated,
        formatBalance,
        placeBet,
        fetchTransactions,
        refetchBalance: refetch,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}
