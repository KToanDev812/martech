import { campaignRepository, Campaign } from '@repositories/CampaignRepository';
import { recipientRepository } from '@repositories/RecipientRepository';
import { campaignRecipientRepository } from '@repositories/CampaignRecipientRepository';
import { CreateCampaignInput } from '@validators/campaign.validator';
import { NotFoundError, ValidationError } from '@utils/errors';

export interface CampaignResponse extends Campaign {
  recipient_count: number;
}

/**
 * Service for campaign business logic
 */
export class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(
    input: CreateCampaignInput,
    recipientIds: string[],
    userId: string
  ): Promise<CampaignResponse> {
    // Validate recipients exist
    const missingRecipients = await recipientRepository.validateRecipientsExist(recipientIds);
    if (missingRecipients.length > 0) {
      throw new ValidationError('Some recipients do not exist', {
        missing_recipients: missingRecipients,
      });
    }

    // Create campaign with recipients
    const campaign = await campaignRepository.createWithRecipients(
      {
        name: input.name,
        subject: input.subject,
        body: input.body,
        created_by: userId,
      },
      recipientIds
    );

    // Get recipient count
    const recipientCount = recipientIds.length;

    return {
      ...campaign,
      recipient_count: recipientCount,
    };
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string, userId: string): Promise<Campaign> {
    const campaign = await campaignRepository.findById(id);

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    // Verify user owns this campaign
    if (campaign.created_by !== userId) {
      throw new ValidationError('You do not have permission to access this campaign');
    }

    return campaign;
  }

  /**
   * List campaigns for user
   */
  async listCampaigns(
    userId: string,
    page: number,
    limit: number,
    status?: string
  ): Promise<{ campaigns: CampaignResponse[]; total: number }> {
    // Validate pagination
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));
    const offset = (validPage - 1) * validLimit;

    // Get campaigns
    const campaigns = await campaignRepository.findByUserId(
      userId,
      validLimit,
      offset,
      status
    );

    // Get total count
    const total = await campaignRepository.countByUserId(userId, status);

    return {
      campaigns: campaigns,
      total,
    };
  }

  /**
   * Update campaign
   */
  async updateCampaign(
    id: string,
    updates: Partial<CreateCampaignInput>,
    userId: string
  ): Promise<Campaign> {
    // Check if campaign exists and user owns it
    const existing = await this.getCampaignById(id, userId);

    // Only draft campaigns can be edited
    if (existing.status !== 'draft') {
      throw new ValidationError('Only draft campaigns can be edited');
    }

    // Update campaign
    const updated = await campaignRepository.update(id, updates);

    return updated;
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string, userId: string): Promise<void> {
    // Check if campaign exists and user owns it
    const existing = await this.getCampaignById(id, userId);

    // Only draft campaigns can be deleted
    if (existing.status !== 'draft') {
      throw new ValidationError('Only draft campaigns can be deleted');
    }

    // Delete campaign
    await campaignRepository.delete(id);
  }

  /**
   * Schedule campaign
   */
  async scheduleCampaign(
    id: string,
    scheduledAt: Date,
    userId: string
  ): Promise<Campaign> {
    // Check if campaign exists and user owns it
    const existing = await this.getCampaignById(id, userId);

    // Only draft campaigns can be scheduled
    if (existing.status !== 'draft') {
      throw new ValidationError('Only draft campaigns can be scheduled');
    }

    // Update campaign with scheduled time and status
    const updated = await campaignRepository.update(id, {
      scheduled_at: scheduledAt,
    });

    // Update status to scheduled
    return await campaignRepository.updateStatus(id, 'scheduled');
  }

  /**
   * Send campaign - CRITICAL OPERATION
   * This uses a transaction to ensure atomic state transition
   */
  async sendCampaign(id: string, userId: string): Promise<{
    campaign_id: string;
    queued: boolean;
    recipient_count: number;
  }> {
    // Check if campaign exists and user owns it
    const existing = await this.getCampaignById(id, userId);

    // Only draft or scheduled campaigns can be sent
    if (existing.status === 'sent') {
      throw new ValidationError('Campaign has already been sent');
    }

    if (existing.status !== 'draft' && existing.status !== 'scheduled') {
      throw new ValidationError('Only draft or scheduled campaigns can be sent');
    }

    // Get recipient count for response
    const recipientCount = await campaignRepository.getRecipientCount(id);

    // Send campaign (uses transaction internally)
    const updated = await campaignRepository.sendCampaign(id);

    return {
      campaign_id: updated.id,
      queued: true,
      recipient_count: recipientCount,
    };
  }

  /**
   * Get campaign statistics
   * Uses efficient aggregation query with rate calculations
   */
  async getCampaignStats(id: string, userId: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    opened: number;
    open_rate: number;
    send_rate: number;
  }> {
    // Verify user owns this campaign
    await this.getCampaignById(id, userId);

    // Get raw stats from database (single aggregation query)
    const raw = await campaignRecipientRepository.getCampaignStats(id);

    // Calculate rates in application layer
    const open_rate = raw.sent > 0 ? raw.opened / raw.sent : 0;
    const send_rate = raw.total > 0 ? raw.sent / raw.total : 0;

    return {
      total: raw.total,
      sent: raw.sent,
      failed: raw.failed,
      opened: raw.opened,
      open_rate: parseFloat(open_rate.toFixed(3)), // Round to 3 decimal places
      send_rate: parseFloat(send_rate.toFixed(3)),  // Round to 3 decimal places
    };
  }
}

// Export singleton instance
export const campaignService = new CampaignService();
