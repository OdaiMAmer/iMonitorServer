import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from '../../common/utils/response';
import { serverGroupsService } from './server-groups.service';
import { auditService } from '../audit/audit.service';

export async function listGroupsHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const groups = await serverGroupsService.findAll();

    sendSuccess(res, groups);
  } catch (error) {
    next(error);
  }
}

export async function createGroupHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const group = await serverGroupsService.create(req.body);

    await auditService.log(
      req.user!.sub,
      'SERVER_GROUP_CREATED',
      'ServerGroup',
      group.id,
      { name: req.body.name },
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendCreated(res, group);
  } catch (error) {
    next(error);
  }
}

export async function updateGroupHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const group = await serverGroupsService.update(req.params.id as string, req.body);

    await auditService.log(
      req.user!.sub,
      'SERVER_GROUP_UPDATED',
      'ServerGroup',
      req.params.id as string,
      req.body,
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendSuccess(res, group);
  } catch (error) {
    next(error);
  }
}

export async function deleteGroupHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await serverGroupsService.delete(req.params.id as string);

    await auditService.log(
      req.user!.sub,
      'SERVER_GROUP_DELETED',
      'ServerGroup',
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

export async function assignServersHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await serverGroupsService.assignServers(
      req.params.id as string,
      req.body.serverIds,
    );

    await auditService.log(
      req.user!.sub,
      'SERVERS_ASSIGNED_TO_GROUP',
      'ServerGroup',
      req.params.id as string,
      { serverIds: req.body.serverIds },
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function removeServersHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await serverGroupsService.removeServers(
      req.params.id as string,
      req.body.serverIds,
    );

    await auditService.log(
      req.user!.sub,
      'SERVERS_REMOVED_FROM_GROUP',
      'ServerGroup',
      req.params.id as string,
      { serverIds: req.body.serverIds },
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
