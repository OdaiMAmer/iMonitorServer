import nodemailer from 'nodemailer';
import { prisma } from '../../prisma/prisma.service';
import { AppError } from '../../common/utils/app-error';
import { logger } from '../../common/utils/logger';
import { getCache, setCache, deleteCachePattern } from '../../common/utils/redis';
import { getIO } from '../../gateway/socket.gateway';

const MAX_RULES_PER_SERVER = 50;
const ALERTS_CACHE_PREFIX = 'alerts';
const ALERTS_CACHE_TTL = 15;

interface CreateAlertRuleData {
  name: string;
  serverId?: string;
  metricType: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: string;
  channels: string[];
  webhookUrl?: string;
  emailRecipients?: string[];
  cooldownMinutes?: number;
  isEnabled?: boolean;
}

interface UpdateAlertRuleData {
  name?: string;
  serverId?: string | null;
  metricType?: string;
  condition?: string;
  threshold?: number;
  duration?: number;
  severity?: string;
  channels?: string[];
  webhookUrl?: string | null;
  emailRecipients?: string[];
  cooldownMinutes?: number;
  isEnabled?: boolean;
}

interface ListAlertsQuery {
  page: number;
  pageSize: number;
  status?: string;
  severity?: string;
  serverId?: string;
  from?: Date;
  to?: Date;
}

class AlertsService {
  async createRule(data: CreateAlertRuleData) {
    if (data.serverId) {
      const server = await prisma.server.findUnique({
        where: { id: data.serverId },
        select: { id: true },
      });

      if (!server) {
        throw AppError.notFound('Server');
      }

      const ruleCount = await prisma.alertRule.count({
        where: { serverId: data.serverId },
      });

      if (ruleCount >= MAX_RULES_PER_SERVER) {
        throw AppError.badRequest(
          `Maximum of ${MAX_RULES_PER_SERVER} alert rules per server exceeded`,
        );
      }
    }

    const rule = await prisma.alertRule.create({
      data: {
        name: data.name,
        serverId: data.serverId,
        metricType: data.metricType as any,
        condition: data.condition,
        threshold: data.threshold,
        duration: data.duration,
        severity: data.severity as any,
        channels: data.channels as any[],
        webhookUrl: data.webhookUrl,
        emailRecipients: data.emailRecipients ?? [],
        cooldownMinutes: data.cooldownMinutes ?? 15,
        isEnabled: data.isEnabled ?? true,
      },
      include: {
        server: {
          select: { id: true, hostname: true, displayName: true },
        },
      },
    });

    logger.info(`Alert rule created: ${rule.name} (${rule.id})`);

    return rule;
  }

  async findAllRules() {
    const rules = await prisma.alertRule.findMany({
      include: {
        server: {
          select: { id: true, hostname: true, displayName: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules;
  }

  async updateRule(id: string, data: UpdateAlertRuleData) {
    const existing = await prisma.alertRule.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw AppError.notFound('Alert rule');
    }

    if (data.serverId) {
      const server = await prisma.server.findUnique({
        where: { id: data.serverId },
        select: { id: true },
      });

      if (!server) {
        throw AppError.notFound('Server');
      }
    }

    const rule = await prisma.alertRule.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.serverId !== undefined && { serverId: data.serverId }),
        ...(data.metricType !== undefined && { metricType: data.metricType as any }),
        ...(data.condition !== undefined && { condition: data.condition }),
        ...(data.threshold !== undefined && { threshold: data.threshold }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.severity !== undefined && { severity: data.severity as any }),
        ...(data.channels !== undefined && { channels: data.channels as any[] }),
        ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
        ...(data.emailRecipients !== undefined && { emailRecipients: data.emailRecipients }),
        ...(data.cooldownMinutes !== undefined && { cooldownMinutes: data.cooldownMinutes }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      },
      include: {
        server: {
          select: { id: true, hostname: true, displayName: true },
        },
      },
    });

    logger.info(`Alert rule updated: ${rule.name} (${rule.id})`);

    return rule;
  }

  async deleteRule(id: string) {
    const existing = await prisma.alertRule.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existing) {
      throw AppError.notFound('Alert rule');
    }

    await prisma.alertRule.delete({ where: { id } });

    logger.info(`Alert rule deleted: ${existing.name} (${id})`);
  }

