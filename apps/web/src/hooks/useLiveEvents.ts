'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export type LiveSelection = {
  id: string;
  name: string;
  odds: number;
};

export type LiveMarket = {
  id: string;
  name: string;
  type: string;
  selections: LiveSelection[];
};

export type LiveEvent = {
  id: number;
  sport?: string;
  league?: string;
  status?: string;
  startTime?: string;
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
  homeScore?: number;
  awayScore?: number;
  markets?: LiveMarket[];
};

async function fetchLiveEvents(): Promise<LiveEvent[]> {
  const response = await apiGet<LiveEvent[]>('/api/sports/live');
  return response.data || [];
}

export function useLiveEvents() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['events', 'live'],
    queryFn: fetchLiveEvents,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    const socket = getSocket();

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['events', 'live'] });
    };

    socket.on('live:update', refresh);
    socket.on('event:update', refresh);
    socket.on('odds:update', refresh);

    return () => {
      socket.off('live:update', refresh);
      socket.off('event:update', refresh);
      socket.off('odds:update', refresh);
    };
  }, [queryClient]);

  return query;
}
