import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/auth';
import { validate, validateQuery, validateParams } from '../../common/middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} from './users.validation';
import {
  listUsersHandler,
  getUserHandler,
  getMeHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from './users.controller';

const router = Router();

router.use(authenticate);

router.get('/me', getMeHandler);

router.get(
  '/',
  authorize('ADMIN'),
  validateQuery(listUsersQuerySchema),
  listUsersHandler,
);

router.post(
  '/',
  authorize('ADMIN'),
  validate(createUserSchema),
  createUserHandler,
);

router.get(
  '/:id',
  authorize('ADMIN'),
  validateParams(userIdParamSchema),
  getUserHandler,
);

router.patch(
  '/:id',
  authorize('ADMIN'),
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  updateUserHandler,
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  validateParams(userIdParamSchema),
  deleteUserHandler,
);

export default router;
