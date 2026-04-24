import { CampaignRecipientRepository } from '@repositories/CampaignRecipientRepository';
import { initDatabase, closeDatabase, query } from '@db/connection';

describe('CampaignRecipientRepository - Stats Integration Tests', () => {
  let campaignRecipientRepository: CampaignRecipientRepository;
  let testUserId: string;
  let testCampaignId: string;
  let testRecipientIds: string[] = [];

  beforeAll(async () => {
    await initDatabase();
    campaignRecipientRepository = new CampaignRecipientRepository();

    // Create test user
    const userResult = await query(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['test@example.com', 'Test User', 'hashed_password']
    );
    testUserId = userResult[0].id;

    // Create test campaign
    const campaignResult = await query(
      `INSERT INTO campaigns (name, subject, body, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Test Campaign', 'Test Subject', 'Test Body', testUserId]
    );
    testCampaignId = campaignResult[0].id;

    // Create test recipients
    for (let i = 1; i <= 10; i++) {
      const recipientResult = await query(
        `INSERT INTO recipients (email, name)
         VALUES ($1, $2)
         RETURNING id`,
        [`recipient${i}@example.com`, `Recipient ${i}`]
      );
      testRecipientIds.push(recipientResult[0].id);
    }

    // Add recipients to campaign
    const recipientValues = testRecipientIds.map((id, index) => {
      return `($1, $${index + 2})`;
    }).join(', ');

    await query(
      `INSERT INTO campaign_recipients (campaign_id, recipient_id)
       VALUES ${recipientValues}`,
      [testCampaignId, ...testRecipientIds]
    );
  });

  afterAll(async () => {
    // Cleanup
    await query(`DELETE FROM campaign_recipients WHERE campaign_id = $1`, [testCampaignId]);
    await query(`DELETE FROM campaigns WHERE id = $1`, [testCampaignId]);
    await query(`DELETE FROM recipients WHERE id = ANY($1)`, [testRecipientIds]);
    await query(`DELETE FROM users WHERE id = $1`, [testUserId]);

    await closeDatabase();
  });

  describe('getCampaignStats', () => {
    it('should return zero stats for campaign with no activity', async () => {
      const stats = await campaignRecipientRepository.getCampaignStats(testCampaignId);

      expect(stats).toEqual({
        total: 10,
        sent: 0,
        failed: 0,
        opened: 0,
      });
    });

    it('should calculate stats correctly after partial sends', async () => {
      // Mark 3 recipients as sent
      await query(
        `UPDATE campaign_recipients
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP
         WHERE campaign_id = $1 AND recipient_id = ANY($2)`,
        [testCampaignId, testRecipientIds.slice(0, 3)]
      );

      // Mark 1 recipient as opened
      await query(
        `UPDATE campaign_recipients
         SET opened_at = CURRENT_TIMESTAMP
         WHERE campaign_id = $1 AND recipient_id = $2`,
        [testCampaignId, testRecipientIds[0]]
      );

      const stats = await campaignRecipientRepository.getCampaignStats(testCampaignId);

      expect(stats.total).toBe(10);
      expect(stats.sent).toBe(3);
      expect(stats.failed).toBe(0);
      expect(stats.opened).toBe(1);
    });

    it('should handle failed sends correctly', async () => {
      // Mark some as sent, some as failed
      await query(
        `UPDATE campaign_recipients
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP
         WHERE campaign_id = $1 AND recipient_id = ANY($2)`,
        [testCampaignId, testRecipientIds.slice(0, 5)]
      );

      await query(
        `UPDATE campaign_recipients
         SET status = 'failed'
         WHERE campaign_id = $1 AND recipient_id = ANY($2)`,
        [testCampaignId, testRecipientIds.slice(5, 7)]
      );

      const stats = await campaignRecipientRepository.getCampaignStats(testCampaignId);

      expect(stats.total).toBe(10);
      expect(stats.sent).toBe(5);
      expect(stats.failed).toBe(2);
    });

    it('should count opens correctly with multiple opens', async () => {
      // Send all emails
      await query(
        `UPDATE campaign_recipients
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP
         WHERE campaign_id = $1`,
        [testCampaignId]
      );

      // Mark some as opened
      await query(
        `UPDATE campaign_recipients
         SET opened_at = CURRENT_TIMESTAMP
         WHERE campaign_id = $1 AND recipient_id = ANY($2)`,
        [testCampaignId, testRecipientIds.slice(0, 4)]
      );

      const stats = await campaignRecipientRepository.getCampaignStats(testCampaignId);

      expect(stats.total).toBe(10);
      expect(stats.sent).toBe(10);
      expect(stats.opened).toBe(4);
    });

    it('should return zero for non-existent campaign', async () => {
      const stats = await campaignRecipientRepository.getCampaignStats('non-existent-id');

      expect(stats).toEqual({
        total: 0,
        sent: 0,
        failed: 0,
        opened: 0,
      });
    });
  });

  describe('getStatusBreakdown', () => {
    it('should return status breakdown', async () => {
      // Set different statuses
      await query(
        `UPDATE campaign_recipients
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP
         WHERE campaign_id = $1 AND recipient_id = ANY($2)`,
        [testCampaignId, testRecipientIds.slice(0, 5)]
      );

      await query(
        `UPDATE campaign_recipients
         SET status = 'failed'
         WHERE campaign_id = $1 AND recipient_id = ANY($2)`,
        [testCampaignId, testRecipientIds.slice(5, 7)]
      );

      const breakdown = await campaignRecipientRepository.getStatusBreakdown(testCampaignId);

      expect(breakdown).toEqual({
        pending: 3,
        sent: 5,
        failed: 2,
      });
    });
  });

  describe('updateRecipientStatus', () => {
    it('should update recipient to sent status', async () => {
      await campaignRecipientRepository.updateRecipientStatus(
        testCampaignId,
        testRecipientIds[0],
        'sent'
      );

      const result = await query(
        `SELECT status, sent_at FROM campaign_recipients
         WHERE campaign_id = $1 AND recipient_id = $2`,
        [testCampaignId, testRecipientIds[0]]
      );

      expect(result[0].status).toBe('sent');
      expect(result[0].sent_at).not.toBeNull();
    });

    it('should update recipient to failed status', async () => {
      await campaignRecipientRepository.updateRecipientStatus(
        testCampaignId,
        testRecipientIds[1],
        'failed'
      );

      const result = await query(
        `SELECT status FROM campaign_recipients
         WHERE campaign_id = $1 AND recipient_id = $2`,
        [testCampaignId, testRecipientIds[1]]
      );

      expect(result[0].status).toBe('failed');
    });
  });

  describe('markAsOpened', () => {
    it('should mark recipient as opened', async () => {
      // First mark as sent
      await campaignRecipientRepository.updateRecipientStatus(
        testCampaignId,
        testRecipientIds[2],
        'sent'
      );

      // Then mark as opened
      await campaignRecipientRepository.markAsOpened(
        testCampaignId,
        testRecipientIds[2]
      );

      const result = await query(
        `SELECT opened_at FROM campaign_recipients
         WHERE campaign_id = $1 AND recipient_id = $2`,
        [testCampaignId, testRecipientIds[2]]
      );

      expect(result[0].opened_at).not.toBeNull();
    });

    it('should be idempotent (not update if already opened)', async () => {
      // Mark as sent
      await campaignRecipientRepository.updateRecipientStatus(
        testCampaignId,
        testRecipientIds[3],
        'sent'
      );

      // First open
      const firstOpen = await query(
        `SELECT opened_at FROM campaign_recipients
         WHERE campaign_id = $1 AND recipient_id = $2`,
        [testCampaignId, testRecipientIds[3]]
      );
      const firstOpenedAt = firstOpen[0].opened_at;

      // Wait a bit and try to open again
      await new Promise(resolve => setTimeout(resolve, 10));

      await campaignRecipientRepository.markAsOpened(
        testCampaignId,
        testRecipientIds[3]
      );

      const secondOpen = await query(
        `SELECT opened_at FROM campaign_recipients
         WHERE campaign_id = $1 AND recipient_id = $2`,
        [testCampaignId, testRecipientIds[3]]
      );
      const secondOpenedAt = secondOpen[0].opened_at;

      // Should not update opened_at
      expect(secondOpenedAt).toEqual(firstOpenedAt);
    });
  });
});
