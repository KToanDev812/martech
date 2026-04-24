-- Migration: 004_create_campaign_recipients.sql
-- Description: Create junction table linking campaigns and recipients with tracking
-- Version: 1.0.0
-- Date: 2026-04-24

-- Create campaign_recipients junction table
CREATE TABLE campaign_recipients (
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (campaign_id, recipient_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed')),
    CONSTRAINT opened_after_sent CHECK (
        opened_at IS NULL OR sent_at IS NOT NULL
    )
);

-- Create indexes for campaign_recipients
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);

-- Add comments for documentation
COMMENT ON TABLE campaign_recipients IS 'Junction table linking campaigns to recipients with delivery tracking';
COMMENT ON COLUMN campaign_recipients.campaign_id IS 'Campaign reference (FK)';
COMMENT ON COLUMN campaign_recipients.recipient_id IS 'Recipient reference (FK)';
COMMENT ON COLUMN campaign_recipients.sent_at IS 'When email was sent (UTC)';
COMMENT ON COLUMN campaign_recipients.opened_at IS 'When email was opened (UTC)';
COMMENT ON COLUMN campaign_recipients.status IS 'Delivery status: pending, sent, or failed';
COMMENT ON COLUMN campaign_recipients.created_at IS 'Association creation timestamp (UTC)';

COMMENT ON INDEX idx_campaign_recipients_status IS 'Optimize stats aggregation queries';
