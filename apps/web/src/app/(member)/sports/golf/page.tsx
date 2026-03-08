'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';

export default function GolfLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAndNavigate = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const uncachedEventsUrl = `/api/sports/golf/events?ts=${Date.now()}`;
      const res = await apiGet<Array<{ id: number | string }>>(uncachedEventsUrl, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      const first = res.data?.[0];
      if (first) {
        router.replace(`/sports/golf/${first.id}`);
        return;
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAndNavigate();
  }, [fetchAndNavigate]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0B0E1A] text-[#94A3B8] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00C37B] border-t-transparent" />
        <div className="text-[14px]">Loading golf events…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0B0E1A] text-[#94A3B8] gap-4">
        <div className="text-[32px]">⚠️</div>
        <div className="text-[14px]">Unable to load golf events.</div>
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
      <div className="text-[32px]">⛳</div>
      <div className="text-[14px]">No golf events right now</div>
    </div>
  );
}
