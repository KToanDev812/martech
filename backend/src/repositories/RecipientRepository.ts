import { query } from '@db/connection';

export interface Recipient {
  id: string;
  email: string;
  name: string | null;
  created_at: Date;
}

/**
 * Repository for recipient database operations
 */
export class RecipientRepository {
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
   * Validate multiple UUIDs
   */
  private validateUUIDs(ids: string[]): void {
    ids.forEach(id => this.validateUUID(id));
  }

  /**
   * Find recipient by ID
   */
  async findById(id: string): Promise<Recipient | null> {
    // Security: Validate UUID format
    this.validateUUID(id);

    const rows = await query<Recipient>(
      'SELECT id, email, name, created_at FROM recipients WHERE id = $1',
      [id]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find multiple recipients by IDs
   */
  async findByIds(ids: string[]): Promise<Recipient[]> {
    if (ids.length === 0) return [];

    // Security: Validate all UUIDs
    this.validateUUIDs(ids);

    const rows = await query<Recipient>(
      `SELECT id, email, name, created_at
       FROM recipients
       WHERE id = ANY($1)`,
      [ids]
    );

    return rows;
  }

  /**
   * Check if recipients exist
   */
  async validateRecipientsExist(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];

    // Security: Validate all UUIDs
    this.validateUUIDs(ids);

    const rows = await query<{ id: string }>(
      `SELECT id FROM recipients WHERE id = ANY($1)`,
      [ids]
    );

    const foundIds = new Set(rows.map(row => row.id));
    const missingIds = ids.filter(id => !foundIds.has(id));

    return missingIds;
  }
}

// Export singleton instance
export const recipientRepository = new RecipientRepository();
