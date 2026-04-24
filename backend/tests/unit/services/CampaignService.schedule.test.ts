import { CampaignService } from '@services/CampaignService';
import { campaignRepository } from '@repositories/CampaignRepository';

// Mock dependencies
jest.mock('@repositories/CampaignRepository', () => ({
  CampaignRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
    createWithRecipients: jest.fn(),
    findByUserId: jest.fn(),
    countByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    sendCampaign: jest.fn(),
    getRecipientCount: jest.fn(),
  })),
  campaignRepository: {
    findById: jest.fn(),
    createWithRecipients: jest.fn(),
    findByUserId: jest.fn(),
    countByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    sendCampaign: jest.fn(),
    getRecipientCount: jest.fn(),
  },
}));

jest.mock('@repositories/RecipientRepository', () => ({
  RecipientRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
    findByIds: jest.fn(),
    validateRecipientsExist: jest.fn(),
  })),
  recipientRepository: {
    findById: jest.fn(),
    findByIds: jest.fn(),
    validateRecipientsExist: jest.fn(),
  },
}));

describe('CampaignService - Schedule and Send', () => {
  let campaignService: CampaignService;

  beforeEach(() => {
    campaignService = new CampaignService();
    jest.clearAllMocks();
  });

  describe('scheduleCampaign', () => {
    it('should schedule a draft campaign', async () => {
      // Mock getCampaignById to return a draft campaign
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        name: 'Test Campaign',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'draft',
        scheduled_at: null,
        created_by: 'user-123',
        created_at: new Date(),
        updated_at: new Date(),
      }) as any;

      campaignRepository.update = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        scheduled_at: new Date('2026-12-31T10:00:00Z'),
      }) as any;

      campaignRepository.updateStatus = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'scheduled',
      }) as any;

      const scheduledDate = new Date('2026-12-31T10:00:00Z');
      const result = await campaignService.scheduleCampaign(
        'campaign-123',
        scheduledDate,
        'user-123'
      );

      expect(result.status).toBe('scheduled');
      expect(campaignRepository.update).toHaveBeenCalledWith('campaign-123', {
        scheduled_at: scheduledDate,
      });
      expect(campaignRepository.updateStatus).toHaveBeenCalledWith('campaign-123', 'scheduled');
    });

    it('should reject scheduling non-draft campaign', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'sent',
        created_by: 'user-123',
      }) as any;

      const scheduledDate = new Date('2026-12-31T10:00:00Z');

      await expect(
        campaignService.scheduleCampaign('campaign-123', scheduledDate, 'user-123')
      ).rejects.toThrow('Only draft campaigns can be scheduled');
    });

    it('should reject scheduling campaign owned by different user', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'draft',
        created_by: 'different-user-id',
      }) as any;

      const scheduledDate = new Date('2026-12-31T10:00:00Z');

      await expect(
        campaignService.scheduleCampaign('campaign-123', scheduledDate, 'user-123')
      ).rejects.toThrow('You do not have permission to access this campaign');
    });
  });

  describe('sendCampaign', () => {
    it('should send a draft campaign', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        name: 'Test Campaign',
        status: 'draft',
        created_by: 'user-123',
      }) as any;

      campaignRepository.getRecipientCount = jest.fn().mockResolvedValue(5);
      campaignRepository.sendCampaign = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'sent',
      }) as any;

      const result = await campaignService.sendCampaign('campaign-123', 'user-123');

      expect(result).toEqual({
        campaign_id: 'campaign-123',
        queued: true,
        recipient_count: 5,
      });

      expect(campaignRepository.sendCampaign).toHaveBeenCalledWith('campaign-123');
    });

    it('should send a scheduled campaign', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'scheduled',
        created_by: 'user-123',
      }) as any;

      campaignRepository.getRecipientCount = jest.fn().mockResolvedValue(10);
      campaignRepository.sendCampaign = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'sent',
      }) as any;

      const result = await campaignService.sendCampaign('campaign-123', 'user-123');

      expect(result.recipient_count).toBe(10);
      expect(campaignRepository.sendCampaign).toHaveBeenCalled();
    });

    it('should reject sending already sent campaign', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'sent',
        created_by: 'user-123',
      }) as any;

      await expect(
        campaignService.sendCampaign('campaign-123', 'user-123')
      ).rejects.toThrow('Campaign has already been sent');
    });

    it('should reject sending campaign with invalid status', async () => {

      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'invalid-status',
        created_by: 'user-123',
      }) as any;

      await expect(
        campaignService.sendCampaign('campaign-123', 'user-123')
      ).rejects.toThrow('Only draft or scheduled campaigns can be sent');
    });
  });

  describe('State Machine Transitions', () => {
    it('should allow draft → scheduled transition', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'draft',
        created_by: 'user-123',
      }) as any;

      campaignRepository.update = jest.fn().mockResolvedValue({}) as any;
      campaignRepository.updateStatus = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'scheduled',
      }) as any;

      const result = await campaignService.scheduleCampaign(
        'campaign-123',
        new Date('2026-12-31'),
        'user-123'
      );

      expect(result.status).toBe('scheduled');
    });

    it('should allow draft → sent transition', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'draft',
        created_by: 'user-123',
      }) as any;

      campaignRepository.getRecipientCount = jest.fn().mockResolvedValue(1);
      campaignRepository.sendCampaign = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'sent',
      }) as any;

      const result = await campaignService.sendCampaign('campaign-123', 'user-123');

      expect(result).toBeDefined();
      expect(result.queued).toBe(true);
    });

    it('should allow scheduled → sent transition', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'scheduled',
        created_by: 'user-123',
      }) as any;

      campaignRepository.getRecipientCount = jest.fn().mockResolvedValue(1);
      campaignRepository.sendCampaign = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'sent',
      }) as any;

      const result = await campaignService.sendCampaign('campaign-123', 'user-123');

      expect(result).toBeDefined();
    });

    it('should reject sent → any transition', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        status: 'sent',
        created_by: 'user-123',
      }) as any;

      // Try to schedule sent campaign
      await expect(
        campaignService.scheduleCampaign(
          'campaign-123',
          new Date('2026-12-31'),
          'user-123'
        )
      ).rejects.toThrow('Only draft campaigns can be scheduled');

      // Try to send sent campaign
      await expect(
        campaignService.sendCampaign('campaign-123', 'user-123')
      ).rejects.toThrow('Campaign has already been sent');
    });
  });
});
