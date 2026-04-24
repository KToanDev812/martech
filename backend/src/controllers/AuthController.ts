import { Request, Response } from 'express';
import { authService } from '@services/AuthService';
import { registerSchema, loginSchema } from '@validators/auth.validator';
import { asyncHandler } from '@middlewares/errorHandler';

/**
 * Controller for authentication endpoints
 */
export class AuthController {
  /**
   * POST /auth/register
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const input = registerSchema.parse(req.body);

    // Call service
    const result = await authService.register(input);

    // Send response
    res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * POST /auth/login
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const input = loginSchema.parse(req.body);

    // Call service
    const result = await authService.login(input);

    // Send response
    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

// Export singleton instance
export const authController = new AuthController();
