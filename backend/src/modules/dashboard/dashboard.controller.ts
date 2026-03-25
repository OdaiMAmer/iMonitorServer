import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { sendSuccess } from '../../common/utils/response';
import { dashboardService } from './dashboard.service';

export async function overviewHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const overview = await dashboardService.getOverview();

    sendSuccess(res, overview);
  } catch (error) {
    next(error);
  }
}

export async function groupSummaryHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const summary = await dashboardService.getGroupSummary(id);

    sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
}
