import { useEffect, useRef } from 'react';
import { getSocket, joinEventRoom, leaveEventRoom } from '@/lib/socket';

interface EventSocketHandlers {
  onEventUpdate?: (data: Record<string, unknown>) => void;
  onOddsUpdate?: (data: Record<string, unknown>) => void;
}

export function useEventSocket(
  eventId: string,
  handlers: EventSocketHandlers
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!eventId) return;

    const socket = getSocket();
    joinEventRoom(eventId);

    const onEvent = (data: Record<string, unknown>) => handlersRef.current.onEventUpdate?.(data);
    const onOdds = (data: Record<string, unknown>) => handlersRef.current.onOddsUpdate?.(data);

    socket.on('event:update', onEvent);
    socket.on('odds:update', onOdds);

    return () => {
      leaveEventRoom(eventId);
      socket.off('event:update', onEvent);
      socket.off('odds:update', onOdds);
    };
  }, [eventId]);
}
