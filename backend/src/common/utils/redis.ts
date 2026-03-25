import Redis from 'ioredis';
import { config } from '../../config/env.config';
import { logger } from './logger';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  maxRetriesPerRequest: 3,
  retryStrategy(times: number): number | null {
    if (times > 10) {
      logger.error('Redis: max retry attempts reached, giving up');
      return null;
    }
    const delay = Math.min(times * 200, 5000);
    logger.warn(`Redis: retrying connection in ${delay}ms (attempt ${times})`);
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('Redis: connected successfully');
});

redis.on('error', (error: Error) => {
  logger.error('Redis: connection error', { error: error.message });
});

redis.on('close', () => {
  logger.warn('Redis: connection closed');
});

export async function getCache(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function setCache(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (ttlSeconds !== undefined && ttlSeconds > 0) {
    await redis.set(key, value, 'EX', ttlSeconds);
    return;
  }
  await redis.set(key, value);
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  let cursor = '0';

  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== '0');
}
