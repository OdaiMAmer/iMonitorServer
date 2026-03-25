import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/response';
import { metricsService } from './metrics.service';
import type { CompareQuery } from './metrics.validation';

export async function compareHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as CompareQuery;
    const result = await metricsService.compareMetrics(query);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
