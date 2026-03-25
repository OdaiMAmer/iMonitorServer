import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/auth';
import { validateQuery } from '../../common/middleware/validate';
import { listAuditLogsQuerySchema } from './audit.validation';
import { listAuditLogsHandler } from './audit.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN'),
  validateQuery(listAuditLogsQuerySchema),
  listAuditLogsHandler,
);

export default router;
