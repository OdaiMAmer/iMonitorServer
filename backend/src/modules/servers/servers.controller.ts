import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../common/utils/response';
import { AppError } from '../../common/utils/app-error';
import { serversService } from './servers.service';
import { auditService } from '../audit/audit.service';
import type { RegisterServerDto, UpdateServerDto, HeartbeatDto, ListServersQuery } from './servers.validation';

export async function registerHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = req.body as RegisterServerDto;
    const result = await serversService.register(data);

    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
}

export async function listHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ListServersQuery;
    const { servers, total, page, pageSize } = await serversService.findAll(query);

    sendPaginated(res, servers as Record<string, unknown>[], total, page, pageSize);
  } catch (error) {
    next(error);
  }
}

export async function getHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const server = await serversService.findById(id);

    sendSuccess(res, server);
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const data = req.body as UpdateServerDto;
    const server = await serversService.update(id, data);

    await auditService.log(
      req.user!.sub,
      'SERVER_UPDATED',
      'Server',
      id,
      data,
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendSuccess(res, server);
  } catch (error) {
    next(error);
  }
}

export async function deleteHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    await serversService.remove(id);

    await auditService.log(
      req.user!.sub,
      'SERVER_DELETED',
      'Server',
      id,
      undefined,
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function heartbeatHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!req.agent) {
      throw AppError.unauthorized('Agent authentication required');
    }

    if (req.agent.serverId !== id) {
      throw AppError.forbidden('Agent is not authorized for this server');
    }

    const data = req.body as HeartbeatDto;
    const result = await serversService.heartbeat(id, data);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function healthHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const health = await serversService.getHealth(id);

    sendSuccess(res, health);
  } catch (error) {
    next(error);
  }
}

export async function getServerMetricsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { metricsService } = await import('../metrics/metrics.service');
    const query = req.query as Record<string, string>;
    const metrics = await metricsService.getServerMetrics(id, query);

    sendSuccess(res, metrics);
  } catch (error) {
    next(error);
  }
}

export async function getLatestMetricsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { metricsService } = await import('../metrics/metrics.service');
    const metrics = await metricsService.getLatestMetrics(id);

    sendSuccess(res, metrics);
  } catch (error) {
    next(error);
  }
}

export async function bulkIngestHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!req.agent) {
      throw AppError.unauthorized('Agent authentication required');
    }

    if (req.agent.serverId !== id) {
      throw AppError.forbidden('Agent is not authorized for this server');
    }

    const { metricsService } = await import('../metrics/metrics.service');
    const { metrics } = req.body;
    const result = await metricsService.bulkIngest(id, metrics);

    sendCreated(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getProcessSnapshotsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const snapshots = await serversService.getProcessSnapshots(id);

    sendSuccess(res, snapshots);
  } catch (error) {
    next(error);
  }
}

export async function getNetworkSnapshotsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const snapshots = await serversService.getNetworkSnapshots(id);

    sendSuccess(res, snapshots);
  } catch (error) {
    next(error);
  }
}
