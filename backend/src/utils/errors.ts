/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Conflict error (409)
 * Used when state conflicts prevent an operation
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, 'CONFLICT', message, details);
    this.name = 'ConflictError';
  }
}

/**
 * Unauthorized error (401)
 * Used for authentication failures
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(401, 'UNAUTHORIZED', message, details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error (403)
 * Used for authorization failures
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', details?: any) {
    super(403, 'FORBIDDEN', message, details);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not found error (404)
 * Used when a resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error (400)
 * Used for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}
