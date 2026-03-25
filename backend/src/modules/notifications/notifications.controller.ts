import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import {
  sendSuccess,
  sendPaginated,
} from '../../common/utils/response';
import { notificationsService } from './notifications.service';
import { auditService } from '../audit/audit.service';

export async function listNotificationsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await notificationsService.getUserNotifications(
      req.user!.sub,
      req.query as any,
    );

    sendPaginated(res, result.data, result.total, result.page, result.pageSize);
  } catch (error) {
    next(error);
  }
}

export async function markReadHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const notification = await notificationsService.markAsRead(
      req.params.id as string,
      req.user!.sub,
    );

    sendSuccess(res, notification);
  } catch (error) {
    next(error);
  }
}

export async function markAllReadHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await notificationsService.markAllAsRead(req.user!.sub);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getSettingsHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const settings = await notificationsService.getSettings();

    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
}

export async function updateSettingsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const settings = await notificationsService.updateSettings(req.body);

    await auditService.log(
      req.user!.sub,
      'SMTP_SETTINGS_UPDATED',
      'SystemSettings',
      'singleton',
      { fields: Object.keys(req.body) },
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
}

export async function testEmailHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      throw new Error('Recipient email is required');
    }

    const result = await notificationsService.sendTestEmail(email);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
