-- Migration: 002_create_campaigns.sql
-- Description: Create campaigns table with state management
-- Version: 1.0.0
-- Date: 2026-04-24

-- Create campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'sent')),
    CONSTRAINT scheduled_at_future CHECK (
        scheduled_at IS NULL OR scheduled_at > CURRENT_TIMESTAMP
    ),
    CONSTRAINT draft_can_be_scheduled CHECK (
        status = 'scheduled' OR scheduled_at IS NULL
    )
);

-- Create indexes for campaigns
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at);

-- Add comments for documentation
COMMENT ON TABLE campaigns IS 'Email campaigns with content and scheduling information';
COMMENT ON COLUMN campaigns.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN campaigns.name IS 'Campaign display name';
COMMENT ON COLUMN campaigns.subject IS 'Email subject line';
COMMENT ON COLUMN campaigns.body IS 'HTML email body content';
COMMENT ON COLUMN campaigns.status IS 'Campaign status: draft, scheduled, or sent';
COMMENT ON COLUMN campaigns.scheduled_at IS 'When to send the campaign (UTC)';
COMMENT ON COLUMN campaigns.created_by IS 'User who created the campaign (FK)';
COMMENT ON COLUMN campaigns.created_at IS 'Creation timestamp (UTC)';
COMMENT ON COLUMN campaigns.updated_at IS 'Last update timestamp (UTC)';

COMMENT ON INDEX idx_campaigns_created_by IS 'Optimize queries filtering campaigns by user';
COMMENT ON INDEX idx_campaigns_status IS 'Optimize queries filtering campaigns by status';
COMMENT ON INDEX idx_campaigns_scheduled_at IS 'Optimize scheduled campaign worker queries';
