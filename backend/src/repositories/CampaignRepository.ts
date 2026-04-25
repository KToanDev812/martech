import { query, transaction } from '@db/connection';
import { campaignRecipientRepository } from './CampaignRecipientRepository';

export interface CampaignRecipient {
  recipient_id: string;
  email: string;
  name: string | null;
  sent_at: Date | null;
  opened_at: Date | null;
  status: 'pending' | 'sent' | 'failed';
  created_at: Date;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduled_at: Date | null;
  created_by: {
    id: string;
    name: string;
  };
  created_at: Date;
  updated_at: Date;
  recipient_count: number;
  recipients?: CampaignRecipient[];
}

export interface CampaignWithRecipients extends Campaign {
  recipient_count: number;
}

export interface CreateCampaignInput {
  name: string;
  subject: string;
  body: string;
  created_by: string;
}

/**
 * Repository for campaign database operations
 */
export class CampaignRepository {
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
   * Create a new campaign with recipients
   */
  async createWithRecipients(
    input: CreateCampaignInput,
    recipientIds: string[]
  ): Promise<Campaign> {
    // Security: Validate all UUIDs
    this.validateUUID(input.created_by);
    this.validateUUIDs(recipientIds);

    return await transaction(async (client) => {
      // Create campaign
      const campaignResult = await client.query<any>(
        `INSERT INTO campaigns (name, subject, body, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, subject, body, status, scheduled_at, created_by, created_at, updated_at`,
        [input.name, input.subject, input.body, input.created_by]
      );

      const row = campaignResult.rows[0];

      // Associate recipients
      if (recipientIds.length > 0) {
        const recipientValues = recipientIds.map((id, index) => {
          return `($1, $${index + 2})`;
        }).join(', ');

        await client.query(
          `INSERT INTO campaign_recipients (campaign_id, recipient_id)
           VALUES ${recipientValues}`,
          [row.id, ...recipientIds]
        );
      }

      // Get user name for created_by field
      const userResult = await client.query(
        `SELECT name FROM users WHERE id = $1`,
        [row.created_by]
      );

      return {
        id: row.id,
        name: row.name,
        subject: row.subject,
        body: row.body,
        status: row.status,
        scheduled_at: row.scheduled_at,
        created_by: {
          id: row.created_by,
          name: userResult.rows[0].name,
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
        recipient_count: recipientIds.length,
        recipients: [], // Empty array for newly created campaigns
      };
    });
  }

  /**
   * Find campaign by ID with recipients
   */
  async findById(id: string): Promise<Campaign | null> {
    // Security: Validate UUID
    this.validateUUID(id);

    const rows = await query<any>(
      `SELECT
        c.id,
        c.name,
        c.subject,
        c.body,
        c.status,
        c.scheduled_at,
        c.created_by,
        c.created_at,
        c.updated_at,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = c.id) as recipient_count
       FROM campaigns c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];

    // Fetch recipients for this campaign
    console.log('🔍 Fetching recipients for campaign:', id);
    const recipients = await campaignRecipientRepository.getRecipientsByCampaign(id);
    console.log('✅ Found recipients:', recipients.length, recipients);

    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      status: row.status,
      scheduled_at: row.scheduled_at,
      created_by: {
        id: row.created_by,
        name: row.created_by_name,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
      recipient_count: parseInt(row.recipient_count, 10),
      recipients,
    };
  }

  /**
   * Find campaigns by user with pagination
   */
  async findByUserId(
    userId: string,
    limit: number,
    offset: number,
    status?: string
  ): Promise<CampaignWithRecipients[]> {
    // Security: Validate UUID and status
    this.validateUUID(userId);

    if (status) {
      const VALID_STATUSES = ['draft', 'scheduled', 'sent'] as const;
      if (!VALID_STATUSES.includes(status as any)) {
        throw new Error(`Invalid status: ${status}`);
      }
    }

    let queryText = `
      SELECT c.id,
             c.name,
             c.subject,
             c.body,
             c.status,
             c.scheduled_at,
             c.created_by,
             c.created_at,
             c.updated_at,
             u.name as created_by_name,
             COUNT(cr.recipient_id) as recipient_count
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
      WHERE c.created_by = $1
    `;

    const params: any[] = [userId, limit, offset];
    let paramIndex = 4;

    if (status) {
      queryText += ` AND c.status = $${paramIndex} `;
      params.push(status);
      paramIndex++;
    }

    queryText += `
      GROUP BY c.id, c.name, c.subject, c.body, c.status, c.scheduled_at, c.created_by, c.created_at, c.updated_at, u.name
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const rows = await query<any>(queryText, params);

    // Map rows to proper Campaign structure
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      status: row.status,
      scheduled_at: row.scheduled_at,
      created_by: {
        id: row.created_by,
        name: row.created_by_name,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
      recipient_count: parseInt(row.recipient_count, 10),
    }));
  }

