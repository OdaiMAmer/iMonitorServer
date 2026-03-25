import 'dotenv/config';
import http from 'http';
import app from './app';
import { config } from './config/env.config';
import { prisma } from './prisma/prisma.service';
import { redis } from './common/utils/redis';
import { logger } from './common/utils/logger';
import { startBackgroundJobs, stopBackgroundJobs } from './gateway/background-jobs';

const httpServer = http.createServer(app);

async function initializeSocketGateway(): Promise<void> {
  try {
    const { initializeSocketGateway } = await import('./gateway/socket.gateway');
    initializeSocketGateway(httpServer);
  } catch (error) {
    logger.warn('Socket.IO gateway initialization failed', {
      error: (error as Error).message,
    });
  }
}

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    await redis.connect();

    await initializeSocketGateway();

    startBackgroundJobs();

    httpServer.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`API available at http://localhost:${config.port}${config.apiPrefix}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, starting graceful shutdown...`);

  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database', { error: (error as Error).message });
  }

  stopBackgroundJobs();

  try {
    await redis.quit();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Error disconnecting Redis', { error: (error as Error).message });
  }

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

startServer();
