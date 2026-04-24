/**
 * Security utilities for input validation and sanitization
 * Prevents SQL injection and other security vulnerabilities
 */

/**
 * Validate UUID format
 * @throws Error if UUID format is invalid
 */
export function validateUUID(id: string): void {
  if (!id) {
    throw new Error('UUID cannot be empty');
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error(`Invalid UUID format: ${id}`);
  }
}

/**
 * Validate multiple UUIDs
 * @throws Error if any UUID format is invalid
 */
export function validateUUIDs(ids: string[]): void {
  if (!Array.isArray(ids)) {
    throw new Error('UUIDs must be an array');
  }

  ids.forEach((id, index) => {
    try {
      validateUUID(id);
    } catch (error) {
      throw new Error(`Invalid UUID at index ${index}: ${id}`);
    }
  });
}

/**
 * Validate email format
 * @throws Error if email format is invalid
 */
export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new Error('Email must be a non-empty string');
  }

  if (email.length > 255) {
    throw new Error('Email address too long (max 255 characters)');
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new Error(`Invalid email format: ${email}`);
  }
}

/**
 * Validate status against allowed values
 */
export function validateStatus(status: string, allowedStatuses: readonly string[]): void {
  if (!status || typeof status !== 'string') {
    throw new Error('Status must be a non-empty string');
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${allowedStatuses.join(', ')}`);
  }
}

/**
 * Campaign-specific status validation
 */
export function validateCampaignStatus(status: string): void {
  const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'sent'] as const;
  validateStatus(status, CAMPAIGN_STATUSES);
}

/**
 * Campaign recipient status validation
 */
export function validateCampaignRecipientStatus(status: string): void {
  const RECIPIENT_STATUSES = ['pending', 'sent', 'failed'] as const;
  validateStatus(status, RECIPIENT_STATUSES);
}

/**
 * Validate and sanitize string input
 */
export function validateString(input: string, maxLength: number, fieldName: string = 'input'): void {
  if (!input || typeof input !== 'string') {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  if (input.length > maxLength) {
    throw new Error(`${fieldName} too long (max ${maxLength} characters)`);
  }

  // Check for potential SQL injection patterns
  const dangerousPatterns = [
    /--/, // SQL comments
    /\/\*/, // SQL multi-line comments
    /;\s*(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE)/i, // SQL commands
    /union\s+select/i, // UNION attacks
    /\bor\s+1\s*=\s*1\b/i, // Boolean-based SQL injection
    /\band\s+1\s*=\s*1\b/i, // Boolean-based SQL injection
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      throw new Error(`Potentially malicious content detected in ${fieldName}`);
    }
  }
}

/**
 * Validate column names against whitelist (for dynamic queries)
 */
export function validateColumns(columns: Record<string, any>, allowedColumns: readonly string[]): void {
  const invalidColumns = Object.keys(columns).filter(
    key => !allowedColumns.includes(key)
  );

  if (invalidColumns.length > 0) {
    throw new Error(`Invalid column names: ${invalidColumns.join(', ')}. Allowed: ${allowedColumns.join(', ')}`);
  }
}

/**
 * Sanitize user input for logging
 */
export function sanitizeForLogging(input: any): any {
  if (typeof input === 'string') {
    // Remove potential sensitive data
    return input
      .replace(/password_hash.*/gi, '***')
      .replace(/password.*/gi, '***')
      .replace(/token.*/gi, '***')
      .substring(0, 100); // Truncate long strings
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeForLogging);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Skip sensitive keys
      if (key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret')) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }

  return input;
}

/**
 * Rate limiting key generator
 */
export function generateRateLimitKey(identifier: string, action: string): string {
  return `rate_limit:${action}:${identifier}`;
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
