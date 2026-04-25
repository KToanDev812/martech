/**
 * Error handling utilities and constants
 */

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string>
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    !error?.response &&
    (error?.message === 'Network Error' ||
     error?.message?.includes('timeout') ||
     error?.code === 'ECONNABORTED' ||
     error?.code === 'ERR_NETWORK')
  )
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  const status = error?.response?.status || error?.status
  return status === 401 || status === 403
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  return error?.response?.status === 422 || error?.error?.code === 'VALIDATION_ERROR'
}

/**
 * Check if error is a conflict/invalid state error
 */
export function isConflictError(error: any): boolean {
  return error?.response?.status === 409 || error?.error?.code === 'INVALID_STATE'
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: any): boolean {
  return error?.response?.status === 404
}

/**
 * Get user-friendly error message based on error type
 */
export function getErrorMessage(error: any, fallback: string = 'An error occurred'): string {
  // Network error
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.'
  }

  // Auth error
  if (isAuthError(error)) {
    return 'Your session has expired. Please log in again.'
  }

  // Conflict error (invalid state)
  if (isConflictError(error)) {
    return error?.error?.message || 'This action is not allowed in the current state.'
  }

  // Not found error
  if (isNotFoundError(error)) {
    return error?.error?.message || 'The requested resource was not found.'
  }

  // Validation error
  if (isValidationError(error)) {
    return error?.error?.message || 'Please check your input and try again.'
  }

  // Backend error message
  if (error?.error?.message) {
    return error.error.message
  }

  // Generic error message
  if (error?.message) {
    return error.message
  }

  return fallback
}

/**
 * Get error code from error object
 */
export function getErrorCode(error: any): string | null {
  return error?.error?.code || error?.code || null
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are retryable
  if (isNetworkError(error)) {
    return true
  }

  // 5xx server errors are retryable
  const status = error?.response?.status || error?.status
  if (status >= 500 && status < 600) {
    return true
  }

  // 429 Too Many Requests is retryable
  if (status === 429) {
    return true
  }

  return false
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_STATE: 'INVALID_STATE',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const

/**
 * Campaign-specific error messages
 */
export const CAMPAIGN_ERROR_MESSAGES = {
  NOT_DRAFT: 'Only draft campaigns can be edited or deleted.',
  ALREADY_SENT: 'This campaign has already been sent and cannot be modified.',
  ALREADY_SCHEDULED: 'This campaign is already scheduled.',
  NO_RECIPIENTS: 'Cannot send a campaign without recipients.',
  SCHEDULE_IN_PAST: 'Scheduled time must be in the future.',
  INVALID_STATUS: 'Invalid campaign status for this operation.',
} as const
