'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';

export default function TennisLandingPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const resolveFirstEvent = async () => {
      try {
        const uncachedEventsUrl = `/api/sports/tennis/events?ts=${Date.now()}`;
        const res = await apiGet<Array<{ id: number | string }>>(uncachedEventsUrl, {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        const first = res.data?.[0];
        if (!cancelled && first) {
          router.replace(`/sports/tennis/${first.id}`);
          return;
        }
      } catch {
        // Fall through to sports lobby if tennis list lookup fails.
      }

      if (!cancelled) {
        router.replace('/sports');
      }
    };

    resolveFirstEvent();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#0B0E1A] text-[#94A3B8]">
      Loading tennis events...
    </div>
  );
}
