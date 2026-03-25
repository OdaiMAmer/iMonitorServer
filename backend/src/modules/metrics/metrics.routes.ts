import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/auth';
import { validateQuery } from '../../common/middleware/validate';
import { compareQuerySchema } from './metrics.validation';
import { compareHandler } from './metrics.controller';

const router = Router();

router.get(
  '/compare',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  validateQuery(compareQuerySchema),
  compareHandler,
);

export default router;
