import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';
import { logger } from '../common/utils/logger';
import { JwtPayload } from '../common/types';

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function initializeSocketGateway(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token as string, config.jwt.secret) as JwtPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    logger.info(`WebSocket connected: ${user.email} (${socket.id})`);

    // Join user-specific room for notifications
    socket.join(`user:${user.sub}`);

    // Subscribe to a specific server's real-time feed
    socket.on('subscribe:server', ({ serverId }: { serverId: string }) => {
      if (!serverId) return;
      socket.join(`server:${serverId}`);
      logger.debug(`${user.email} subscribed to server:${serverId}`);
    });

    // Unsubscribe from a server's feed
    socket.on('unsubscribe:server', ({ serverId }: { serverId: string }) => {
      if (!serverId) return;
      socket.leave(`server:${serverId}`);
      logger.debug(`${user.email} unsubscribed from server:${serverId}`);
    });

    // Subscribe to dashboard updates
    socket.on('subscribe:dashboard', () => {
      socket.join('dashboard');
      logger.debug(`${user.email} subscribed to dashboard`);
    });

    // Unsubscribe from dashboard
    socket.on('unsubscribe:dashboard', () => {
      socket.leave('dashboard');
    });

    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket disconnected: ${user.email} (${reason})`);
    });

    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${user.email}:`, error);
    });
  });

  logger.info('Socket.IO gateway initialized');
  return io;
}
