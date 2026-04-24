-- Migration: 003_create_recipients.sql
-- Description: Create recipients table for email contacts
-- Version: 1.0.0
-- Date: 2026-04-24

-- Create recipients table
CREATE TABLE recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Add comments for documentation
COMMENT ON TABLE recipients IS 'Email recipients who can be added to campaigns';
COMMENT ON COLUMN recipients.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN recipients.email IS 'Recipient email address (unique)';
COMMENT ON COLUMN recipients.name IS 'Recipient display name (optional)';
COMMENT ON COLUMN recipients.created_at IS 'Contact creation timestamp (UTC)';
