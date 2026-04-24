-- Migration: 001_create_users.sql
-- Description: Create users table with authentication fields
-- Version: 1.0.0
-- Date: 2026-04-24

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Add comment for documentation
COMMENT ON TABLE users IS 'Users table storing account information and credentials';
COMMENT ON COLUMN users.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
COMMENT ON COLUMN users.name IS 'User display name';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash of user password';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp (UTC)';
