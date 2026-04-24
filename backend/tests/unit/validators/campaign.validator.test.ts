import { createCampaignSchema, updateCampaignSchema, scheduleCampaignSchema } from '@validators/campaign.validator';

describe('Campaign Validators', () => {
  describe('createCampaignSchema', () => {
    const validData = {
      name: 'Spring Sale',
      subject: '50% Off Everything!',
      body: '<html><body>Don\'t miss our spring sale!</body></html>',
      recipient_ids: ['uuid-1', 'uuid-2'],
    };

    it('should validate correct campaign data', () => {
      const result = createCampaignSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = { ...validData, name: '' };
      const result = createCampaignSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short name', () => {
      const invalidData = { ...validData, name: 'ab' };
      const result = createCampaignSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty subject', () => {
      const invalidData = { ...validData, subject: '' };
      const result = createCampaignSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short body', () => {
      const invalidData = { ...validData, body: 'short' };
      const result = createCampaignSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty recipient list', () => {
      const invalidData = { ...validData, recipient_ids: [] };
      const result = createCampaignSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID in recipient_ids', () => {
      const invalidData = { ...validData, recipient_ids: ['not-a-uuid'] };
      const result = createCampaignSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject too many recipients', () => {
      const invalidData = {
        ...validData,
        recipient_ids: Array.from({ length: 1001 }, (_, i) => `uuid-${i}`),
      };
      const result = createCampaignSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('scheduleCampaignSchema', () => {
    it('should validate future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const result = scheduleCampaignSchema.safeParse({
        scheduled_at: futureDate.toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it('should reject past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = scheduleCampaignSchema.safeParse({
        scheduled_at: pastDate.toISOString(),
      });

      expect(result.success).toBe(false);
    });

    it('should reject current time', () => {
      const result = scheduleCampaignSchema.safeParse({
        scheduled_at: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updateCampaignSchema', () => {
    it('should validate partial update data', () => {
      const result = updateCampaignSchema.safeParse({
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
    });

    it('should validate all fields optional', () => {
      const result = updateCampaignSchema.safeParse({});

      expect(result.success).toBe(true);
    });
  });
});
