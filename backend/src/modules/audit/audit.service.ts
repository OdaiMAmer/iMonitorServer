import { prisma } from '../../prisma/prisma.service';
import { logger } from '../../common/utils/logger';

interface ListAuditLogsQuery {
  page: number;
  pageSize: number;
  userId?: string;
  action?: string;
  targetType?: string;
  from?: Date;
  to?: Date;
}

class AuditService {
  async log(
    userId: string,
    action: string,
    targetType: string,
    targetId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId,
          action,
          targetType,
          targetId,
          details: (details as any) ?? undefined,
          ipAddress,
          userAgent,
        },
      });

      return auditLog;
    } catch (error) {
      logger.error(
        `Failed to create audit log: ${(error as Error).message}`,
        { userId, action, targetType, targetId },
      );
      throw error;
    }
  }

  async findAll(query: ListAuditLogsQuery) {
    const { page, pageSize, userId, action, targetType, from, to } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (targetType) {
      where.targetType = { contains: targetType, mode: 'insensitive' };
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = from;
      }
      if (to) {
        where.createdAt.lte = to;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, displayName: true, email: true },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const auditService = new AuditService();
