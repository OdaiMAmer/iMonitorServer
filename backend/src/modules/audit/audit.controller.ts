import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { sendPaginated } from '../../common/utils/response';
import { auditService } from './audit.service';

export async function listAuditLogsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await auditService.findAll(req.query as any);

    sendPaginated(res, result.data, result.total, result.page, result.pageSize);
  } catch (error) {
    next(error);
  }
}
