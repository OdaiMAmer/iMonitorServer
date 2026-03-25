import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/auth';
import { validate } from '../../common/middleware/validate';
import { loginSchema, registerSchema, changePasswordSchema } from './auth.validation';
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  changePasswordHandler,
  registerHandler,
} from './auth.controller';

const router = Router();

router.post('/login', validate(loginSchema), loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', authenticate, logoutHandler);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePasswordHandler,
);
router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  validate(registerSchema),
  registerHandler,
);

export default router;