  async findActiveAlerts(query: ListAlertsQuery) {
    const { page, pageSize, status, severity, serverId, from, to } = query;
    const skip = (page - 1) * pageSize;

    const cacheKey = `${ALERTS_CACHE_PREFIX}:active:${JSON.stringify(query)}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {};

    if (status) {
      where.status = status;
    } else {
      where.status = 'ACTIVE';
    }

    if (severity) {
      where.alertRule = { severity };
    }

    if (serverId) {
      where.serverId = serverId;
    }

    if (from || to) {
      where.triggeredAt = {};
      if (from) {
        where.triggeredAt.gte = from;
      }
      if (to) {
        where.triggeredAt.lte = to;
      }
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          alertRule: {
            select: {
              id: true,
              name: true,
              metricType: true,
              condition: true,
              threshold: true,
              severity: true,
            },
          },
          server: {
            select: { id: true, hostname: true, displayName: true },
          },
          acknowledgedBy: {
            select: { id: true, displayName: true },
          },
        },
        skip,
        take: pageSize,
        orderBy: { triggeredAt: 'desc' },
      }),
      prisma.alert.count({ where }),
    ]);

    const result = {
      data: alerts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };

    await setCache(cacheKey, JSON.stringify(result), ALERTS_CACHE_TTL);

    return result;
  }

  async findAlertHistory(query: ListAlertsQuery) {
    const { page, pageSize, severity, serverId, from, to } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (severity) {
      where.alertRule = { severity };
    }

    if (serverId) {
      where.serverId = serverId;
    }

    if (from || to) {
      where.triggeredAt = {};
      if (from) {
        where.triggeredAt.gte = from;
      }
      if (to) {
        where.triggeredAt.lte = to;
      }
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          alertRule: {
            select: {
              id: true,
              name: true,
              metricType: true,
              condition: true,
              threshold: true,
              severity: true,
            },
          },
          server: {
            select: { id: true, hostname: true, displayName: true },
          },
          acknowledgedBy: {
            select: { id: true, displayName: true },
          },
        },
        skip,
        take: pageSize,
        orderBy: { triggeredAt: 'desc' },
      }),
      prisma.alert.count({ where }),
    ]);

    return {
      data: alerts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      select: { id: true, status: true },
    });

    if (!alert) {
      throw AppError.notFound('Alert');
    }

    if (alert.status !== 'ACTIVE') {
      throw AppError.badRequest(
        `Alert cannot be acknowledged in '${alert.status}' status`,
      );
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
      },
      include: {
        alertRule: {
          select: { id: true, name: true, severity: true },
        },
        server: {
          select: { id: true, hostname: true },
        },
        acknowledgedBy: {
          select: { id: true, displayName: true },
        },
      },
    });

    await deleteCachePattern(`${ALERTS_CACHE_PREFIX}:*`);

    const io = getIO();
    if (io) {
      io.emit('alert:acknowledged', updated);
    }

    logger.info(`Alert acknowledged: ${alertId} by user ${userId}`);

    return updated;
  }

  async resolveAlert(alertId: string, userId: string) {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      select: { id: true, status: true },
    });

    if (!alert) {
      throw AppError.notFound('Alert');
    }

    if (alert.status === 'RESOLVED') {
      throw AppError.badRequest('Alert is already resolved');
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      include: {
        alertRule: {
          select: { id: true, name: true, severity: true },
        },
        server: {
          select: { id: true, hostname: true },
        },
      },
    });

    await deleteCachePattern(`${ALERTS_CACHE_PREFIX}:*`);

    const io = getIO();
    if (io) {
      io.emit('alert:resolved', updated);
    }

    logger.info(`Alert resolved: ${alertId} by user ${userId}`);

    return updated;
  }

  async evaluateAlerts() {
    const rules = await prisma.alertRule.findMany({
      where: { isEnabled: true },
      include: {
        server: {
          select: { id: true, hostname: true },
        },
      },
    });

    for (const rule of rules) {
      try {
        await this.evaluateRule(rule);
      } catch (error) {
        logger.error(`Error evaluating alert rule ${rule.id}: ${(error as Error).message}`);
      }
    }
  }

  private async evaluateRule(rule: any) {
    const servers = rule.serverId
      ? [{ id: rule.serverId }]
      : await prisma.server.findMany({
          where: { status: { not: 'OFFLINE' } },
          select: { id: true },
        });

    for (const server of servers) {
      try {
        await this.evaluateRuleForServer(rule, server.id);
      } catch (error) {
        logger.error(
          `Error evaluating rule ${rule.id} for server ${server.id}: ${(error as Error).message}`,
        );
      }
    }
  }

  private async evaluateRuleForServer(rule: any, serverId: string) {
    const latestMetric = await prisma.metric.findFirst({
      where: {
        serverId,
        type: rule.metricType,
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestMetric) {
      return;
    }

    const metricAge = Date.now() - latestMetric.timestamp.getTime();
    if (metricAge > rule.duration * 2 * 1000) {
      return;
    }

    const conditionMet = this.checkCondition(
      latestMetric.value,
      rule.condition,
      rule.threshold,
    );

    if (conditionMet) {
      await this.handleConditionMet(rule, serverId, latestMetric.value);
    } else {
      await this.handleConditionCleared(rule, serverId);
    }
  }

  private checkCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  private async handleConditionMet(rule: any, serverId: string, triggerValue: number) {
    const cooldownThreshold = new Date(
      Date.now() - rule.cooldownMinutes * 60 * 1000,
    );

    const recentAlert = await prisma.alert.findFirst({
      where: {
        alertRuleId: rule.id,
        serverId,
        triggeredAt: { gte: cooldownThreshold },
      },
      orderBy: { triggeredAt: 'desc' },
    });

    if (recentAlert) {
      return;
    }

    const alert = await prisma.alert.create({
      data: {
        alertRuleId: rule.id,
        serverId,
        status: 'ACTIVE',
        triggerValue,
        message: `${rule.name}: ${rule.metricType} is ${rule.condition} ${rule.threshold}% (current: ${triggerValue.toFixed(1)}%)`,
      },
      include: {
        alertRule: {
          select: { id: true, name: true, severity: true, channels: true, webhookUrl: true, emailRecipients: true },
        },
        server: {
          select: { id: true, hostname: true, displayName: true },
        },
      },
    });

    await deleteCachePattern(`${ALERTS_CACHE_PREFIX}:*`);

    const io = getIO();
    if (io) {
      io.emit('alert:triggered', alert);
    }

    logger.warn(
      `Alert triggered: ${rule.name} on server ${serverId} (value: ${triggerValue})`,
    );

    await this.sendAlertNotifications(alert, rule);
  }

  private async sendAlertNotifications(alert: any, rule: any): Promise<void> {
    const channels: string[] = rule.channels || [];

    for (const channel of channels) {
      try {
        if (channel === 'IN_APP') {
          await this.sendInAppNotification(alert);
        } else if (channel === 'EMAIL') {
          await this.sendEmailNotification(alert, rule);
        } else if (channel === 'WEBHOOK') {
          await this.sendWebhookNotification(alert, rule);
        }

        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: channel as any,
            payload: {
              message: alert.message,
              severity: rule.severity,
              serverHostname: alert.server?.hostname,
            },
            sentAt: new Date(),
            success: true,
          },
        });
      } catch (error) {
        logger.error(`Failed to send ${channel} notification for alert ${alert.id}: ${(error as Error).message}`);

        await prisma.alertNotification.create({
          data: {
            alertId: alert.id,
            channel: channel as any,
            payload: {
              message: alert.message,
              severity: rule.severity,
              serverHostname: alert.server?.hostname,
            },
            success: false,
            error: (error as Error).message,
          },
        });
      }
    }
  }

  private async sendInAppNotification(alert: any): Promise<void> {
    const { notificationsService } = await import('../notifications/notifications.service');

    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'OPERATOR'] }, isActive: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await notificationsService.createNotification(
        admin.id,
        `Alert: ${alert.alertRule?.name || 'Unknown'}`,
        alert.message,
        `/alerts/${alert.id}`,
      );
    }
  }

  private async sendEmailNotification(alert: any, rule: any): Promise<void> {
    const recipients: string[] = rule.emailRecipients || [];

    if (recipients.length === 0) {
      logger.debug(`No email recipients configured for alert rule ${rule.id}, skipping email`);
      return;
    }

    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings?.smtpHost || !settings.smtpPort || !settings.smtpFrom) {
      logger.warn('SMTP not configured, skipping email notification');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpTls,
      auth:
        settings.smtpUser && settings.smtpPass
          ? { user: settings.smtpUser, pass: settings.smtpPass }
          : undefined,
    });

    const severityColor = rule.severity === 'CRITICAL' ? '#dc2626' : rule.severity === 'WARNING' ? '#f59e0b' : '#3b82f6';
    const serverName = alert.server?.displayName || alert.server?.hostname || 'Unknown';

    await transporter.sendMail({
      from: settings.smtpFrom,
      to: recipients.join(', '),
      subject: `[${rule.severity}] ${rule.name} - ${serverName}`,
      text: `Alert: ${alert.message}\n\nServer: ${serverName}\nSeverity: ${rule.severity}\nTriggered at: ${new Date().toISOString()}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
          <div style="background: ${severityColor}; color: white; padding: 12px 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">${rule.severity} Alert</h2>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <p><strong>Rule:</strong> ${rule.name}</p>
            <p><strong>Server:</strong> ${serverName}</p>
            <p><strong>Message:</strong> ${alert.message}</p>
            <p><strong>Trigger Value:</strong> ${alert.triggerValue?.toFixed(1)}%</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 16px;">Sent by iMonitorServer</p>
        </div>
      `,
    });

    logger.info(`Alert email sent to ${recipients.join(', ')} for alert ${alert.id}`);
  }

  private async sendWebhookNotification(alert: any, rule: any): Promise<void> {
    const webhookUrl: string | undefined = rule.webhookUrl;

    if (!webhookUrl) {
      logger.debug(`No webhook URL configured for alert rule ${rule.id}, skipping webhook`);
      return;
    }

    const payload = {
      event: 'alert.triggered',
      alert: {
        id: alert.id,
        message: alert.message,
        triggerValue: alert.triggerValue,
        status: alert.status,
        triggeredAt: new Date().toISOString(),
      },
      rule: {
        id: rule.id,
        name: rule.name,
        metricType: rule.metricType,
        condition: rule.condition,
        threshold: rule.threshold,
        severity: rule.severity,
      },
      server: {
        id: alert.server?.id,
        hostname: alert.server?.hostname,
        displayName: alert.server?.displayName,
      },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'iMonitorServer/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned status ${response.status}: ${response.statusText}`);
    }

    logger.info(`Webhook notification sent to ${webhookUrl} for alert ${alert.id}`);
  }

  private async handleConditionCleared(rule: any, serverId: string) {
    const autoResolveThreshold = new Date(
      Date.now() - rule.duration * 2 * 1000,
    );

    const activeAlerts = await prisma.alert.findMany({
      where: {
        alertRuleId: rule.id,
        serverId,
        status: 'ACTIVE',
        triggeredAt: { lte: autoResolveThreshold },
      },
    });

    if (activeAlerts.length === 0) {
      return;
    }

    for (const alert of activeAlerts) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });

      const io = getIO();
      if (io) {
        io.emit('alert:resolved', {
          id: alert.id,
          status: 'RESOLVED',
          resolvedAt: new Date(),
          autoResolved: true,
        });
      }

      logger.info(`Alert auto-resolved: ${alert.id} (condition no longer met)`);
    }

    await deleteCachePattern(`${ALERTS_CACHE_PREFIX}:*`);
  }
}

export const alertsService = new AlertsService();
