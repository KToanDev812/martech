import { CampaignRepository } from '@repositories/CampaignRepository';
import { initDatabase, closeDatabase, query } from '@db/connection';

describe('CampaignRepository Integration Tests', () => {
  let campaignRepository: CampaignRepository;
  let testUserId: string;
  let testCampaignIds: string[] = [];

  beforeAll(async () => {
    // Initialize database connection
    await initDatabase();
    campaignRepository = new CampaignRepository();

    // Create test user
    const userResult = await query(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['test@example.com', 'Test User', 'hashed_password']
    );
    testUserId = userResult[0].id;

    // Create test campaigns
    for (let i = 1; i <= 5; i++) {
      const campaignResult = await query(
        `INSERT INTO campaigns (name, subject, body, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [`Campaign ${i}`, `Subject ${i}`, `Body ${i}`, testUserId]
      );
      testCampaignIds.push(campaignResult[0].id);
    }

    // Add some recipients to first campaign
    const recipientResult = await query(
      `INSERT INTO recipients (email, name)
       VALUES ($1, $2)
       RETURNING id`,
      ['recipient@example.com', 'Test Recipient']
    );

    await query(
      `INSERT INTO campaign_recipients (campaign_id, recipient_id)
       VALUES ($1, $2)`,
      [testCampaignIds[0], recipientResult[0].id]
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await query(`DELETE FROM campaign_recipients WHERE campaign_id = ANY($1)`, [testCampaignIds]);
    await query(`DELETE FROM campaigns WHERE id = ANY($1)`, [testCampaignIds]);
    await query(`DELETE FROM recipients WHERE email = $1`, ['recipient@example.com']);
    await query(`DELETE FROM users WHERE id = $1`, [testUserId]);

    await closeDatabase();
  });

  describe('findByUserId', () => {
    it('should return campaigns for user with pagination', async () => {
      const campaigns = await campaignRepository.findByUserId(testUserId, 2, 0);

      expect(campaigns).toHaveLength(2);
      expect(campaigns[0]).toHaveProperty('id');
      expect(campaigns[0]).toHaveProperty('name');
      expect(campaigns[0]).toHaveProperty('recipient_count');
    });

    it('should return campaigns in reverse chronological order', async () => {
      const campaigns = await campaignRepository.findByUserId(testUserId, 5, 0);

      expect(campaigns.length).toBeGreaterThan(0);
      // Campaigns should be ordered by created_at DESC
      for (let i = 0; i < campaigns.length - 1; i++) {
        const current = new Date(campaigns[i].created_at);
        const next = new Date(campaigns[i + 1].created_at);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('should include recipient count', async () => {
      const campaigns = await campaignRepository.findByUserId(testUserId, 5, 0);

      const campaignWithRecipients = campaigns.find(c => c.id === testCampaignIds[0]);
      expect(campaignWithRecipients).toBeDefined();
      expect(campaignWithRecipients?.recipient_count).toBe(1);
    });

    it('should respect pagination limit', async () => {
      const campaigns = await campaignRepository.findByUserId(testUserId, 2, 0);

      expect(campaigns).toHaveLength(2);
    });

    it('should respect pagination offset', async () => {
      const firstPage = await campaignRepository.findByUserId(testUserId, 2, 0);
      const secondPage = await campaignRepository.findByUserId(testUserId, 2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
  });

  describe('countByUserId', () => {
    it('should return total count of campaigns for user', async () => {
      const count = await campaignRepository.countByUserId(testUserId);

      expect(count).toBe(5);
    });

    it('should return zero count for non-existent user', async () => {
      const count = await campaignRepository.countByUserId('non-existent-user-id');

      expect(count).toBe(0);
    });

    it('should filter by status', async () => {
      // First, update one campaign to scheduled status
      await query(
        `UPDATE campaigns SET status = 'scheduled' WHERE id = $1`,
        [testCampaignIds[0]]
      );

      const draftCount = await campaignRepository.countByUserId(testUserId, 'draft');
      const scheduledCount = await campaignRepository.countByUserId(testUserId, 'scheduled');
      const totalCount = await campaignRepository.countByUserId(testUserId);

      expect(draftCount).toBe(4);
      expect(scheduledCount).toBe(1);
      expect(totalCount).toBe(5);
    });
  });

  describe('findById', () => {
    it('should return campaign by id', async () => {
      const campaign = await campaignRepository.findById(testCampaignIds[0]);

      expect(campaign).toBeDefined();
      expect(campaign?.id).toBe(testCampaignIds[0]);
      expect(campaign?.name).toBe('Campaign 1');
    });

    it('should return null for non-existent campaign', async () => {
      const campaign = await campaignRepository.findById('non-existent-id');

      expect(campaign).toBeNull();
    });
  });

  describe('update', () => {
    it('should update campaign fields', async () => {
      const updated = await campaignRepository.update(testCampaignIds[0], {
        name: 'Updated Campaign Name',
        subject: 'Updated Subject',
      });

      expect(updated.name).toBe('Updated Campaign Name');
      expect(updated.subject).toBe('Updated Subject');
    });

    it('should update updated_at timestamp', async () => {
      const beforeUpdate = await campaignRepository.findById(testCampaignIds[0]);
      const oldUpdatedAt = new Date(beforeUpdate!.updated_at);

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await campaignRepository.update(testCampaignIds[0], {
        name: 'Another Update',
      });

      const afterUpdate = await campaignRepository.findById(testCampaignIds[0]);
      const newUpdatedAt = new Date(afterUpdate!.updated_at);

      expect(newUpdatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });
  });

  describe('updateStatus', () => {
    it('should update campaign status', async () => {
      const campaign = await campaignRepository.updateStatus(testCampaignIds[1], 'scheduled');

      expect(campaign.status).toBe('scheduled');
    });

    it('should throw error for non-existent campaign', async () => {
      await expect(
        campaignRepository.updateStatus('non-existent-id', 'sent')
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete campaign', async () => {
      // Create a campaign to delete
      const result = await query(
        `INSERT INTO campaigns (name, subject, body, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['To Delete', 'Subject', 'Body', testUserId]
      );

      const campaignId = result[0].id;

      await campaignRepository.delete(campaignId);

      const deleted = await campaignRepository.findById(campaignId);
      expect(deleted).toBeNull();
    });
  });
});
