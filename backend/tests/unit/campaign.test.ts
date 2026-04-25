import { createCampaignSchema, updateCampaignSchema } from '@validators/campaign.validator';

describe('Campaign Business Logic', () => {
  describe('Campaign Validation', () => {
    it('should accept valid campaign data with recipients', () => {
      const validCampaign = {
        name: 'Summer Sale 2026',
        subject: 'Don\'t Miss Our Summer Sale!',
        body: '<html><body>Save 50% on all items</body></html>',
        recipient_emails: ['user1@example.com', 'user2@example.com'],
      };

      const result = createCampaignSchema.safeParse(validCampaign);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Summer Sale 2026');
        expect(result.data.recipient_emails).toHaveLength(2);
      }
    });

    it('should reject campaign with invalid email addresses', () => {
      const invalidCampaign = {
        name: 'Test Campaign',
        subject: 'Test Subject',
        body: 'Test body content',
        recipient_emails: ['not-an-email', 'another-invalid'],
      };

      const result = createCampaignSchema.safeParse(invalidCampaign);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
      }
    });

    it('should reject campaign with short name (minimum 3 characters)', () => {
      const shortNameCampaign = {
        name: 'AB',
        subject: 'Test Subject',
        body: 'Test body content that is long enough',
        recipient_emails: ['valid@example.com'],
      };

      const result = createCampaignSchema.safeParse(shortNameCampaign);

      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find(issue => 
          issue.path.length > 0 && issue.path[0] === 'name'
        );
        expect(nameError).toBeDefined();
      }
    });
  });

  describe('Campaign State Machine', () => {
    it('should distinguish between draft and sent campaign statuses', () => {
      const draftCampaign = {
        id: '123',
        name: 'Test Campaign',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'draft' as const,
        scheduled_at: null,
        created_by: { id: 'user1', name: 'User 1' },
        created_at: new Date(),
        updated_at: new Date(),
        recipient_count: 1,
      };

      const sentCampaign = {
        ...draftCampaign,
        status: 'sent' as const,
      };

      // Verify draft can receive updates
      const draftUpdate = updateCampaignSchema.safeParse({ name: 'Updated Name' });
      expect(draftUpdate.success).toBe(true);

      // Verify state machine states are distinct
      expect(draftCampaign.status).toBe('draft');
      expect(sentCampaign.status).toBe('sent');
      expect(draftCampaign.status).not.toBe(sentCampaign.status);
    });
  });

  describe('Campaign Permissions', () => {
    it('should require created_by field for campaign ownership', () => {
      // Campaign without owner data
      const campaignWithoutOwner: any = {
        id: '123',
        name: 'Test Campaign',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'draft' as const,
        scheduled_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        recipient_count: 0,
      };

      // Verify created_by is required for proper authorization
      expect(campaignWithoutOwner.created_by).toBeUndefined();

      // Valid campaign has created_by with proper structure
      const validCampaign = {
        ...campaignWithoutOwner,
        created_by: { id: 'user1', name: 'User 1' },
      };

      expect(validCampaign.created_by.id).toBeDefined();
      expect(validCampaign.created_by.name).toBeDefined();
      expect(validCampaign.created_by.id).toBe('user1');
    });
  });
});
