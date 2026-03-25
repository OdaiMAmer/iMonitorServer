import { prisma } from '../../prisma/prisma.service';
import { AppError } from '../../common/utils/app-error';
import { getCache, setCache } from '../../common/utils/redis';
import { logger } from '../../common/utils/logger';

interface OverviewStats {
  totalServers: number;
  online: number;
  degraded: number;
  offline: number;
  maintenance: number;
  activeAlerts: number;
  averageUptimeSeconds: number | null;
}

interface GroupSummary {
  groupId: string;
  groupName: string;
  totalServers: number;
  online: number;
  degraded: number;
  offline: number;
  maintenance: number;
  activeAlerts: number;
}

class DashboardService {
  async getOverview(): Promise<OverviewStats> {
    const cacheKey = 'dashboard:overview';
    const cached = await getCache(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const [totalServers, statusCounts, activeAlerts] = await Promise.all([
      prisma.server.count(),
      prisma.server.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.alert.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const entry of statusCounts) {
      statusMap[entry.status] = entry._count.id;
    }

    const onlineServerIds = await prisma.server.findMany({
      where: { status: 'ONLINE' },
      select: { id: true },
    });

    let averageUptimeSeconds: number | null = null;

    if (onlineServerIds.length > 0) {
      const latestCpuMetrics = await prisma.metric.findMany({
        where: {
          serverId: { in: onlineServerIds.map((s) => s.id) },
          type: 'CPU',
        },
        orderBy: { timestamp: 'desc' },
        distinct: ['serverId'],
        select: { serverId: true, metadata: true },
      });

      const uptimes: number[] = [];
      for (const metric of latestCpuMetrics) {
        const meta = metric.metadata as Record<string, unknown> | null;
        if (meta && typeof meta.uptime === 'number') {
          uptimes.push(meta.uptime);
        }
      }

      if (uptimes.length > 0) {
        averageUptimeSeconds = uptimes.reduce((sum, u) => sum + u, 0) / uptimes.length;
      }
    }

    const overview: OverviewStats = {
      totalServers,
      online: statusMap['ONLINE'] ?? 0,
      degraded: statusMap['DEGRADED'] ?? 0,
      offline: statusMap['OFFLINE'] ?? 0,
      maintenance: statusMap['MAINTENANCE'] ?? 0,
      activeAlerts,
      averageUptimeSeconds,
    };

    await setCache(cacheKey, JSON.stringify(overview), 30);

    logger.debug('Dashboard overview computed', { totalServers, activeAlerts });

    return overview;
  }

  async getGroupSummary(groupId: string): Promise<GroupSummary> {
    const cacheKey = `dashboard:group:${groupId}:summary`;
    const cached = await getCache(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const group = await prisma.serverGroup.findUnique({
      where: { id: groupId },
      select: { id: true, name: true },
    });

    if (!group) {
      throw AppError.notFound('Server group');
    }

    const assignments = await prisma.serverGroupAssignment.findMany({
      where: { serverGroupId: groupId },
      select: { serverId: true },
    });

    const serverIds = assignments.map((a) => a.serverId);

    if (serverIds.length === 0) {
      const summary: GroupSummary = {
        groupId: group.id,
        groupName: group.name,
        totalServers: 0,
        online: 0,
        degraded: 0,
        offline: 0,
        maintenance: 0,
        activeAlerts: 0,
      };

      await setCache(cacheKey, JSON.stringify(summary), 30);
      return summary;
    }

    const [statusCounts, activeAlerts] = await Promise.all([
      prisma.server.groupBy({
        by: ['status'],
        where: { id: { in: serverIds } },
        _count: { id: true },
      }),
      prisma.alert.count({
        where: {
          serverId: { in: serverIds },
          status: 'ACTIVE',
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const entry of statusCounts) {
      statusMap[entry.status] = entry._count.id;
    }

    const summary: GroupSummary = {
      groupId: group.id,
      groupName: group.name,
      totalServers: serverIds.length,
      online: statusMap['ONLINE'] ?? 0,
      degraded: statusMap['DEGRADED'] ?? 0,
      offline: statusMap['OFFLINE'] ?? 0,
      maintenance: statusMap['MAINTENANCE'] ?? 0,
      activeAlerts,
    };

    await setCache(cacheKey, JSON.stringify(summary), 30);

    return summary;
  }
}

export const dashboardService = new DashboardService();
