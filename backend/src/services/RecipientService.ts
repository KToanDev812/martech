import { getPool } from '@db/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Recipient Service
 * Handles recipient lookup and creation by email address
 */
export class RecipientService {
  /**
   * Get or create recipients by email addresses
   * - If email exists in recipients table, return its ID
   * - If email doesn't exist, create new recipient and return new ID
   *
   * @param emails - Array of email addresses
   * @returns Array of recipient UUIDs
   */
  async getOrCreateRecipientsByEmails(emails: string[]): Promise<string[]> {
    if (!emails || emails.length === 0) {
      return [];
    }

    const recipientIds: string[] = [];

    for (const email of emails) {
      const trimmedEmail = email.toLowerCase().trim();

      // Check if recipient exists
      const pool = getPool();
      const existingRecipient = await pool.query(
        'SELECT id FROM recipients WHERE email = $1',
        [trimmedEmail]
      );

      if (existingRecipient.rows.length > 0) {
        // Recipient exists, use existing ID
        recipientIds.push(existingRecipient.rows[0].id);
      } else {
        // Recipient doesn't exist, create new one
        const pool = getPool();
        const newRecipient = await pool.query(
          `INSERT INTO recipients (id, email, name, created_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (email) DO UPDATE SET
             name = EXCLUDED.name,
             created_at = EXCLUDED.created_at
           RETURNING id`,
          [uuidv4(), trimmedEmail, this.extractNameFromEmail(trimmedEmail)]
        );

        recipientIds.push(newRecipient.rows[0].id);
      }
    }

    return recipientIds;
  }

  /**
   * Extract name from email address
   * Uses the part before @ as the name, formatted nicely
   *
   * @param email - Email address
   * @returns Extracted name or null
   */
  private extractNameFromEmail(email: string): string | null {
    try {
      const [username] = email.split('@');
      // Convert email format to nice name
      // john.doe -> John Doe
      // john -> John
      const nameParts = username.split(/[._-]/);
      const formattedName = nameParts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');

      return formattedName || null;
    } catch {
      return null;
    }
  }

  /**
   * Get recipient by email
   *
   * @param email - Email address
   * @returns Recipient object or null
   */
  async getRecipientByEmail(email: string) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM recipients WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    return result.rows[0] || null;
  }

  /**
   * Get multiple recipients by emails
   *
   * @param emails - Array of email addresses
   * @returns Array of recipient objects
   */
  async getRecipientsByEmails(emails: string[]) {
    if (emails.length === 0) {
      return [];
    }

    const pool = getPool();
    const result = await pool.query(
      `SELECT id, email, name, created_at FROM recipients
       WHERE email = ANY($1::text[])
       ORDER BY created_at DESC`,
      [emails]
    );

    return result.rows;
  }
}

export const recipientService = new RecipientService();