  /**
   * Count campaigns by user
   */
  async countByUserId(userId: string, status?: string): Promise<number> {
    let queryText = 'SELECT COUNT(*) as count FROM campaigns WHERE created_by = $1';
    const params: any[] = [userId];

    if (status) {
      queryText += ' AND status = $2';
      params.push(status);
    }

    const rows = await query<{ count: string }>(queryText, params);
    return parseInt(rows[0].count, 10);
  }

  /**
   * Update campaign
   */
  async update(
    id: string,
    updates: Partial<Pick<Campaign, 'name' | 'subject' | 'body' | 'scheduled_at'>>
  ): Promise<Campaign> {
    // Security: Validate UUID
    this.validateUUID(id);

    // Security: Whitelist of allowed column names to prevent SQL injection
    const ALLOWED_COLUMNS = ['name', 'subject', 'body', 'scheduled_at'] as const;
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        // Security: Validate column names against whitelist
        if (!ALLOWED_COLUMNS.includes(key as any)) {
          throw new Error(`Invalid column name: ${key}`);
        }
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Always update updated_at
    fields.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;

    values.push(id);

    const queryText = `
      UPDATE campaigns c
      SET ${fields.join(', ')}
      FROM users u
      WHERE c.id = $${paramIndex} AND c.created_by = u.id
      RETURNING c.id, c.name, c.subject, c.body, c.status, c.scheduled_at, c.created_by, c.created_at, c.updated_at, u.name as created_by_name, (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = c.id) as recipient_count
    `;

    const rows = await query<any>(queryText, values);

    if (rows.length === 0) {
      throw new Error('Campaign not found');
    }

    const row = rows[0];

    // Fetch recipients for this campaign
    const recipients = await campaignRecipientRepository.getRecipientsByCampaign(id);

    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      status: row.status,
      scheduled_at: row.scheduled_at,
      created_by: {
        id: row.created_by,
        name: row.created_by_name,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
      recipient_count: parseInt(row.recipient_count, 10),
      recipients,
    };
  }

  /**
   * Delete campaign
   */
  async delete(id: string): Promise<void> {
    // Security: Validate UUID
    this.validateUUID(id);

    await query('DELETE FROM campaigns WHERE id = $1', [id]);
  }

  /**
   * Update campaign status
   */
  async updateStatus(id: string, status: Campaign['status']): Promise<Campaign> {
    // Security: Validate UUID and status
    this.validateUUID(id);

    const VALID_STATUSES = ['draft', 'scheduled', 'sent'] as const;
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const rows = await query<any>(
      `UPDATE campaigns c
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       FROM users u
       WHERE c.id = $2 AND c.created_by = u.id
       RETURNING c.id, c.name, c.subject, c.body, c.status, c.scheduled_at, c.created_by, c.created_at, c.updated_at, u.name as created_by_name, (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = c.id) as recipient_count`,
      [status, id]
    );

    if (rows.length === 0) {
      throw new Error('Campaign not found');
    }

    const row = rows[0];

    // Fetch recipients for this campaign
    const recipients = await campaignRecipientRepository.getRecipientsByCampaign(id);

    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      status: row.status,
      scheduled_at: row.scheduled_at,
      created_by: {
        id: row.created_by,
        name: row.created_by_name,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
      recipient_count: parseInt(row.recipient_count, 10),
      recipients,
    };
  }

