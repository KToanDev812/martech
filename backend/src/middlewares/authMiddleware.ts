import { Request, Response, NextFunction } from 'express';
import { authService } from '@services/AuthService';
import { UnauthorizedError } from '@utils/errors';

/**
 * Extend Express Request to include user property
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to verify JWT token
 * Adds userId to request if token is valid
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token required');
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and extract userId
    const userId = authService.verifyToken(token);

    // Add userId to request
    req.userId = userId;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't throw if no token
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const userId = authService.verifyToken(token);
      req.userId = userId;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
