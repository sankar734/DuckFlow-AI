import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { env } from './env';

export let io: Server;

export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow connections from frontend and mobile
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join document room
    socket.on('document:join', ({ documentId, user }) => {
      socket.join(`doc:${documentId}`);
      socket.to(`doc:${documentId}`).emit('document:user_joined', {
        socketId: socket.id,
        user,
      });
      logger.info(`User ${user?.name || socket.id} joined room doc:${documentId}`);
    });

    // Leave document room
    socket.on('document:leave', ({ documentId, user }) => {
      socket.leave(`doc:${documentId}`);
      socket.to(`doc:${documentId}`).emit('document:user_left', {
        socketId: socket.id,
        user,
      });
    });

    // Live document changes
    socket.on('document:update', ({ documentId, delta, version }) => {
      socket.to(`doc:${documentId}`).emit('document:remote_update', {
        delta,
        version,
        senderId: socket.id,
      });
    });

    // Cursor position broadcast
    socket.on('document:cursor', ({ documentId, cursor, user }) => {
      socket.to(`doc:${documentId}`).emit('document:remote_cursor', {
        cursor,
        user,
        socketId: socket.id,
      });
    });

    // User typing indicator
    socket.on('user:typing', ({ documentId, user, isTyping }) => {
      socket.to(`doc:${documentId}`).emit('user:typing_status', {
        user,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
