import { Request, Response } from 'express';
import { campaignService } from '@services/CampaignService';
import { createCampaignSchema, updateCampaignSchema, scheduleCampaignSchema, campaignQuerySchema } from '@validators/campaign.validator';
import { asyncHandler } from '@middlewares/errorHandler';
import { requireStringParam } from '@utils/express';
import { ValidationError } from '@utils/errors';

/**
 * Controller for campaign endpoints
 */
export class CampaignController {
  /**
   * POST /campaigns
   * Create a new campaign
   */
  createCampaign = asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const input = createCampaignSchema.parse(req.body);
    const userId = req.userId!; // Set by auth middleware

    // Call service (email-to-UUID conversion handled internally)
    const campaign = await campaignService.createCampaign(
      input,
      userId
    );

    // Send response
    res.status(201).json({
      success: true,
      data: campaign,
    });
  });

  /**
   * GET /campaigns/:id
   * Get campaign by ID
   */
  getCampaign = asyncHandler(async (req: Request, res: Response) => {
    const campaignId = requireStringParam(req.params.id, 'id');
    const userId = req.userId!; // Set by auth middleware

    console.log('🔍 getCampaign API call:', { campaignId, userId });

    // Call service
    const campaign = await campaignService.getCampaignById(campaignId, userId);

    console.log('✅ Campaign data from service:', {
      id: campaign?.id,
      name: campaign?.name,
      hasRecipients: !!campaign?.recipients,
      recipientCount: campaign?.recipients?.length,
      recipients: campaign?.recipients,
    });

    // Send response
    res.status(200).json({
      success: true,
      data: campaign,
    });
  });

  /**
   * GET /campaigns
   * List user's campaigns
   */
  listCampaigns = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!; // Set by auth middleware

    // Validate query parameters using Zod schema
    const query = campaignQuerySchema.parse(req.query);

    // Apply reasonable bounds to pagination
    const page = Math.max(1, Math.min(100, query.page));
    const limit = Math.max(1, Math.min(100, query.limit));

    // Call service
    const result = await campaignService.listCampaigns(
      userId,
      page,
      limit,
      query.status
    );

    // Calculate total pages
    const totalPages = Math.ceil(result.total / limit);

    // Send response
    res.status(200).json({
      success: true,
      data: {
        campaigns: result.campaigns,
        pagination: {
          page,
          limit,
          total: result.total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
    });
  });

  /**
   * PATCH /campaigns/:id
   * Update campaign
   */
  updateCampaign = asyncHandler(async (req: Request, res: Response) => {
    const campaignId = requireStringParam(req.params.id, 'id');
    const userId = req.userId!; // Set by auth middleware

    // Validate input using Zod schema
    const updates = updateCampaignSchema.parse(req.body);

    // Call service
    const campaign = await campaignService.updateCampaign(
      campaignId,
      updates,
      userId
    );

    // Send response
    res.status(200).json({
      success: true,
      data: campaign,
    });
  });

  /**
   * DELETE /campaigns/:id
   * Delete campaign
   */
  deleteCampaign = asyncHandler(async (req: Request, res: Response) => {
    const campaignId = requireStringParam(req.params.id, 'id');
    const userId = req.userId!; // Set by auth middleware

    // Call service
    await campaignService.deleteCampaign(campaignId, userId);

    // Send response
    res.status(204).send();
  });

  /**
   * POST /campaigns/:id/schedule
   * Schedule a campaign for future delivery
   */
  scheduleCampaign = asyncHandler(async (req: Request, res: Response) => {
    const campaignId = requireStringParam(req.params.id, 'id');
    const userId = req.userId!; // Set by auth middleware

    // Validate input using Zod schema (includes future date validation)
    const input = scheduleCampaignSchema.parse(req.body);
    const scheduledAt = new Date(input.scheduled_at);

    // Validate date is valid
    if (isNaN(scheduledAt.getTime())) {
      throw new ValidationError('Invalid date format');
    }

    // Call service
    const campaign = await campaignService.scheduleCampaign(
      campaignId,
      scheduledAt,
      userId
    );

    // Send response
    res.status(200).json({
      success: true,
      data: campaign,
    });
  });

  /**
   * POST /campaigns/:id/send
   * Send campaign immediately (CRITICAL TRANSACTION OPERATION)
   */
  sendCampaign = asyncHandler(async (req: Request, res: Response) => {
    const campaignId = requireStringParam(req.params.id, 'id');
    const userId = req.userId!; // Set by auth middleware

    // Call service (uses transaction internally)
    const result = await campaignService.sendCampaign(campaignId, userId);

    // Send response
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * GET /campaigns/:id/stats
   * Get campaign statistics with rates
   */
  getCampaignStats = asyncHandler(async (req: Request, res: Response) => {
    const campaignId = requireStringParam(req.params.id, 'id');
    const userId = req.userId!; // Set by auth middleware

    // Call service
    const stats = await campaignService.getCampaignStats(campaignId, userId);

    // Send response
    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}

// Export singleton instance
export const campaignController = new CampaignController();
