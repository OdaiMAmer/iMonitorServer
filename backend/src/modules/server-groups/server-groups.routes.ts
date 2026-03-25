import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/auth';
import { validate, validateParams } from '../../common/middleware/validate';
import {
  createGroupSchema,
  updateGroupSchema,
  groupIdParamSchema,
  assignServersSchema,
} from './server-groups.validation';
import {
  listGroupsHandler,
  createGroupHandler,
  updateGroupHandler,
  deleteGroupHandler,
  assignServersHandler,
  removeServersHandler,
} from './server-groups.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'OPERATOR', 'VIEWER'),
  listGroupsHandler,
);

router.post(
  '/',
  authorize('ADMIN'),
  validate(createGroupSchema),
  createGroupHandler,
);

router.patch(
  '/:id',
  authorize('ADMIN'),
  validateParams(groupIdParamSchema),
  validate(updateGroupSchema),
  updateGroupHandler,
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  validateParams(groupIdParamSchema),
  deleteGroupHandler,
);

router.post(
  '/:id/servers',
  authorize('ADMIN', 'OPERATOR'),
  validateParams(groupIdParamSchema),
  validate(assignServersSchema),
  assignServersHandler,
);

router.delete(
  '/:id/servers',
  authorize('ADMIN', 'OPERATOR'),
  validateParams(groupIdParamSchema),
  validate(assignServersSchema),
  removeServersHandler,
);

export default router;
