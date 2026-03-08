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
  id: number | string;
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

export type LiveFeed = {
  live: LiveEvent[];
  upcoming: LiveEvent[];
};

async function fetchLiveFeed(): Promise<LiveFeed> {
  const response = await apiGet<LiveEvent[] | { live: LiveEvent[]; upcoming: LiveEvent[] }>('/api/sports/live');
  if (Array.isArray(response.data)) {
    return { live: response.data, upcoming: [] };
  }

  return {
    live: response.data?.live || [],
    upcoming: response.data?.upcoming || [],
  };
}

export function useLiveFeed() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['events', 'live-feed'],
    queryFn: fetchLiveFeed,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    const socket = getSocket();

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['events', 'live-feed'] });
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

export function useLiveEvents() {
  const query = useLiveFeed();

  return {
    ...query,
    data: query.data?.live || [],
  };
}
