import { createHash, randomUUID } from 'crypto';
import { Prisma, ServerStatus } from '@prisma/client';
import { prisma } from '../../prisma/prisma.service';
import { AppError } from '../../common/utils/app-error';
import { getCache, setCache, deleteCache, deleteCachePattern } from '../../common/utils/redis';
import { logger } from '../../common/utils/logger';
import { config } from '../../config/env.config';
import type { RegisterServerDto, UpdateServerDto, HeartbeatDto, ListServersQuery } from './servers.validation';

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

class ServersService {
  async register(data: RegisterServerDto): Promise<{ server: { id: string; hostname: string; status: ServerStatus }; apiKey: string }> {
    if (!data.registrationToken || data.registrationToken.trim().length === 0) {
      throw AppError.badRequest('Registration token is required');
    }

    const existingServer = await prisma.server.findUnique({
      where: { hostname: data.hostname },
    });

    if (existingServer) {
      throw AppError.conflict(`Server with hostname '${data.hostname}' already exists`);
    }

    const apiKey = randomUUID();
    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');

    const server = await prisma.server.create({
      data: {
        hostname: data.hostname,
        ipAddress: data.ipAddress,
        osVersion: data.osVersion,
        agentVersion: data.agentVersion,
        cpuModel: data.cpuModel,
        cpuCores: data.cpuCores,
        totalMemoryMb: data.totalMemoryMb,
        totalDiskGb: data.totalDiskGb,
        apiKeyHash,
        status: 'OFFLINE',
      },
      select: {
        id: true,
        hostname: true,
        status: true,
      },
    });

    await deleteCachePattern('servers:list:*');

    logger.info('Server registered', { serverId: server.id, hostname: server.hostname });

    return { server, apiKey };
  }

  async findAll(query: ListServersQuery): Promise<{ servers: unknown[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 20, status, groupId, search } = query;

    const cacheKey = `servers:list:${page}:${pageSize}:${status || ''}:${groupId || ''}:${search || ''}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const where: Prisma.ServerWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (groupId) {
      where.groups = {
        some: { serverGroupId: groupId },
      };
    }

    if (search) {
      where.OR = [
        { hostname: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [servers, total] = await Promise.all([
      prisma.server.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { hostname: 'asc' },
        include: {
          groups: {
            include: {
              serverGroup: {
                select: { id: true, name: true, color: true },
              },
            },
          },
        },
      }),
      prisma.server.count({ where }),
    ]);

    const result = { servers, total, page, pageSize };

    await setCache(cacheKey, JSON.stringify(result), 30);

    return result;
  }

  async findById(id: string): Promise<unknown> {
    const cacheKey = `servers:detail:${id}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            serverGroup: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!server) {
      throw AppError.notFound('Server');
    }

    await setCache(cacheKey, JSON.stringify(server), 30);

