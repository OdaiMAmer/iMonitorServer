import { PrismaClient } from '@prisma/client';
import { logger } from '../common/utils/logger';

class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    logger.info('Database connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    logger.info('Database disconnected');
  }
}

export const prisma = new PrismaService();
