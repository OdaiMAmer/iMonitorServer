import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/auth';
import { validate, validateQuery, validateParams } from '../../common/middleware/validate';
import {
  createAlertRuleSchema,
  updateAlertRuleSchema,
  alertRuleIdParamSchema,
  listAlertsQuerySchema,
  alertIdParamSchema,
} from './alerts.validation';
import {
  createRuleHandler,
  listRulesHandler,
  updateRuleHandler,
  deleteRuleHandler,
  listActiveAlertsHandler,
  alertHistoryHandler,
  acknowledgeHandler,
  resolveHandler,
} from './alerts.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/rules',
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  listRulesHandler,
);

router.post(
  '/rules',
  authorize('ADMIN'),
  validate(createAlertRuleSchema),
  createRuleHandler,
);

router.patch(
  '/rules/:id',
  authorize('ADMIN'),
  validateParams(alertRuleIdParamSchema),
  validate(updateAlertRuleSchema),
  updateRuleHandler,
);

router.delete(
  '/rules/:id',
  authorize('ADMIN'),
  validateParams(alertRuleIdParamSchema),
  deleteRuleHandler,
);

router.get(
  '/',
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  validateQuery(listAlertsQuerySchema),
  listActiveAlertsHandler,
);

router.get(
  '/history',
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  validateQuery(listAlertsQuerySchema),
  alertHistoryHandler,
);

router.post(
  '/:id/acknowledge',
  authorize('ADMIN', 'OPERATOR'),
  validateParams(alertIdParamSchema),
  acknowledgeHandler,
);

router.post(
  '/:id/resolve',
  authorize('ADMIN', 'OPERATOR'),
  validateParams(alertIdParamSchema),
  resolveHandler,
);

export default router;
