'use client';

import { useBalance } from '@/hooks/useBalance';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';

export function BalanceBadge({
  className = 'rounded-full border border-[#1E293B] bg-[#0B0E1A] px-3 py-1.5 font-mono text-[13px] font-bold text-[#00C37B]',
}: {
  className?: string;
}) {
  const { balance, isLoading } = useBalance();

  if (isLoading || balance === null) {
    return (
      <div className={className}>
        <Skeleton className="h-4 w-16 rounded bg-[#1E293B]" />
      </div>
    );
  }

  return <div className={className}>{formatCurrency(balance)}</div>;
}
