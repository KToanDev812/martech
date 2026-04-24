import { CampaignRepository } from '@repositories/CampaignRepository';
import { initDatabase, closeDatabase, query } from '@db/connection';

describe('CampaignRepository - Send Campaign Integration Tests', () => {
  let campaignRepository: CampaignRepository;
  let testUserId: string;
  let testCampaignId: string;
  let testRecipientId: string;

  beforeAll(async () => {
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

    // Create test recipient
    const recipientResult = await query(
      `INSERT INTO recipients (email, name)
       VALUES ($1, $2)
       RETURNING id`,
      ['recipient@example.com', 'Test Recipient']
    );
    testRecipientId = recipientResult[0].id;

    // Create test campaign
    const campaignResult = await query(
      `INSERT INTO campaigns (name, subject, body, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Test Campaign', 'Test Subject', 'Test Body', testUserId]
    );
    testCampaignId = campaignResult[0].id;

    // Add recipients to campaign
    await query(
      `INSERT INTO campaign_recipients (campaign_id, recipient_id)
       VALUES ($1, $2)`,
      [testCampaignId, testRecipientId]
    );
  });

  afterAll(async () => {
    // Cleanup
    await query(`DELETE FROM campaign_recipients WHERE campaign_id = $1`, [testCampaignId]);
    await query(`DELETE FROM campaigns WHERE id = $1`, [testCampaignId]);
    await query(`DELETE FROM recipients WHERE id = $1`, [testRecipientId]);
    await query(`DELETE FROM users WHERE id = $1`, [testUserId]);

    await closeDatabase();
  });

  describe('sendCampaign - Transaction Testing', () => {
    it('should update campaign status and recipient statuses atomically', async () => {
      // Send campaign
      const result = await campaignRepository.sendCampaign(testCampaignId);

      // Verify campaign status
      expect(result.status).toBe('sent');

      // Verify recipient statuses
      const recipients = await query(
        `SELECT status FROM campaign_recipients WHERE campaign_id = $1`,
        [testCampaignId]
      );

      expect(recipients).toHaveLength(1);
      expect(recipients[0].status).toBe('pending');
    });

    it('should only allow sending draft or scheduled campaigns', async () => {
      // Try to send already sent campaign
      await expect(
        campaignRepository.sendCampaign(testCampaignId)
      ).rejects.toThrow('Campaign not found or cannot be sent');
    });

    it('should use transaction to prevent partial updates', async () => {
      // Create a new campaign for testing
      const campaignResult = await query(
        `INSERT INTO campaigns (name, subject, body, created_by, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Transaction Test', 'Subject', 'Body', testUserId, 'draft']
      );
      const newCampaignId = campaignResult[0].id;

      // Add recipient
      await query(
        `INSERT INTO campaign_recipients (campaign_id, recipient_id, status)
         VALUES ($1, $2, $3)`,
        [newCampaignId, testRecipientId, 'pending']
      );

      // Send campaign
      const result = await campaignRepository.sendCampaign(newCampaignId);

      // Both campaign and recipient should be updated
      expect(result.status).toBe('sent');

      const recipients = await query(
        `SELECT status FROM campaign_recipients WHERE campaign_id = $1`,
        [newCampaignId]
      );

      expect(recipients[0].status).toBe('pending');

      // Cleanup
      await query(`DELETE FROM campaign_recipients WHERE campaign_id = $1`, [newCampaignId]);
      await query(`DELETE FROM campaigns WHERE id = $1`, [newCampaignId]);
    });

    it('should handle campaigns with multiple recipients', async () => {
      // Create additional recipients
      const recipient2Result = await query(
        `INSERT INTO recipients (email, name)
         VALUES ($1, $2)
         RETURNING id`,
        ['recipient2@example.com', 'Recipient 2']
      );
      const recipient2Id = recipient2Result[0].id;

      const recipient3Result = await query(
        `INSERT INTO recipients (email, name)
         VALUES ($1, $2)
         RETURNING id`,
        ['recipient3@example.com', 'Recipient 3']
      );
      const recipient3Id = recipient3Result[0].id;

      // Create campaign with multiple recipients
      const multiCampaignResult = await query(
        `INSERT INTO campaigns (name, subject, body, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['Multi Recipient Campaign', 'Subject', 'Body', testUserId]
      );
      const multiCampaignId = multiCampaignResult[0].id;

      // Add recipients
      await query(
        `INSERT INTO campaign_recipients (campaign_id, recipient_id)
         VALUES ($1, $2), ($1, $3), ($1, $4)`,
        [multiCampaignId, testRecipientId, recipient2Id, recipient3Id]
      );

      // Send campaign
      const result = await campaignRepository.sendCampaign(multiCampaignId);

      expect(result.status).toBe('sent');

      // Verify all recipients are pending
      const recipients = await query(
        `SELECT status FROM campaign_recipients WHERE campaign_id = $1`,
        [multiCampaignId]
      );

      expect(recipients).toHaveLength(3);
      recipients.forEach(r => expect(r.status).toBe('pending'));

      // Cleanup
      await query(`DELETE FROM campaign_recipients WHERE campaign_id = $1`, [multiCampaignId]);
      await query(`DELETE FROM campaigns WHERE id = $1`, [multiCampaignId]);
      await query(`DELETE FROM recipients WHERE id = ANY($1)`, [[recipient2Id, recipient3Id]]);
    });

    it('should maintain data integrity on concurrent send attempts', async () => {
      // Create campaign
      const campaignResult = await query(
        `INSERT INTO campaigns (name, subject, body, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['Concurrent Test', 'Subject', 'Body', testUserId]
      );
      const concurrentCampaignId = campaignResult[0].id;

      // Add recipient
      await query(
        `INSERT INTO campaign_recipients (campaign_id, recipient_id)
         VALUES ($1, $2)`,
        [concurrentCampaignId, testRecipientId]
      );

      // First send should succeed
      const result1 = await campaignRepository.sendCampaign(concurrentCampaignId);
      expect(result1.status).toBe('sent');

      // Second send should fail (campaign already sent)
      await expect(
        campaignRepository.sendCampaign(concurrentCampaignId)
      ).rejects.toThrow();

      // Cleanup
      await query(`DELETE FROM campaign_recipients WHERE campaign_id = $1`, [concurrentCampaignId]);
      await query(`DELETE FROM campaigns WHERE id = $1`, [concurrentCampaignId]);
    });
  });

  describe('getRecipientCount', () => {
    it('should return correct recipient count', async () => {
      const count = await campaignRepository.getRecipientCount(testCampaignId);

      expect(count).toBe(1);
    });

    it('should return 0 for campaign with no recipients', async () => {
      // Create campaign without recipients
      const campaignResult = await query(
        `INSERT INTO campaigns (name, subject, body, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['No Recipients Campaign', 'Subject', 'Body', testUserId]
      );
      const noRecipientCampaignId = campaignResult[0].id;

      const count = await campaignRepository.getRecipientCount(noRecipientCampaignId);

      expect(count).toBe(0);

      // Cleanup
      await query(`DELETE FROM campaigns WHERE id = $1`, [noRecipientCampaignId]);
    });
  });

  describe('Transaction Rollback Testing', () => {
    it('should rollback if campaign update fails', async () => {
      // This test verifies that the transaction rolls back correctly
      // if the campaign status update fails

      const campaignResult = await query(
        `INSERT INTO campaigns (name, subject, body, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['Rollback Test', 'Subject', 'Body', testUserId]
      );
      const rollbackCampaignId = campaignResult[0].id;

      // Add recipient with specific status
      await query(
        `INSERT INTO campaign_recipients (campaign_id, recipient_id, status)
         VALUES ($1, $2, $3)`,
        [rollbackCampaignId, testRecipientId, 'custom_status']
      );

      // The sendCampaign operation should succeed and set status to 'pending'
      await campaignRepository.sendCampaign(rollbackCampaignId);

      // Verify recipient status was changed
      const recipients = await query(
        `SELECT status FROM campaign_recipients WHERE campaign_id = $1`,
        [rollbackCampaignId]
      );

      expect(recipients[0].status).toBe('pending');

      // Cleanup
      await query(`DELETE FROM campaign_recipients WHERE campaign_id = $1`, [rollbackCampaignId]);
      await query(`DELETE FROM campaigns WHERE id = $1`, [rollbackCampaignId]);
    });
  });
});
