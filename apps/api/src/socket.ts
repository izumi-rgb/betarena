import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from './config/logger';
import { env } from './config/env';
import redis from './config/redis';

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN
        .split(',')
        .map((origin) => origin.split('#')[0].trim())
        .filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: number; role: string };
      socket.data.user = decoded;
      socket.data.role = decoded.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug('Socket connected', { socketId: socket.id, userId: socket.data.user?.id, role: socket.data.role });
    socket.data.watchedEvents = new Set<string>();
    if (socket.data.user?.id) {
      socket.join(`user:${socket.data.user.id}`);
    }

    socket.on('join:event', async (eventId: string) => {
      if (socket.data.watchedEvents.has(eventId)) {
        return;
      }
      socket.join(`event:${eventId}`);
      socket.data.watchedEvents.add(eventId);
      await redis.incr(`watchers:${eventId}`);
      logger.debug('Socket joined event room', { socketId: socket.id, eventId });
    });

    socket.on('leave:event', async (eventId: string) => {
      if (!socket.data.watchedEvents.has(eventId)) {
        return;
      }
      socket.data.watchedEvents.delete(eventId);
      socket.leave(`event:${eventId}`);
      const count = await redis.decr(`watchers:${eventId}`);
      if (count < 0) {
        await redis.set(`watchers:${eventId}`, '0');
      }
    });

    socket.on('disconnect', async () => {
      const watchedEvents: Set<string> = socket.data.watchedEvents || new Set<string>();
      for (const eventId of watchedEvents) {
        const count = await redis.decr(`watchers:${eventId}`);
        if (count < 0) {
          await redis.set(`watchers:${eventId}`, '0');
        }
      }
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
