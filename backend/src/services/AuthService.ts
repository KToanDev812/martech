import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { userRepository } from '@repositories/UserRepository';
import { RegisterInput, LoginInput } from '@validators/auth.validator';
import { ConflictError, UnauthorizedError } from '@utils/errors';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    created_at: Date;
  };
  token: string;
}

const SALT_ROUNDS = 10;

/**
 * Service for authentication business logic
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if email already exists
    const emailExists = await userRepository.emailExists(input.email);
    if (emailExists) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      password_hash,
    });

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      token,
    };
  }

  /**
   * Verify JWT token and return user ID
   */
  verifyToken(token: string): string {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Generate JWT token for user
   */
  private generateToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.sign({ userId }, jwtSecret, {
      expiresIn: jwtExpiresIn as SignOptions['expiresIn'],
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
