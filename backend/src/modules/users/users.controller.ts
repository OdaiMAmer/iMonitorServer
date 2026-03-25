import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from '../../common/utils/response';
import { usersService } from './users.service';
import { auditService } from '../audit/audit.service';

export async function listUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, pageSize, role, search } = req.query as any;

    const result = await usersService.findAll({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 25,
      role: role as string | undefined,
      search: search as string | undefined,
    });

    sendPaginated(res, result.data, result.total, result.page, result.pageSize);
  } catch (error) {
    next(error);
  }
}

export async function getUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await usersService.findById(req.params.id as string);

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function getMeHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await usersService.findMe(req.user!.sub);

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function createUserHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await usersService.create(req.body);

    await auditService.log(
      req.user!.sub,
      'USER_CREATED',
      'User',
      (user as any).id,
      { email: req.body.email, role: req.body.role },
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendCreated(res, user);
  } catch (error) {
    next(error);
  }
}

export async function updateUserHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await usersService.update(req.params.id as string, req.body);

    await auditService.log(
      req.user!.sub,
      'USER_UPDATED',
      'User',
      req.params.id as string,
      req.body,
      Array.isArray(req.ip) ? req.ip[0] : req.ip,
      req.get('user-agent') as string | undefined,
    );

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function deleteUserHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await usersService.softDelete(req.params.id as string);

    await auditService.log(
      req.user!.sub,
      'USER_DELETED',
      'User',
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
