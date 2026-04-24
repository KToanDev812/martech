import { CampaignService } from '@services/CampaignService';
import { campaignRepository } from '@repositories/CampaignRepository';
import { campaignRecipientRepository } from '@repositories/CampaignRecipientRepository';

// Mock dependencies
jest.mock('@repositories/CampaignRepository', () => ({
  CampaignRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
  })),
  campaignRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('@repositories/CampaignRecipientRepository', () => ({
  CampaignRecipientRepository: jest.fn().mockImplementation(() => ({
    getCampaignStats: jest.fn(),
  })),
  campaignRecipientRepository: {
    getCampaignStats: jest.fn(),
  },
}));

describe('CampaignService - getCampaignStats', () => {
  let campaignService: CampaignService;

  beforeEach(() => {
    campaignService = new CampaignService();
    jest.clearAllMocks();
  });

  describe('getCampaignStats', () => {
    it('should calculate stats for campaign with no sends', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        name: 'Test Campaign',
        status: 'sent',
        created_by: 'user-123',
      }) as any;

      // Mock stats
      campaignRecipientRepository.getCampaignStats = jest.fn().mockResolvedValue({
        total: 100,
        sent: 0,
        failed: 0,
        opened: 0,
      }) as any;

      const stats = await campaignService.getCampaignStats('campaign-123', 'user-123');

      expect(stats).toEqual({
        total: 100,
        sent: 0,
        failed: 0,
        opened: 0,
        open_rate: 0,
        send_rate: 0,
      });
    });

    it('should calculate open_rate correctly', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        created_by: 'user-123',
      }) as any;

      campaignRecipientRepository.getCampaignStats = jest.fn().mockResolvedValue({
        total: 100,
        sent: 90,
        failed: 10,
        opened: 60,
      }) as any;

      const stats = await campaignService.getCampaignStats('campaign-123', 'user-123');

      // open_rate = 60 / 90 = 0.667
      expect(stats.open_rate).toBeCloseTo(0.667, 3);
      expect(stats.send_rate).toBeCloseTo(0.9, 3); // 90 / 100
    });

    it('should handle zero sent without division by zero', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        created_by: 'user-123',
      }) as any;

      campaignRecipientRepository.getCampaignStats = jest.fn().mockResolvedValue({
        total: 10,
        sent: 0,
        failed: 0,
        opened: 0,
      }) as any;

      const stats = await campaignService.getCampaignStats('campaign-123', 'user-123');

      expect(stats.open_rate).toBe(0);
      expect(stats.send_rate).toBe(0);
    });

    it('should handle zero total without division by zero', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        created_by: 'user-123',
      }) as any;

      campaignRecipientRepository.getCampaignStats = jest.fn().mockResolvedValue({
        total: 0,
        sent: 0,
        failed: 0,
        opened: 0,
      }) as any;

      const stats = await campaignService.getCampaignStats('campaign-123', 'user-123');

      expect(stats.open_rate).toBe(0);
      expect(stats.send_rate).toBe(0);
    });

    it('should return 100% send_rate when all sent', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        created_by: 'user-123',
      }) as any;

      campaignRecipientRepository.getCampaignStats = jest.fn().mockResolvedValue({
        total: 50,
        sent: 50,
        failed: 0,
        opened: 25,
      }) as any;

      const stats = await campaignService.getCampaignStats('campaign-123', 'user-123');

      expect(stats.send_rate).toBe(1.0);
      expect(stats.open_rate).toBe(0.5); // 25 / 50
    });

    it('should round rates to 3 decimal places', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        created_by: 'user-123',
      }) as any;

      // Use numbers that result in repeating decimals
      campaignRecipientRepository.getCampaignStats = jest.fn().mockResolvedValue({
        total: 7,
        sent: 5,
        failed: 2,
        opened: 3,
      }) as any;

      const stats = await campaignService.getCampaignStats('campaign-123', 'user-123');

      // 3 / 5 = 0.6
      expect(stats.open_rate).toBe(0.6);
      // 5 / 7 = 0.7142857... -> 0.714
      expect(stats.send_rate).toBeCloseTo(0.714, 3);
    });

    it('should verify user owns campaign', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        created_by: 'different-user-id',
      }) as any;

      await expect(
        campaignService.getCampaignStats('campaign-123', 'user-123')
      ).rejects.toThrow('You do not have permission to access this campaign');
    });

    it('should handle campaign with all failures', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        created_by: 'user-123',
      }) as any;

      campaignRecipientRepository.getCampaignStats = jest.fn().mockResolvedValue({
        total: 100,
        sent: 0,
        failed: 100,
        opened: 0,
      }) as any;

      const stats = await campaignService.getCampaignStats('campaign-123', 'user-123');

      expect(stats.send_rate).toBe(0);
      expect(stats.failed).toBe(100);
      expect(stats.sent).toBe(0);
    });

    it('should handle campaign with mixed results', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        created_by: 'user-123',
      }) as any;

      campaignRecipientRepository.getCampaignStats = jest.fn().mockResolvedValue({
        total: 1000,
        sent: 900,
        failed: 50,
        opened: 450,
      }) as any;

      const stats = await campaignService.getCampaignStats('campaign-123', 'user-123');

      expect(stats.total).toBe(1000);
      expect(stats.sent).toBe(900);
      expect(stats.failed).toBe(50);
      expect(stats.opened).toBe(450);
      expect(stats.send_rate).toBe(0.9); // 900 / 1000
      expect(stats.open_rate).toBeCloseTo(0.5, 3); // 450 / 900 = 0.5
    });
  });

  describe('Stats Calculation Edge Cases', () => {
    it('should handle campaign with pending recipients only', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        created_by: 'user-123',
      }) as any;

      campaignRecipientRepository.getCampaignStats = jest.fn().mockResolvedValue({
        total: 25,
        sent: 0,
        failed: 0,
        opened: 0,
      }) as any;

      const stats = await campaignService.getCampaignStats('campaign-123', 'user-123');

      expect(stats.send_rate).toBe(0);
      expect(stats.open_rate).toBe(0);
    });

    it('should handle campaign where opens > sends (edge case)', async () => {
      campaignRepository.findById = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        created_by: 'user-123',
      }) as any;

      // This shouldn't happen with proper DB constraints, but service should handle it
      campaignRecipientRepository.getCampaignStats = jest.fn().mockResolvedValue({
        total: 100,
        sent: 50,
        failed: 50,
        opened: 60, // More opens than sends (data issue)
      }) as any;

      const stats = await campaignService.getCampaignStats('campaign-123', 'user-123');

      // open_rate = 60 / 50 = 1.2 (more than 100%)
      expect(stats.open_rate).toBeGreaterThan(1);
    });
  });
});
