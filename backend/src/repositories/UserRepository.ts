import { query } from '@db/connection';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password_hash: string;
}

/**
 * Repository for user database operations
 */
export class UserRepository {
  /**
   * Validate UUID format to prevent injection
   */
  private validateUUID(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error(`Invalid UUID format: ${id}`);
    }
  }

  /**
   * Validate email format to prevent injection
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    // Security: Validate email format
    this.validateEmail(email);

    const rows = await query<User>(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    // Security: Validate UUID format
    this.validateUUID(id);

    const rows = await query<User>(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE id = $1',
      [id]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create new user
   */
  async create(input: CreateUserInput): Promise<User> {
    // Security: Validate email format
    this.validateEmail(input.email);

    const rows = await query<User>(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, password_hash, created_at`,
      [input.email, input.name, input.password_hash]
    );

    return rows[0];
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    // Security: Validate email format
    this.validateEmail(email);

    const rows = await query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists',
      [email]
    );

    return rows[0].exists;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
