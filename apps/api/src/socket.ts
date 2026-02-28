import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import logger from './config/logger';
import { env } from './config/env';

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.debug('Socket connected', { socketId: socket.id });

    socket.on('join:event', (eventId: string) => {
      socket.join(`event:${eventId}`);
      logger.debug('Socket joined event room', { socketId: socket.id, eventId });
    });

    socket.on('leave:event', (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { socketId: socket.id });
    });
  });

  logger.info('Socket.io server initialized');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
