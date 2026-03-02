import { getIO } from '../socket';
import logger from '../config/logger';

export function emitToUser(userId: number, event: string, payload: Record<string, unknown> = {}): void {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, { userId, ...payload });
  } catch (error) {
    logger.debug('Socket emit skipped', {
      userId,
      event,
      error: (error as Error).message,
    });
  }
}
