import { MetricType, Prisma } from '@prisma/client';
import { prisma } from '../../prisma/prisma.service';
import { AppError } from '../../common/utils/app-error';
import { getCache, setCache, deleteCache } from '../../common/utils/redis';
import { logger } from '../../common/utils/logger';
import type { MetricsQuery, CompareQuery } from './metrics.validation';

function emitSocketEvent(event: string, room: string, data: unknown): void {
  try {
    const { getIO } = require('../../gateway/socket.gateway');
    const io = getIO();
    if (io) {
      io.to(room).emit(event, data);
    }
  } catch {
    logger.debug('Socket.IO gateway not initialized yet, skipping real-time emit');
  }
}

interface BulkMetricItem {
  type: MetricType;
  value: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

class MetricsService {
  async getServerMetrics(
    serverId: string,
    query: MetricsQuery | Record<string, string>,
  ): Promise<unknown[]> {
    const server = await prisma.server.findUnique({ where: { id: serverId } });

    if (!server) {
      throw AppError.notFound('Server');
    }

    const { type, from, to, interval } = query as MetricsQuery;

    if (interval) {
      return this.getAggregatedMetrics(serverId, type, from, to, interval);
    }

    const where: Prisma.MetricWhereInput = { serverId };

    if (type) {
      where.type = type;
    }

    if (from || to) {
      where.timestamp = {};
      if (from) {
        where.timestamp.gte = new Date(from);
      }
      if (to) {
        where.timestamp.lte = new Date(to);
      }
    }

    const metrics = await prisma.metric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    return metrics;
  }

  private async getAggregatedMetrics(
    serverId: string,
    type?: MetricType,
    from?: string,
    to?: string,
    interval?: string,
  ): Promise<unknown[]> {
    const where: Prisma.MetricAggregateWhereInput = {
      serverId,
      interval,
    };

    if (type) {
      where.type = type;
    }

    if (from || to) {
      where.periodStart = {};
      if (from) {
        where.periodStart.gte = new Date(from);
      }
      if (to) {
        where.periodStart.lte = new Date(to);
      }
    }

    const aggregates = await prisma.metricAggregate.findMany({
      where,
      orderBy: { periodStart: 'desc' },
      take: 1000,
    });

    return aggregates;
  }

