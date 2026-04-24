import { Router } from 'express';
import { campaignController } from '@controllers/CampaignController';
import { validate } from '@middlewares/validationMiddleware';
import { createCampaignSchema, scheduleCampaignSchema } from '@validators/campaign.validator';
import { authenticate } from '@middlewares/authMiddleware';

const router = Router();

/**
 * All campaign routes require authentication
 */
router.use(authenticate);

/**
 * POST /campaigns
 * Create a new campaign
 */
router.post(
  '/',
  validate(createCampaignSchema),
  campaignController.createCampaign
);

/**
 * GET /campaigns
 * List user's campaigns with pagination
 */
router.get(
  '/',
  campaignController.listCampaigns
);

/**
 * GET /campaigns/:id
 * Get campaign by ID
 */
router.get(
  '/:id',
  campaignController.getCampaign
);

/**
 * PATCH /campaigns/:id
 * Update campaign (draft only)
 */
router.patch(
  '/:id',
  campaignController.updateCampaign
);

/**
 * DELETE /campaigns/:id
 * Delete campaign (draft only)
 */
router.delete(
  '/:id',
  campaignController.deleteCampaign
);

/**
 * POST /campaigns/:id/schedule
 * Schedule campaign for future delivery (draft only)
 */
router.post(
  '/:id/schedule',
  validate(scheduleCampaignSchema),
  campaignController.scheduleCampaign
);

/**
 * POST /campaigns/:id/send
 * Send campaign immediately (draft or scheduled, uses transaction)
 */
router.post(
  '/:id/send',
  campaignController.sendCampaign
);

/**
 * GET /campaigns/:id/stats
 * Get campaign statistics with open and send rates
 */
router.get(
  '/:id/stats',
  campaignController.getCampaignStats
);

export default router;
