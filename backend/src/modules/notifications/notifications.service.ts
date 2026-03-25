import nodemailer from 'nodemailer';
import { prisma } from '../../prisma/prisma.service';
import { AppError } from '../../common/utils/app-error';
import { logger } from '../../common/utils/logger';
import { getIO } from '../../gateway/socket.gateway';

interface ListNotificationsQuery {
  page: number;
  pageSize: number;
  unreadOnly?: boolean;
}

interface UpdateSmtpData {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
  tls?: boolean;
}

class NotificationsService {
  async getUserNotifications(userId: string, query: ListNotificationsQuery) {
    const { page, pageSize, unreadOnly } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });

    if (!notification) {
      throw AppError.notFound('Notification');
    }

    if (notification.userId !== userId) {
      throw AppError.forbidden('You can only mark your own notifications as read');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    logger.info(`Marked ${result.count} notifications as read for user ${userId}`);

    return { count: result.count };
  }

  async createNotification(
    userId: string,
    title: string,
    body: string,
    link?: string,
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        link,
      },
    });

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', notification);
    }

    return notification;
  }

  async getSettings() {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'singleton' },
      });
    }

    return {
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpFrom: settings.smtpFrom,
      smtpTls: settings.smtpTls,
      hasPassword: !!settings.smtpPass,
    };
  }

  async updateSettings(data: UpdateSmtpData) {
    const updateData: any = {};

    if (data.host !== undefined) {
      updateData.smtpHost = data.host;
    }
    if (data.port !== undefined) {
      updateData.smtpPort = data.port;
    }
    if (data.user !== undefined) {
      updateData.smtpUser = data.user;
    }
    if (data.pass !== undefined) {
      updateData.smtpPass = data.pass;
    }
    if (data.from !== undefined) {
      updateData.smtpFrom = data.from;
    }
    if (data.tls !== undefined) {
      updateData.smtpTls = data.tls;
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...updateData },
      update: updateData,
    });

    logger.info('SMTP settings updated');

    return {
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpFrom: settings.smtpFrom,
      smtpTls: settings.smtpTls,
      hasPassword: !!settings.smtpPass,
    };
  }

  async sendTestEmail(recipientEmail: string) {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings?.smtpHost || !settings.smtpPort) {
      throw AppError.badRequest('SMTP settings are not configured');
    }

    if (!settings.smtpFrom) {
      throw AppError.badRequest('SMTP sender address (from) is not configured');
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpTls,
      auth:
        settings.smtpUser && settings.smtpPass
          ? {
              user: settings.smtpUser,
              pass: settings.smtpPass,
            }
          : undefined,
    });

    try {
      await transporter.verify();
    } catch (error) {
      throw AppError.badRequest(
        `SMTP connection failed: ${(error as Error).message}`,
      );
    }

    try {
      await transporter.sendMail({
        from: settings.smtpFrom,
        to: recipientEmail,
        subject: 'iMonitorServer - Test Email',
        text: 'This is a test email from iMonitorServer. If you received this, your SMTP configuration is working correctly.',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>iMonitorServer - Test Email</h2>
            <p>This is a test email from iMonitorServer.</p>
            <p>If you received this, your SMTP configuration is working correctly.</p>
            <hr />
            <p style="color: #666; font-size: 12px;">Sent at ${new Date().toISOString()}</p>
          </div>
        `,
      });

      logger.info(`Test email sent successfully to ${recipientEmail}`);

      return { success: true, message: `Test email sent to ${recipientEmail}` };
    } catch (error) {
      throw AppError.badRequest(
        `Failed to send test email: ${(error as Error).message}`,
      );
    }
  }
}

export const notificationsService = new NotificationsService();
