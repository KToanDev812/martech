# Database Migrations

This directory contains SQL migrations for the email campaign backend system.

## Migration Files

Migrations are numbered and named in the order they should be executed:

1. `001_create_users.sql` - Create users table with authentication
2. `002_create_campaigns.sql` - Create campaigns table with state management
3. `003_create_recipients.sql` - Create recipients table for email contacts
4. `004_create_campaign_recipients.sql` - Create junction table with tracking

## Running Migrations

### Using psql (PostgreSQL CLI)

```bash
# Run all migrations
psql -U username -d database_name -f migrations/001_create_users.sql
psql -U username -d database_name -f migrations/002_create_campaigns.sql
psql -U username -d database_name -f migrations/003_create_recipients.sql
psql -U username -d database_name -f migrations/004_create_campaign_recipients.sql

# Or run all at once
psql -U username -d database_name -f migrations/*.sql
```

### Using Node.js (Future Implementation)

When implementing the backend, you can use migration tools like:
- `node-pg-migrate`
- `db-migrate`
- `knex` migrations

Example with node-pg-migrate:
```bash
npm install pg node-pg-migrate
npx node-pg-migrate up
```

## Rolling Back

To rollback migrations, you'll need to manually drop tables in reverse order:

```sql
-- Rollback in reverse order
DROP TABLE IF EXISTS campaign_recipients CASCADE;
DROP TABLE IF EXISTS recipients CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

## Schema Overview

### Tables

**users**
- Stores user accounts and authentication credentials
- Password hashing with bcrypt (handled in application layer)
- Email format validation at database level

**campaigns**
- Stores email campaign content and scheduling
- State machine: draft → scheduled → sent
- Enforces business rules via CHECK constraints
- Foreign key to users (cannot delete user with campaigns)

**recipients**
- Stores email contacts
- Can be reused across multiple campaigns
- Email format validation at database level

**campaign_recipients**
- Junction table linking campaigns to recipients
- Tracks delivery status (pending, sent, failed)
- Tracks engagement (opened_at)
- Prevents duplicate recipients per campaign
- Cascades deletions when campaigns or recipients are deleted

## Indexes

All indexes are created as part of the migrations:

- `idx_campaigns_created_by` - Optimize user campaign queries
- `idx_campaigns_status` - Optimize status filtering
- `idx_campaigns_scheduled_at` - Optimize scheduled worker queries
- `idx_campaign_recipients_status` - Optimize stats aggregation

## Constraints

### CHECK Constraints
- Email format validation (users, recipients)
- Campaign status enum (draft, scheduled, sent)
- Scheduled date must be in future
- Campaign recipient status enum (pending, sent, failed)
- Opened timestamp requires sent timestamp

### Foreign Keys
- campaigns.created_by → users.id (ON DELETE RESTRICT)
- campaign_recipients.campaign_id → campaigns.id (ON DELETE CASCADE)
- campaign_recipients.recipient_id → recipients.id (ON DELETE CASCADE)

## Important Notes

1. **UUIDs**: All primary keys use UUIDs for distributed system compatibility
2. **Timestamps**: All timestamps use TIMESTAMP WITH TIME ZONE (stored in UTC)
3. **Cascade Rules**:
   - Deleting a user is BLOCKED if they have campaigns (RESTRICT)
   - Deleting a campaign removes all recipient associations (CASCADE)
   - Deleting a recipient removes all campaign associations (CASCADE)
4. **No ORM**: These are raw SQL migrations - no ORM dependencies
5. **Order Matters**: Migrations must be run in numerical order

## Database Requirements

- PostgreSQL 12+ (for UUID generation and CHECK constraints)
- UUID extension should be available (usually installed by default)

To enable UUID extension if needed:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Validation

After running migrations, verify the schema:

```sql
-- List all tables
\dt

-- Describe users table
\d users

-- Describe campaigns table
\d campaigns

-- List all indexes
\di

-- List all constraints
SELECT * FROM information_schema.table_constraints
WHERE table_schema = 'public';
```

## Next Steps

After migrations are complete:

1. Create database connection configuration
2. Implement repository layer with raw SQL queries
3. Add migration runner to application startup
4. Create rollback procedures for production deployments