  async getLatestMetrics(serverId: string): Promise<unknown> {
    const server = await prisma.server.findUnique({ where: { id: serverId } });

    if (!server) {
      throw AppError.notFound('Server');
    }

    const cacheKey = `server:${serverId}:latest-metrics`;
    const cached = await getCache(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const metricTypes: MetricType[] = ['CPU', 'MEMORY', 'DISK', 'NETWORK_IN', 'NETWORK_OUT'];

    const latestMetrics: Record<string, unknown> = {};

    const metricPromises = metricTypes.map(async (metricType) => {
      const metric = await prisma.metric.findFirst({
        where: { serverId, type: metricType },
        orderBy: { timestamp: 'desc' },
      });

      if (metric) {
        latestMetrics[metricType] = {
          value: metric.value,
          metadata: metric.metadata,
          timestamp: metric.timestamp,
        };
      }
    });

    await Promise.all(metricPromises);

    await setCache(cacheKey, JSON.stringify(latestMetrics), 60);

    return latestMetrics;
  }

  async bulkIngest(
    serverId: string,
    metrics: BulkMetricItem[],
  ): Promise<{ count: number }> {
    const server = await prisma.server.findUnique({ where: { id: serverId } });

    if (!server) {
      throw AppError.notFound('Server');
    }

    const metricsData: Prisma.MetricCreateManyInput[] = metrics.map((m) => ({
      serverId,
      type: m.type,
      value: m.value,
      metadata: (m.metadata as any) ?? Prisma.JsonNull,
      timestamp: new Date(m.timestamp),
    }));

    const result = await prisma.metric.createMany({ data: metricsData });

    await deleteCache(`server:${serverId}:latest-metrics`);

    const latestByType: Record<string, BulkMetricItem> = {};
    for (const metric of metrics) {
      const existing = latestByType[metric.type];
      if (!existing || new Date(metric.timestamp) > new Date(existing.timestamp)) {
        latestByType[metric.type] = metric;
      }
    }

    emitSocketEvent('metrics:bulk', `server:${serverId}`, {
      serverId,
      metrics: latestByType,
    });

    emitSocketEvent('metrics:bulk', 'dashboard', {
      serverId,
      metrics: latestByType,
    });

    logger.debug('Bulk metrics ingested', { serverId, count: result.count });

    return { count: result.count };
  }

  async aggregateMetrics(): Promise<number> {
    const intervals = [
      { name: '1m', seconds: 60 },
      { name: '5m', seconds: 300 },
      { name: '15m', seconds: 900 },
      { name: '1h', seconds: 3600 },
      { name: '6h', seconds: 21600 },
      { name: '1d', seconds: 86400 },
    ];

    let totalAggregated = 0;

    for (const interval of intervals) {
      try {
        const count = await this.aggregateForInterval(interval.name, interval.seconds);
        totalAggregated += count;
      } catch (error) {
        logger.error(`Error aggregating metrics for interval ${interval.name}: ${(error as Error).message}`);
      }
    }

    if (totalAggregated > 0) {
      logger.info(`Metric aggregation complete: ${totalAggregated} aggregates created/updated`);
    }

    return totalAggregated;
  }

  private async aggregateForInterval(intervalName: string, intervalSeconds: number): Promise<number> {
    const now = new Date();
    const periodDuration = intervalSeconds * 1000;

    const lastAggregate = await prisma.metricAggregate.findFirst({
      where: { interval: intervalName },
      orderBy: { periodEnd: 'desc' },
      select: { periodEnd: true },
    });

    const startFrom = lastAggregate?.periodEnd
      ? new Date(lastAggregate.periodEnd.getTime())
      : new Date(now.getTime() - periodDuration * 10);

    const currentPeriodStart = new Date(
      Math.floor(startFrom.getTime() / periodDuration) * periodDuration,
    );

    let count = 0;
    let periodStart = new Date(currentPeriodStart.getTime());

    while (periodStart.getTime() + periodDuration <= now.getTime()) {
      const periodEnd = new Date(periodStart.getTime() + periodDuration);

      const metrics = await prisma.metric.groupBy({
        by: ['serverId', 'type'],
        where: {
          timestamp: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        _min: { value: true },
        _max: { value: true },
        _avg: { value: true },
        _count: { value: true },
      });

      for (const metric of metrics) {
        if (metric._avg.value === null) continue;

        const values = await prisma.metric.findMany({
          where: {
            serverId: metric.serverId,
            type: metric.type,
            timestamp: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
          select: { value: true },
          orderBy: { value: 'asc' },
        });

        let p95: number | null = null;
        if (values.length > 0) {
          const p95Index = Math.ceil(values.length * 0.95) - 1;
          p95 = values[p95Index].value;
        }

        await prisma.metricAggregate.upsert({
          where: {
            serverId_type_interval_periodStart: {
              serverId: metric.serverId,
              type: metric.type,
              interval: intervalName,
              periodStart,
            },
          },
          create: {
            serverId: metric.serverId,
            type: metric.type,
            interval: intervalName,
            min: metric._min.value ?? 0,
            max: metric._max.value ?? 0,
            avg: metric._avg.value ?? 0,
            p95,
            sampleCount: metric._count.value,
            periodStart,
            periodEnd,
          },
          update: {
            min: metric._min.value ?? 0,
            max: metric._max.value ?? 0,
            avg: metric._avg.value ?? 0,
            p95,
            sampleCount: metric._count.value,
            periodEnd,
          },
        });

        count++;
      }

      periodStart = new Date(periodStart.getTime() + periodDuration);
    }

    return count;
  }

  async compareMetrics(query: CompareQuery): Promise<Record<string, unknown[]>> {
    const serverIds = query.serverIds.split(',').map((id) => id.trim());

    for (const id of serverIds) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw AppError.badRequest(`Invalid server ID format: ${id}`);
      }
    }

    const where: Prisma.MetricWhereInput = {
      serverId: { in: serverIds },
      type: query.type,
    };

    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) {
        where.timestamp.gte = new Date(query.from);
      }
      if (query.to) {
        where.timestamp.lte = new Date(query.to);
      }
    }

    const metrics = await prisma.metric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 5000,
    });

    const grouped: Record<string, unknown[]> = {};

    for (const id of serverIds) {
      grouped[id] = [];
    }

    for (const metric of metrics) {
      if (!grouped[metric.serverId]) {
        grouped[metric.serverId] = [];
      }
      grouped[metric.serverId].push(metric);
    }

    return grouped;
  }
}

export const metricsService = new MetricsService();
