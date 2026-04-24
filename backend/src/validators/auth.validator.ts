import { z } from 'zod';

/**
 * Registration validation schema
 */
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format'),
  password: z.string()
    .min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
