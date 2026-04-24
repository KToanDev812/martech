import { query } from '@db/connection';

export interface CampaignStatsRaw {
  total: number;
  sent: number;
  failed: number;
  opened: number;
}

export interface CampaignStats {
  total: number;
  sent: number;
  failed: number;
  opened: number;
  open_rate: number;
  send_rate: number;
}

/**
 * Repository for campaign recipient operations
 */
export class CampaignRecipientRepository {
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
   * Validate status against allowed values
   */
  private validateStatus(status: string): void {
    const VALID_STATUSES = ['pending', 'sent', 'failed'] as const;
    if (!VALID_STATUSES.includes(status as any)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }
  }

  /**
   * Get campaign statistics using aggregation query
   * Single efficient query with all calculations
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStatsRaw> {
    // Security: Validate UUID
    this.validateUUID(campaignId);

    const rows = await query<CampaignStatsRaw>(
      `SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0) as sent,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed,
        COALESCE(SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END), 0) as opened
      FROM campaign_recipients
      WHERE campaign_id = $1`,
      [campaignId]
    );

    if (rows.length === 0) {
      return {
        total: 0,
        sent: 0,
        failed: 0,
        opened: 0,
      };
    }

    return rows[0];
  }

  /**
   * Get all recipients for a campaign with details
   */
  async getRecipientsByCampaign(campaignId: string): Promise<any[]> {
    // Security: Validate UUID
    this.validateUUID(campaignId);

    const rows = await query(
      `SELECT
        cr.recipient_id,
        r.email,
        r.name,
        cr.sent_at,
        cr.opened_at,
        cr.status,
        cr.created_at
      FROM campaign_recipients cr
      JOIN recipients r ON cr.recipient_id = r.id
      WHERE cr.campaign_id = $1
      ORDER BY cr.created_at ASC`,
      [campaignId]
    );

    return rows;
  }

  /**
   * Get recipient delivery details
   */
  async getRecipientDetails(campaignId: string, recipientId: string): Promise<any | null> {
    // Security: Validate both UUIDs
    this.validateUUID(campaignId);
    this.validateUUID(recipientId);

    const rows = await query(
      `SELECT
        cr.recipient_id,
        r.email,
        r.name,
        cr.sent_at,
        cr.opened_at,
        cr.status,
        cr.created_at
      FROM campaign_recipients cr
      JOIN recipients r ON cr.recipient_id = r.id
      WHERE cr.campaign_id = $1 AND cr.recipient_id = $2`,
      [campaignId, recipientId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Update recipient status
   */
  async updateRecipientStatus(
    campaignId: string,
    recipientId: string,
    status: 'sent' | 'failed'
  ): Promise<void> {
    // Security: Validate inputs
    this.validateUUID(campaignId);
    this.validateUUID(recipientId);
    this.validateStatus(status);

    await query(
      `UPDATE campaign_recipients
       SET status = $1, sent_at = CASE WHEN $1 = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END
       WHERE campaign_id = $2 AND recipient_id = $3`,
      [status, campaignId, recipientId]
    );
  }

  /**
   * Mark email as opened
   */
  async markAsOpened(campaignId: string, recipientId: string): Promise<void> {
    // Security: Validate both UUIDs
    this.validateUUID(campaignId);
    this.validateUUID(recipientId);

    await query(
      `UPDATE campaign_recipients
       SET opened_at = CURRENT_TIMESTAMP
       WHERE campaign_id = $1 AND recipient_id = $2
         AND opened_at IS NULL`,
      [campaignId, recipientId]
    );
  }

  /**
   * Get detailed breakdown by status
   */
  async getStatusBreakdown(campaignId: string): Promise<Record<string, number>> {
    // Security: Validate UUID
    this.validateUUID(campaignId);

    const rows = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count
       FROM campaign_recipients
       WHERE campaign_id = $1
       GROUP BY status`,
      [campaignId]
    );

    const breakdown: Record<string, number> = {
      pending: 0,
      sent: 0,
      failed: 0,
    };

    rows.forEach(row => {
      breakdown[row.status] = parseInt(row.count, 10);
    });

    return breakdown;
  }
}

// Export singleton instance
export const campaignRecipientRepository = new CampaignRecipientRepository();
