import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth';
import { overviewHandler, groupSummaryHandler } from './dashboard.controller';

const router = Router();

router.get(
  '/overview',
  authenticate,
  overviewHandler,
);

router.get(
  '/groups/:id/summary',
  authenticate,
  groupSummaryHandler,
);

export default router;
