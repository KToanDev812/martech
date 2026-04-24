import { z } from 'zod';

/**
 * Create campaign validation schema
 */
export const createCampaignSchema = z.object({
  name: z.string()
    .min(3, 'Campaign name must be at least 3 characters')
    .max(255, 'Campaign name must be less than 255 characters'),
  subject: z.string()
    .min(3, 'Subject must be at least 3 characters')
    .max(500, 'Subject must be less than 500 characters'),
  body: z.string()
    .min(10, 'Email body must be at least 10 characters'),
  recipient_ids: z.array(z.string().uuid())
    .min(1, 'At least one recipient is required')
    .max(1000, 'Cannot add more than 1000 recipients at once'),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

/**
 * Update campaign validation schema
 */
export const updateCampaignSchema = z.object({
  name: z.string()
    .min(3, 'Campaign name must be at least 3 characters')
    .max(255, 'Campaign name must be less than 255 characters')
    .optional(),
  subject: z.string()
    .min(3, 'Subject must be at least 3 characters')
    .max(500, 'Subject must be less than 500 characters')
    .optional(),
  body: z.string()
    .min(10, 'Email body must be at least 10 characters')
    .optional(),
  scheduled_at: z.string()
    .datetime()
    .optional(),
  recipient_ids: z.array(z.string().uuid())
    .min(1, 'At least one recipient is required')
    .max(1000, 'Cannot add more than 1000 recipients at once')
    .optional(),
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

/**
 * Schedule campaign validation schema
 */
export const scheduleCampaignSchema = z.object({
  scheduled_at: z.string()
    .datetime()
    .refine((date) => new Date(date) > new Date(), {
      message: 'scheduled_at must be in the future',
    }),
});

export type ScheduleCampaignInput = z.infer<typeof scheduleCampaignSchema>;

/**
 * Campaign query parameters schema
 */
export const campaignQuerySchema = z.object({
  status: z.enum(['draft', 'scheduled', 'sent']).optional(),
  page: z.string().optional().default('1').transform(val => Number(val)),
  limit: z.string().optional().default('20').transform(val => Number(val)),
});

export type CampaignQueryParams = z.infer<typeof campaignQuerySchema>;
