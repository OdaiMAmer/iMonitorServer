import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from '../../common/utils/response';
import { alertsService } from './alerts.service';
import { auditService } from '../audit/audit.service';

export async function createRuleHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rule = await alertsService.createRule(req.body);

    await auditService.log(
      req.user!.sub,
      'ALERT_RULE_CREATED',
      'AlertRule',
      rule.id,
      { name: rule.name, metricType: req.body.metricType, severity: req.body.severity },
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendCreated(res, rule);
  } catch (error) {
    next(error);
  }
}

export async function listRulesHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rules = await alertsService.findAllRules();

    sendSuccess(res, rules);
  } catch (error) {
    next(error);
  }
}

export async function updateRuleHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rule = await alertsService.updateRule(req.params.id as string, req.body);

    await auditService.log(
      req.user!.sub,
      'ALERT_RULE_UPDATED',
      'AlertRule',
      req.params.id as string,
      req.body,
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendSuccess(res, rule);
  } catch (error) {
    next(error);
  }
}

export async function deleteRuleHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await alertsService.deleteRule(req.params.id as string);

    await auditService.log(
      req.user!.sub,
      'ALERT_RULE_DELETED',
      'AlertRule',
      req.params.id as string,
      undefined,
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function listActiveAlertsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await alertsService.findActiveAlerts(req.query as any);

    sendPaginated(res, result.data, result.total, result.page, result.pageSize);
  } catch (error) {
    next(error);
  }
}

export async function alertHistoryHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await alertsService.findAlertHistory(req.query as any);

    sendPaginated(res, result.data, result.total, result.page, result.pageSize);
  } catch (error) {
    next(error);
  }
}

export async function acknowledgeHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const alert = await alertsService.acknowledgeAlert(
      req.params.id as string,
      req.user!.sub,
    );

    await auditService.log(
      req.user!.sub,
      'ALERT_ACKNOWLEDGED',
      'Alert',
      req.params.id as string,
      undefined,
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendSuccess(res, alert);
  } catch (error) {
    next(error);
  }
}

export async function resolveHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const alert = await alertsService.resolveAlert(
      req.params.id as string,
      req.user!.sub,
    );

    await auditService.log(
      req.user!.sub,
      'ALERT_RESOLVED',
      'Alert',
      req.params.id as string,
      undefined,
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendSuccess(res, alert);
  } catch (error) {
    next(error);
  }
}
