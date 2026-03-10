'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { getSportIcon } from '@/lib/sportRoutes';

interface SportLandingPageProps {
  /** Sport key used in API path, e.g. "tennis", "golf" */
  sport: string;
  /** Human-readable name shown in UI, e.g. "Tennis", "Golf" */
  displayName: string;
}

/**
 * Shared landing page for sport listing routes.
 *
 * Fetches `/api/sports/{sport}/events` and redirects to the first event.
 * Shows loading spinner, error state with retry, and empty state.
 */
export function SportLandingPage({ sport, displayName }: SportLandingPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAndNavigate = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const url = `/api/sports/${sport}/events?ts=${Date.now()}`;
      const res = await apiGet<Array<{ id: number | string }>>(url, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      const first = res.data?.[0];
      if (first) {
        router.replace(`/sports/${sport}/${first.id}`);
        return;
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [router, sport]);

  useEffect(() => {
    fetchAndNavigate();
  }, [fetchAndNavigate]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0B0E1A] text-[#94A3B8] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00C37B] border-t-transparent" />
        <div className="text-[14px]">Loading {displayName.toLowerCase()} events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0B0E1A] text-[#94A3B8] gap-4">
        <div className="text-[32px]">&#x26A0;&#xFE0F;</div>
        <div className="text-[14px]">Unable to load {displayName.toLowerCase()} events.</div>
        <button
          onClick={fetchAndNavigate}
          className="rounded-lg border border-[#00C37B] bg-[#00C37B]/10 px-4 py-2 text-sm font-semibold text-[#00C37B] hover:bg-[#00C37B]/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0B0E1A] text-[#94A3B8] gap-3">
      <div className="text-[32px]">{getSportIcon(sport)}</div>
      <div className="text-[14px]">No {displayName.toLowerCase()} events right now</div>
    </div>
  );
}
