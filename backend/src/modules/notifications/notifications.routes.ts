import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/auth';
import { validate, validateQuery, validateParams } from '../../common/middleware/validate';
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  updateSmtpSchema,
} from './notifications.validation';
import {
  listNotificationsHandler,
  markReadHandler,
  markAllReadHandler,
  getSettingsHandler,
  updateSettingsHandler,
  testEmailHandler,
} from './notifications.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(listNotificationsQuerySchema),
  listNotificationsHandler,
);

router.patch(
  '/:id/read',
  validateParams(notificationIdParamSchema),
  markReadHandler,
);

router.post(
  '/read-all',
  markAllReadHandler,
);

router.get(
  '/settings',
  authorize('ADMIN'),
  getSettingsHandler,
);

router.patch(
  '/settings',
  authorize('ADMIN'),
  validate(updateSmtpSchema),
  updateSettingsHandler,
);

router.post(
  '/settings/test-email',
  authorize('ADMIN'),
  testEmailHandler,
);

export default router;
