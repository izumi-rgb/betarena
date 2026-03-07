'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';

export default function EsportsLandingPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const resolveFirstEvent = async () => {
      try {
        const uncachedEventsUrl = `/api/sports/esports/events?ts=${Date.now()}`;
        const res = await apiGet<Array<{ id: number | string }>>(uncachedEventsUrl, {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        const first = res.data?.[0];
        if (!cancelled && first) {
          router.replace(`/sports/esports/${first.id}`);
          return;
        }
      } catch {
        // No esports events available.
      }

      // No live esports events — show empty state (do not redirect to demo)
    };

    resolveFirstEvent();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0B0E1A] text-[#94A3B8] gap-3">
      <div className="text-[32px]">🎮</div>
      <div className="text-[14px]">No live esports events right now</div>
    </div>
  );
}
