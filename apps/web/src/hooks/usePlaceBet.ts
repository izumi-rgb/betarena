'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';
import { apiPost } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { extractApiError, getErrorMessage } from '@/lib/errors';

export function usePlaceBet() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const picks = useBetSlipStore((s) => s.picks);
  const clearPicks = useBetSlipStore((s) => s.clearPicks);
  const stake = useBetSlipStore((s) => s.stake);
  const closeMobile = useBetSlipStore((s) => s.closeMobile);
  const { balance, refetch: refetchBalance } = useBalance();
  const [isPlacing, setIsPlacing] = useState(false);

  const placeBet = useCallback(async () => {
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname || '/sports');
      router.push(`/login?next=${next}`);
      return;
    }
    if (picks.length === 0 || isPlacing) return;

    const stakeNum = Number(stake);
    if (!stakeNum || stakeNum <= 0) {
      toast({ title: 'Invalid stake', description: 'Please enter a valid stake amount.', variant: 'destructive' });
      return;
    }

    setIsPlacing(true);
    try {
      const betType = picks.length === 1 ? 'single' : 'accumulator';
      const selections = picks.map((p) => ({
        event_id: p.eventId,
        market_type: p.marketType,
        selection_name: p.selection,
        odds: p.odds,
      }));

      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : undefined;

      await apiPost('/api/bets', {
        type: betType,
        stake: stakeNum,
        selections,
        idempotency_key: idempotencyKey,
      });
      await refetchBalance();
      toast({ title: 'Bet Placed!', description: `Your ${betType} bet of ${stakeNum.toFixed(2)} has been placed.` });
      clearPicks();
      closeMobile();
      router.push('/my-bets');
    } catch (err: unknown) {
      const msg = extractApiError(err);
      toast({ title: 'Bet Failed', description: getErrorMessage(msg), variant: 'destructive' });
    } finally {
      setIsPlacing(false);
    }
  }, [isAuthenticated, picks, isPlacing, stake, pathname, router, refetchBalance, clearPicks, closeMobile]);

  return { placeBet, isPlacing, balance };
}
