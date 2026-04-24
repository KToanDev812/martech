-- Migration: XXX_description.sql
-- Description: Brief description of what this migration does
-- Version: 1.0.0
-- Date: YYYY-MM-DD
-- Author: Your Name

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. Use UUIDs for all primary keys
-- 2. Use TIMESTAMP WITH TIME ZONE for all timestamps (UTC)
-- 3. Add CHECK constraints for business rules
-- 4. Create appropriate indexes for query optimization
-- 5. Add comments for documentation
-- 6. Consider rollback procedures
-- ============================================================================

-- Example: Creating a new table
/*
CREATE TABLE example_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create indexes
CREATE INDEX idx_example_table_name ON example_table(name);

-- Add comments
COMMENT ON TABLE example_table IS 'Description of what this table stores';
COMMENT ON COLUMN example_table.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN example_table.name IS 'Name or description';
*/

-- Example: Adding a column to existing table
/*
ALTER TABLE target_table ADD COLUMN new_column VARCHAR(255);

-- Add constraint
ALTER TABLE target_table ADD CONSTRAINT new_column_constraint
    CHECK (new_column IS NOT NULL);

-- Add comment
COMMENT ON COLUMN target_table.new_column IS 'Description of new column';
*/

-- Example: Creating an index
/*
CREATE INDEX idx_table_column ON table_name(column_name);

-- Add comment
COMMENT ON INDEX idx_table_column IS 'Purpose of this index';
*/

-- Example: Rollback instructions
/*
-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_table_column;
-- ALTER TABLE target_table DROP COLUMN IF EXISTS new_column;
-- DROP TABLE IF EXISTS example_table CASCADE;
*/
