import { Router } from 'express';
import { authenticate, authenticateAgent, authorize } from '../../common/middleware/auth';
import { validate, validateQuery, validateParams } from '../../common/middleware/validate';
import {
  registerServerSchema,
  updateServerSchema,
  heartbeatSchema,
  serverIdParamSchema,
  listServersQuerySchema,
} from './servers.validation';
import { metricsQuerySchema, bulkMetricsSchema } from '../metrics/metrics.validation';
import {
  registerHandler,
  listHandler,
  getHandler,
  updateHandler,
  deleteHandler,
  heartbeatHandler,
  healthHandler,
  getServerMetricsHandler,
  getLatestMetricsHandler,
  bulkIngestHandler,
  getProcessSnapshotsHandler,
  getNetworkSnapshotsHandler,
} from './servers.controller';

const router = Router();

router.post(
  '/register',
  validate(registerServerSchema),
  registerHandler,
);

router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  validateQuery(listServersQuerySchema),
  listHandler,
);

router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  validateParams(serverIdParamSchema),
  getHandler,
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'OPERATOR'),
  validateParams(serverIdParamSchema),
  validate(updateServerSchema),
  updateHandler,
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validateParams(serverIdParamSchema),
  deleteHandler,
);

router.post(
  '/:id/heartbeat',
  authenticateAgent,
  validateParams(serverIdParamSchema),
  validate(heartbeatSchema),
  heartbeatHandler,
);

router.get(
  '/:id/health',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  validateParams(serverIdParamSchema),
  healthHandler,
);

router.get(
  '/:id/metrics',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  validateParams(serverIdParamSchema),
  validateQuery(metricsQuerySchema),
  getServerMetricsHandler,
);

router.get(
  '/:id/metrics/latest',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  validateParams(serverIdParamSchema),
  getLatestMetricsHandler,
);

router.post(
  '/:id/metrics/bulk',
  authenticateAgent,
  validateParams(serverIdParamSchema),
  validate(bulkMetricsSchema),
  bulkIngestHandler,
);

router.get(
  '/:id/processes',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  validateParams(serverIdParamSchema),
  getProcessSnapshotsHandler,
);

router.get(
  '/:id/network',
  authenticate,
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  validateParams(serverIdParamSchema),
  getNetworkSnapshotsHandler,
);

export default router;