    return server;
  }

  async update(id: string, data: UpdateServerDto): Promise<unknown> {
    const existing = await prisma.server.findUnique({ where: { id } });

    if (!existing) {
      throw AppError.notFound('Server');
    }

    const server = await prisma.server.update({
      where: { id },
      data,
      include: {
        groups: {
          include: {
            serverGroup: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    await deleteCache(`servers:detail:${id}`);
    await deleteCachePattern('servers:list:*');

    logger.info('Server updated', { serverId: id, changes: data });

    return server;
  }

  async remove(id: string): Promise<void> {
    const existing = await prisma.server.findUnique({ where: { id } });

    if (!existing) {
      throw AppError.notFound('Server');
    }

    await prisma.server.delete({ where: { id } });

    await deleteCache(`servers:detail:${id}`);
    await deleteCache(`server:${id}:latest-metrics`);
    await deleteCachePattern('servers:list:*');
    await deleteCachePattern('dashboard:*');

    logger.info('Server deleted', { serverId: id, hostname: existing.hostname });
  }

  async heartbeat(serverId: string, data: HeartbeatDto): Promise<{ status: string }> {
    const server = await prisma.server.findUnique({ where: { id: serverId } });

    if (!server) {
      throw AppError.notFound('Server');
    }

    const now = new Date();
    const timestamp = new Date(data.timestamp);

    await prisma.server.update({
      where: { id: serverId },
      data: {
        status: 'ONLINE',
        lastHeartbeatAt: now,
      },
    });

    const metricsToCreate: Prisma.MetricCreateManyInput[] = [];

    metricsToCreate.push({
      serverId,
      type: 'CPU',
      value: data.cpu,
      timestamp,
    });

    const memoryPercent = data.memoryTotalMb > 0
      ? (data.memoryUsedMb / data.memoryTotalMb) * 100
      : 0;

    metricsToCreate.push({
      serverId,
      type: 'MEMORY',
      value: memoryPercent,
      metadata: { usedMb: data.memoryUsedMb, totalMb: data.memoryTotalMb },
      timestamp,
    });

    for (const disk of data.disks) {
      const diskPercent = disk.totalGb > 0 ? (disk.usedGb / disk.totalGb) * 100 : 0;
      metricsToCreate.push({
        serverId,
        type: 'DISK',
        value: diskPercent,
        metadata: { name: disk.name, usedGb: disk.usedGb, totalGb: disk.totalGb },
        timestamp,
      });
    }

    for (const nic of data.networkInterfaces) {
      metricsToCreate.push({
        serverId,
        type: 'NETWORK_IN',
        value: nic.bytesInPerSec,
        metadata: { interface: nic.name },
        timestamp,
      });

      metricsToCreate.push({
        serverId,
        type: 'NETWORK_OUT',
        value: nic.bytesOutPerSec,
        metadata: { interface: nic.name },
        timestamp,
      });
    }

    await prisma.metric.createMany({ data: metricsToCreate });

    if (data.processes && data.processes.length > 0) {
      await prisma.processSnapshot.deleteMany({ where: { serverId } });

      const processData: Prisma.ProcessSnapshotCreateManyInput[] = data.processes.map((p) => ({
        serverId,
        pid: p.pid,
        name: p.name,
        cpuPercent: p.cpuPercent,
        memoryMb: p.memoryMb,
        startTime: p.startTime ? new Date(p.startTime) : null,
        timestamp,
      }));

      await prisma.processSnapshot.createMany({ data: processData });
    }

    if (data.services && data.services.length > 0) {
      await prisma.windowsServiceSnapshot.deleteMany({ where: { serverId } });

      const serviceData: Prisma.WindowsServiceSnapshotCreateManyInput[] = data.services.map((s) => ({
        serverId,
        serviceName: s.serviceName,
        displayName: s.displayName,
        status: s.status,
        startType: s.startType,
        timestamp,
      }));

      await prisma.windowsServiceSnapshot.createMany({ data: serviceData });
    }

    const networkData: Prisma.NetworkSnapshotCreateManyInput[] = data.networkInterfaces.map((nic) => ({
      serverId,
      interfaceName: nic.name,
      bandwidthInBps: BigInt(Math.round(nic.bytesInPerSec)),
      bandwidthOutBps: BigInt(Math.round(nic.bytesOutPerSec)),
      activeConnections: 0,
      timestamp,
    }));

    if (networkData.length > 0) {
      await prisma.networkSnapshot.createMany({ data: networkData });
    }

    const metricsPayload = {
      serverId,
      cpu: data.cpu,
      memoryPercent,
      memoryUsedMb: data.memoryUsedMb,
      memoryTotalMb: data.memoryTotalMb,
      disks: data.disks,
      networkInterfaces: data.networkInterfaces,
      uptime: data.uptime,
      timestamp: data.timestamp,
    };

    await setCache(`server:${serverId}:latest-metrics`, JSON.stringify(metricsPayload), 60);

    emitSocketEvent('metrics:realtime', `server:${serverId}`, metricsPayload);
    emitSocketEvent('metrics:realtime', 'dashboard', metricsPayload);

    await deleteCache(`servers:detail:${serverId}`);
    await deleteCachePattern('dashboard:*');

    return { status: 'ok' };
  }

  async getHealth(id: string): Promise<unknown> {
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            alerts: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!server) {
      throw AppError.notFound('Server');
    }

    const latestMetricsByType: Record<string, { value: number; timestamp: Date }> = {};
    for (const metric of server.metrics) {
      if (!latestMetricsByType[metric.type]) {
        latestMetricsByType[metric.type] = {
          value: metric.value,
          timestamp: metric.timestamp,
        };
      }
    }

    return {
      id: server.id,
      hostname: server.hostname,
      displayName: server.displayName,
      status: server.status,
      lastHeartbeatAt: server.lastHeartbeatAt,
      activeAlerts: server._count.alerts,
      latestMetrics: latestMetricsByType,
    };
  }

  async getProcessSnapshots(serverId: string): Promise<unknown[]> {
    const server = await prisma.server.findUnique({ where: { id: serverId } });

    if (!server) {
      throw AppError.notFound('Server');
    }

    const snapshots = await prisma.processSnapshot.findMany({
      where: { serverId },
      orderBy: [{ timestamp: 'desc' }, { cpuPercent: 'desc' }],
      take: 200,
    });

    return snapshots;
  }

  async getNetworkSnapshots(serverId: string): Promise<unknown[]> {
    const server = await prisma.server.findUnique({ where: { id: serverId } });

    if (!server) {
      throw AppError.notFound('Server');
    }

    const snapshots = await prisma.networkSnapshot.findMany({
      where: { serverId },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    return snapshots.map((s) => ({
      ...s,
      bandwidthInBps: s.bandwidthInBps.toString(),
      bandwidthOutBps: s.bandwidthOutBps.toString(),
    }));
  }

  async checkOfflineServers(): Promise<number> {
    const timeoutThreshold = new Date(
      Date.now() - config.agent.heartbeatTimeoutSeconds * 1000,
    );

    const staleServers = await prisma.server.findMany({
      where: {
        lastHeartbeatAt: { lt: timeoutThreshold },
        status: { not: 'OFFLINE' },
      },
      select: { id: true, hostname: true, status: true },
    });

    if (staleServers.length === 0) {
      return 0;
    }

    const serverIds = staleServers.map((s) => s.id);

    await prisma.server.updateMany({
      where: { id: { in: serverIds } },
      data: { status: 'OFFLINE' },
    });

    for (const server of staleServers) {
      emitSocketEvent('server:status-changed', `server:${server.id}`, {
        serverId: server.id,
        hostname: server.hostname,
        previousStatus: server.status,
        newStatus: 'OFFLINE',
      });

      emitSocketEvent('server:status-changed', 'dashboard', {
        serverId: server.id,
        hostname: server.hostname,
        previousStatus: server.status,
        newStatus: 'OFFLINE',
      });
    }

    await deleteCachePattern('servers:*');
    await deleteCachePattern('dashboard:*');

    logger.warn('Servers marked as offline due to missed heartbeats', {
      count: staleServers.length,
      servers: staleServers.map((s) => s.hostname),
    });

    return staleServers.length;
  }
}

export const serversService = new ServersService();
