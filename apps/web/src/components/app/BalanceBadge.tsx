'use client';

import { useBalance } from '@/hooks/useBalance';

function formatCurrency(value: number): string {
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CR`;
}

export function BalanceBadge({
  className = 'rounded-full border border-[#1E293B] bg-[#0B0E1A] px-3 py-1.5 font-mono text-[13px] font-bold text-[#00C37B]',
}: {
  className?: string;
}) {
  const { balance, isLoading } = useBalance();

  if (balance === null) {
    return null;
  }

  if (isLoading) {
    return <div className={className}>0.00 CR</div>;
  }

  return <div className={className}>{formatCurrency(balance)}</div>;
}