  /**
   * Schedule campaign - atomically update both scheduled_at and status
   * This method is required to satisfy the database constraint:
   * CONSTRAINT draft_can_be_scheduled CHECK (status = 'scheduled' OR scheduled_at IS NULL)
   */
  async scheduleCampaign(id: string, scheduledAt: Date): Promise<Campaign> {
    // Security: Validate UUID
    this.validateUUID(id);

    const rows = await query<any>(
      `UPDATE campaigns c
       SET scheduled_at = $1, status = 'scheduled', updated_at = CURRENT_TIMESTAMP
       FROM users u
       WHERE c.id = $2 AND c.created_by = u.id AND c.status IN ('draft', 'scheduled')
       RETURNING c.id, c.name, c.subject, c.body, c.status, c.scheduled_at, c.created_by, c.created_at, c.updated_at, u.name as created_by_name, (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = c.id) as recipient_count`,
      [scheduledAt, id]
    );

    if (rows.length === 0) {
      throw new Error('Campaign not found or cannot be scheduled');
    }

    const row = rows[0];

    // Fetch recipients for this campaign
    const recipients = await campaignRecipientRepository.getRecipientsByCampaign(id);

    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      status: row.status,
      scheduled_at: row.scheduled_at,
      created_by: {
        id: row.created_by,
        name: row.created_by_name,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
      recipient_count: parseInt(row.recipient_count, 10),
      recipients,
    };
  }

  /**
   * Send campaign - CRITICAL TRANSACTION OPERATION
   * This must be atomic: campaign status + recipient statuses updated together
   */
  async sendCampaign(id: string): Promise<Campaign> {
    // Security: Validate UUID
    this.validateUUID(id);

    return await transaction(async (client) => {
      // Lock and update campaign status
      // Must also clear scheduled_at to satisfy database constraint:
      // CONSTRAINT draft_can_be_scheduled CHECK (status = 'scheduled' OR scheduled_at IS NULL)
      const campaignResult = await client.query<any>(
        `UPDATE campaigns c
         SET status = 'sent', scheduled_at = NULL, updated_at = CURRENT_TIMESTAMP
         FROM users u
         WHERE c.id = $1 AND c.status IN ('draft', 'scheduled') AND c.created_by = u.id
         RETURNING c.id, c.name, c.subject, c.body, c.status, c.scheduled_at, c.created_by, c.created_at, c.updated_at, u.name as created_by_name, (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = c.id) as recipient_count`,
        [id]
      );

      if (campaignResult.rows.length === 0) {
        throw new Error('Campaign not found or cannot be sent');
      }

      // Initialize all recipients as pending
      await client.query(
        `UPDATE campaign_recipients
         SET status = 'pending'
         WHERE campaign_id = $1`,
        [id]
      );

      const row = campaignResult.rows[0];

      // Fetch recipients for this campaign
      const recipients = await campaignRecipientRepository.getRecipientsByCampaign(id);

      return {
        id: row.id,
        name: row.name,
        subject: row.subject,
        body: row.body,
        status: row.status,
        scheduled_at: row.scheduled_at,
        created_by: {
          id: row.created_by,
          name: row.created_by_name,
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
        recipient_count: parseInt(row.recipient_count, 10),
        recipients,
      };
    });
  }

  /**
   * Get campaign recipient count
   */
  async getRecipientCount(id: string): Promise<number> {
    // Security: Validate UUID
    this.validateUUID(id);

    const rows = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM campaign_recipients
       WHERE campaign_id = $1`,
      [id]
    );

    return parseInt(rows[0].count, 10);
  }
}

// Export singleton instance
export const campaignRepository = new CampaignRepository();
