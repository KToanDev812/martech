import { Router } from 'express';
import { authController } from '@controllers/AuthController';
import { validate } from '@middlewares/validationMiddleware';
import { registerSchema, loginSchema } from '@validators/auth.validator';

const router = Router();

/**
 * POST /auth/register
 * Register a new user account
 */
router.post(
  '/register',
  validate(registerSchema),
  authController.register
);

/**
 * POST /auth/login
 * Login with email and password
 */
router.post(
  '/login',
  validate(loginSchema),
  authController.login
);

export default router;
