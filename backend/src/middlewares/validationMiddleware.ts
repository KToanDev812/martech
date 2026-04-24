import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '@utils/errors';

/**
 * Middleware factory to validate request body against a Zod schema
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      // Handle Zod validation errors
      if (error.errors) {
        throw new ValidationError('Validation failed', {
          fields: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};
