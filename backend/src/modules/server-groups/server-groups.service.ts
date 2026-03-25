import { prisma } from '../../prisma/prisma.service';
import { AppError } from '../../common/utils/app-error';
import { logger } from '../../common/utils/logger';

interface CreateGroupData {
  name: string;
  description?: string;
  color?: string;
}

interface UpdateGroupData {
  name?: string;
  description?: string | null;
  color?: string | null;
}

class ServerGroupsService {
  async findAll() {
    const groups = await prisma.serverGroup.findMany({
      include: {
        _count: {
          select: { servers: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
      serverCount: group._count.servers,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }));
  }

  async create(data: CreateGroupData) {
    const existing = await prisma.serverGroup.findUnique({
      where: { name: data.name },
      select: { id: true },
    });

    if (existing) {
      throw AppError.conflict(`Server group with name '${data.name}' already exists`);
    }

    const group = await prisma.serverGroup.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
      },
    });

    logger.info(`Server group created: ${group.name} (${group.id})`);

    return group;
  }

  async update(id: string, data: UpdateGroupData) {
    const existing = await prisma.serverGroup.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw AppError.notFound('Server group');
    }

    if (data.name) {
      const nameConflict = await prisma.serverGroup.findFirst({
        where: { name: data.name, id: { not: id } },
        select: { id: true },
      });

      if (nameConflict) {
        throw AppError.conflict(`Server group with name '${data.name}' already exists`);
      }
    }

    const group = await prisma.serverGroup.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });

    logger.info(`Server group updated: ${group.name} (${group.id})`);

    return group;
  }

  async delete(id: string) {
    const existing = await prisma.serverGroup.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existing) {
      throw AppError.notFound('Server group');
    }

    const serversInGroup = await prisma.serverGroupAssignment.findMany({
      where: { serverGroupId: id },
      select: { serverId: true },
    });

    if (serversInGroup.length > 0) {
      const serverIds = serversInGroup.map((s) => s.serverId);

      const activeRulesCount = await prisma.alertRule.count({
        where: {
          serverId: { in: serverIds },
          isEnabled: true,
        },
      });

      if (activeRulesCount > 0) {
        throw AppError.conflict(
          `Cannot delete group: ${activeRulesCount} active alert rule(s) reference servers in this group`,
        );
      }
    }

    await prisma.serverGroup.delete({ where: { id } });

    logger.info(`Server group deleted: ${existing.name} (${id})`);
  }

  async assignServers(groupId: string, serverIds: string[]) {
    const group = await prisma.serverGroup.findUnique({
      where: { id: groupId },
      select: { id: true, name: true },
    });

    if (!group) {
      throw AppError.notFound('Server group');
    }

    const existingServers = await prisma.server.findMany({
      where: { id: { in: serverIds } },
      select: { id: true },
    });

    const existingServerIds = new Set(existingServers.map((s) => s.id));
    const missingIds = serverIds.filter((id) => !existingServerIds.has(id));

    if (missingIds.length > 0) {
      throw AppError.badRequest(
        `Server(s) not found: ${missingIds.join(', ')}`,
      );
    }

    const operations = serverIds.map((serverId) =>
      prisma.serverGroupAssignment.upsert({
        where: {
          serverId_serverGroupId: {
            serverId,
            serverGroupId: groupId,
          },
        },
        create: {
          serverId,
          serverGroupId: groupId,
        },
        update: {},
      }),
    );

    await prisma.$transaction(operations);

    logger.info(
      `Assigned ${serverIds.length} server(s) to group ${group.name} (${groupId})`,
    );

    return { assigned: serverIds.length };
  }

  async removeServers(groupId: string, serverIds: string[]) {
    const group = await prisma.serverGroup.findUnique({
      where: { id: groupId },
      select: { id: true, name: true },
    });

    if (!group) {
      throw AppError.notFound('Server group');
    }

    const result = await prisma.serverGroupAssignment.deleteMany({
      where: {
        serverGroupId: groupId,
        serverId: { in: serverIds },
      },
    });

    logger.info(
      `Removed ${result.count} server(s) from group ${group.name} (${groupId})`,
    );

    return { removed: result.count };
  }
}

export const serverGroupsService = new ServerGroupsService();
