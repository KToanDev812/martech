# Email Campaign Backend - Complete Design Document

## Table of Contents
1. [Context](#context)
2. [Architectural Decisions (Immutable)](#architectural-decisions-immutable)
3. [Environment Configuration](#environment-configuration)
4. [Database Schema](#database-schema)
5. [Indexing Strategy](#indexing-strategy)
6. [Data Relationships](#data-relationships)
7. [State Machine](#state-machine)
8. [API Contract Design](#api-contract-design)
9. [Critical Query Design](#critical-query-design)
10. [Business Rule Enforcement](#business-rule-enforcement)
11. [Edge Cases](#edge-cases)
12. [Folder Structure Mapping](#folder-structure-mapping)
13. [Testing Strategy](#testing-strategy)

---

## Context

This document outlines the complete design for a production-ready email campaign management backend service. The system allows users to create, schedule, and send email campaigns to recipients, with tracking for delivery and engagement metrics.

**Tech Stack:**
- Node.js (Express)
- PostgreSQL (raw SQL or lightweight query builder, NO heavy ORM)
- JWT authentication
- Input validation (zod)

---

## Architectural Decisions (Immutable)

⚠️ **These decisions are FOUNDATIONAL and MUST NOT CHANGE during implementation.** Changing any of these will break the architectural integrity of the system.

### 1. Database Architecture (CRITICAL)

**Schema Decisions:**
- **UUIDs for ALL primary keys** (not auto-increment integers)
- **TIMESTAMP WITH TIME ZONE** for all timestamps (stored in UTC)
- **CHECK constraints at DB level** for business rules (not just app layer)
- **ON DELETE RESTRICT** for users → campaigns relationship
- **ON DELETE CASCADE** for campaigns/recipients → junction table

**Why Immutable?**
- Changing UUIDs → integers requires rewriting all foreign keys and APIs
- Removing CHECK constraints moves validation to app layer (single point of failure)
- Changing cascade behavior breaks data integrity guarantees

### 2. State Machine (CRITICAL)

**Campaign Status Lifecycle:**
```
draft → scheduled → sent
  ↑         ↓
  └─────────┘
```

**Valid transitions ONLY:**
1. `draft → scheduled` (via POST /schedule)
2. `draft → sent` (via POST /send)
3. `scheduled → sent` (via worker or POST /send)
4. `scheduled → draft` (via PATCH with empty recipient_ids)

**Immutable rule:** `sent` is a TERMINAL state. No transitions out of sent.

**Why Immutable?**
- State machine is core to campaign lifecycle
- API endpoints depend on these transitions
- Tests are written against this model
- Frontend will be built assuming these states

### 3. Layered Architecture (CRITICAL)

**Strict Separation of Concerns:**
```
Controllers (HTTP layer)
    ↓
Services (Business logic)
    ↓
Repositories (Data access)
    ↓
Database (PostgreSQL)
```

**Rules:**
- Controllers: Handle HTTP only (parse req, call service, format response)
- Services: Business logic, state transitions, validation rules
- Repositories: SQL queries, connection management
- **NO logic crossing boundaries**

**Why Immutable?**
- Mixing layers creates unmaintainable spaghetti code
- Services calling HTTP makes testing impossible
- Repositories with business logic couples data to implementation
- Violating this breaks testability and reusability

### 4. API Contract (CRITICAL)

**Standard Response Format:**
```typescript
// Success
{ success: true, data: <resource> }

// Error
{ success: false, error: { code, message, details? } }
```

**All Endpoints Follow This Pattern:**
- Consistent response shape
- No exceptions (no mixed return types)
- Error codes are strings, not numbers

**Why Immutable?**
- Frontend depends on predictable response shapes
- Changing this breaks ALL API consumers
- Inconsistent responses cause integration bugs

### 5. Transaction Strategy (CRITICAL)

**Send Operation MUST Use Transaction:**
```sql
BEGIN;
  UPDATE campaigns SET status = 'sent' WHERE id = $1;
  UPDATE campaign_recipients SET status = 'pending' WHERE campaign_id = $1;
  -- Insert to outbox table
COMMIT;
```

**Immutable rules:**
- Campaign status AND recipients must update atomically
- If email send fails, DB rolls back
- No partial state (e.g., status=sent but recipients not initialized)

**Why Immutable?**
- Non-atomic sends create data corruption
- Partial states break stats calculations
- Race conditions cause double-sends without locks

### 6. Stats Calculation (CRITICAL)

**Formulae (Immutable):**
```typescript
open_rate = sent > 0 ? opened / sent : 0
send_rate = total > 0 ? sent / total : 0
```

**Rules:**
- Division by zero MUST return 0 (not NaN or Infinity)
- Application layer calculates rates (not DB)
- Single SQL query for raw counts (not N+1 queries)

**Why Immutable?**
- Frontend displays these exact metrics
- Changing formula breaks reporting and analytics
- Division by zero crashes API without protection

### 7. Authentication Strategy (CRITICAL)

**JWT-Based Auth:**
- JWT stored in HTTP-only cookies (not localStorage)
- Access token expires in 7 days
- Refresh token expires in 30 days
- Password hashed with bcrypt (not plaintext)

**Immutable rules:**
- No session storage (stateless JWT)
- No password in response (ever)
- All protected routes require valid JWT

**Why Immutable?**
- Changing to sessions requires database schema changes
- Removing JWT expiration creates security vulnerability
- Exposing passwords in response is a security breach

### 8. Business Rule Enforcement (CRITICAL)

**Enforcement Hierarchy (Immutable Order):**
1. **Database (Primary)** - CHECK constraints, foreign keys
2. **Validators (Secondary)** - Zod schemas on input
3. **Service Layer (Tertiary)** - State transition logic
4. **API Layer (Last)** - HTTP status codes and messages

**Example: scheduled_at validation:**
```sql
-- DB Level (primary)
CONSTRAINT scheduled_at_future CHECK (
  scheduled_at IS NULL OR scheduled_at > CURRENT_TIMESTAMP
)

-- Validator Level (secondary)
z.string().datetime().refine(date => new Date(date) > new Date())

-- Service Level (tertiary)
if (scheduledAt <= new Date()) throw new InvalidScheduleError()
```

**Why Immutable?**
- Single enforcement layer is insufficient (defense in depth)
- Removing DB level allows direct SQL manipulation to bypass rules
- Removing validator allows bad data to reach service layer

### 9. Folder Structure (CRITICAL)

**Immutable Structure:**
```
/backend/src
  /controllers     # HTTP layer
  /services        # Business logic
  /repositories    # Data access
  /routes          # Route definitions
  /middlewares     # Cross-cutting concerns
  /validators      # Zod schemas
  /db              # Connection and SQL files
```

**Rules:**
- No logic in routes (just middleware mounting)
- No SQL in controllers (use repositories)
- No HTTP in services (keep layer-pure)
- Raw SQL files in `/db/queries/` (not in TypeScript)

**Why Immutable?**
- Moving files breaks import paths
- Mixing responsibilities defeats purpose of layers
- Violating structure makes codebase unmaintainable

### 10. Error Handling (CRITICAL)

**HTTP Status Codes (Immutable):**
- `400` - Validation error (bad input)
- `401` - Authentication failed (no/invalid JWT)
- `403` - Authorization failed (valid JWT, wrong permissions)
- `404` - Resource not found
- `409` - State conflict (e.g., edit sent campaign)
- `500` - Server error (unexpected)

**Rules:**
- Never use 200 for errors
- Never use 400 for auth failures
- 409 specifically for state machine violations

**Why Immutable?**
- Frontend error handling depends on these codes
- Wrong codes cause incorrect user-facing messages
- Inconsistent codes confuse API consumers

### 11. Query Strategy (CRITICAL)

**Stats Query (Immutable):**
```sql
SELECT
  COUNT(*) as total,
  COALESCE(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0) as sent,
  COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed,
  COALESCE(SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END), 0) as opened
FROM campaign_recipients
WHERE campaign_id = $1;
```

**Rules:**
- Single query (not multiple queries)
- Aggregate in SQL (not in JavaScript)
- Use COALESCE for null handling

**Why Immutable?**
- Multiple queries create race conditions
- JS aggregation is slower than SQL
- Without COALESCE, null counts break calculations

### 12. Index Strategy (CRITICAL)

**Required Indexes (Immutable):**
```sql
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);
```

**Rules:**
- All 4 indexes must exist
- No additional indexes without performance testing
- Index names must match exactly (for migrations)

**Why Immutable?**
- Missing indexes cause slow queries under load
- Wrong indexes waste storage and slow writes
- Production performance depends on these

---

## Environment Configuration

### .env File Template

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/martech
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Service
EMAIL_SERVICE=sendgrid  # Options: sendgrid, ses, mailgun, console (dev)
SENDGRID_API_KEY=your-sendgrid-api-key
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
EMAIL_FROM_ADDRESS=noreply@example.com
EMAIL_FROM_NAME=Marketing Campaigns

# Scheduled Campaign Worker
CRON_ENABLED=true
CRON_SCHEDULE=*/5 * * * *  # Every 5 minutes
WORKER_CONCURRENT_JOBS=5

# Logging
LOG_LEVEL=info  # Options: error, warn, info, debug
LOG_FORMAT=json  # Options: json, pretty

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# Feature Flags
ENABLE_SWAGGER=true
ENABLE_METRICS=true
```

### Environment-Specific Configuration Files

**Development:** `.env.development`
```bash
NODE_ENV=development
DATABASE_URL=postgresql://dev:dev@localhost:5432/martech_dev
EMAIL_SERVICE=console
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

**Staging:** `.env.staging`
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://staging:staging@staging-db.example.com:5432/martech_staging
EMAIL_SERVICE=sendgrid
LOG_LEVEL=info
LOG_FORMAT=json
```

**Production:** `.env.production`
```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod:SECRET@prod-db.example.com:5432/martech_prod
EMAIL_SERVICE=ses
LOG_LEVEL=warn
LOG_FORMAT=json
RATE_LIMIT_MAX_REQUESTS=50
```

### Validation Schema

```typescript
// src/config/env.validator.ts
import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.string().transform(Number).default('2'),
  DATABASE_POOL_MAX: z.string().transform(Number).default('10'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Email
  EMAIL_SERVICE: z.enum(['sendgrid', 'ses', 'mailgun', 'console']).default('console'),
  SENDGRID_API_KEY: z.string().optional(),
  AWS_SES_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email(),
  EMAIL_FROM_NAME: z.string().default('Marketing Campaigns'),

  // Worker
  CRON_ENABLED: z.string().transform(val => val === 'true').default('true'),
  CRON_SCHEDULE: z.string().default('*/5 * * * *'),
  WORKER_CONCURRENT_JOBS: z.string().transform(Number).default('5'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('false'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Pagination
  DEFAULT_PAGE_SIZE: z.string().transform(Number).default('20'),
  MAX_PAGE_SIZE: z.string().transform(Number).default('100'),

  // Feature Flags
  ENABLE_SWAGGER: z.string().transform(val => val === 'true').default('false'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('false'),
});

export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    console.error(error.errors);
    process.exit(1);
  }
};
```

### Configuration Loading Pattern

```typescript
// src/config/index.ts
import { validateEnv } from './env.validator';

export const config = validateEnv();

// Database connection config
export const dbConfig = {
  url: config.DATABASE_URL,
  pool: {
    min: config.DATABASE_POOL_MIN,
    max: config.DATABASE_POOL_MAX,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

// JWT config
export const jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
};

// Email service factory
export const emailConfig = {
  provider: config.EMAIL_SERVICE,
  from: {
    address: config.EMAIL_FROM_ADDRESS,
    name: config.EMAIL_FROM_NAME,
  },
  sendgrid: {
    apiKey: config.SENDGRID_API_KEY,
  },
  aws: {
    region: config.AWS_SES_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
  },
};
```

### Security Considerations

1. **Never commit .env files** - Add to `.gitignore`
2. **Use strong secrets** - Minimum 32 characters for JWT_SECRET
3. **Environment-specific secrets** - Different secrets per environment
4. **Secret rotation** - Plan for rotating JWT secrets without downtime
5. **Default values** - Provide safe defaults for development only

---

## Database Schema

### Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Campaigns table
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

-- Recipients table
CREATE TABLE recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Campaign recipients junction table
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

-- Indexes (see Indexing Strategy section)
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);
```

### Design Decisions

**UUIDs over Integer IDs**
- Pros: Distributed system friendly, no ID enumeration, no sequence contention
- Cons: Slightly larger storage, slower inserts
- Decision: UUIDs for production systems with future scaling potential

**TIMESTAMP WITH TIME ZONE**
- All timestamps stored with timezone to avoid ambiguity
- Always use UTC for storage, convert to local time in API layer

**ON DELETE RESTRICT for users**
- Prevent accidental deletion of users who own campaigns
- Must explicitly reassign campaigns before deleting user

**ON DELETE CASCADE for campaigns/recipients**
- Campaign deletion auto-removes campaign_recipients
- Recipient deletion auto-removes from all campaigns
- Simplifies cleanup logic

**CHECK constraints for data integrity**
- Email format validation at DB level
- Status enum constraints
- Business rules embedded in schema (scheduled_at must be future)

---

## Indexing Strategy

### Primary Indexes

| Index | Purpose |
|-------|---------|
| `idx_campaigns_created_by` | Optimize `/campaigns` filtering by user |
| `idx_campaigns_status` | Optimize `/campaigns` filtering by status |
| `idx_campaigns_scheduled_at` | Optimize scheduled campaign worker queries |
| `idx_campaign_recipients_status` | Optimize stats aggregation queries |

### Query Patterns

**User listing campaigns:**
```sql
-- Uses: idx_campaigns_created_by, idx_campaigns_status
SELECT * FROM campaigns WHERE created_by = $1 ORDER BY created_at DESC;
```

**Stats aggregation:**
```sql
-- Uses: idx_campaign_recipients_status
SELECT COUNT(*),
       SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END),
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END),
       SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END)
FROM campaign_recipients WHERE campaign_id = $1;
```

**Scheduled worker:**
```sql
-- Uses: idx_campaigns_scheduled_at, idx_campaigns_status
SELECT * FROM campaigns
WHERE status = 'scheduled' AND scheduled_at <= NOW();
```

---

## Data Relationships

```
users (1) ──────< (N) campaigns
                 │
                 │ (N)
                 │
recipients (N) >──< (M) campaign_recipients >─── (N) campaigns
```

### Relationship Types

1. **User → Campaign (One-to-Many)**
   - One user creates many campaigns
   - `created_by` foreign key with RESTRICT constraint

2. **Campaign ↔ Recipient (Many-to-Many)**
   - One campaign has many recipients
   - One recipient can be in many campaigns
   - Junction table: `campaign_recipients`
   - Contains tracking data per recipient (sent_at, opened_at, status)

### Cascade Behavior

- **Delete campaign**: Cascades to campaign_recipients
- **Delete recipient**: Cascades to campaign_recipients
- **Delete user**: BLOCKED if campaigns exist (RESTRICT)

---

## State Machine

### Campaign Status Lifecycle

```
    ┌──────────────┐
    │    draft     │
    └──────┬───────┘
           │
           │ /schedule
           ▼
    ┌──────────────┐
    │  scheduled   │
    └──────┬───────┘
           │
           │ /send (cron or manual)
           ▼
    ┌──────────────┐
    │     sent     │
    └──────────────┘ (terminal)
```

### Valid Transitions

| From | To | Trigger | Reversible |
|------|-----|---------|------------|
| draft | scheduled | POST /schedule | Yes (→ draft) |
| draft | sent | POST /send | **NO** |
| scheduled | sent | Cron/manual send | **NO** |
| scheduled | draft | PATCH /campaigns/:id (cancel) | Yes |

### Invalid Transitions

- **sent → anything**: Terminal state, cannot change
- **scheduled → draft** (after send time has passed)
- **draft → scheduled** (with past scheduled_at)

### Enforcement Strategy

**Database Level (Primary):**
- CHECK constraint: `scheduled_at IS NULL OR scheduled_at > CURRENT_TIMESTAMP`
- Trigger: Prevent status transitions except via stored procedures (optional)

**Service Layer (Secondary):**
- Explicit state validation in `CampaignService`
- Transition methods: `scheduleCampaign()`, `sendCampaign()`, `cancelCampaign()`
- Each method validates current state before transition

**API Layer (Tertiary):**
- HTTP 409 Conflict for invalid transitions
- Clear error messages: "Cannot edit sent campaign"

---

## API Contract Design

### Standard Response Format

```typescript
// Success
{
  success: true,
  data: <resource>
}

// Error
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    details?: <validation errors>
  }
}
```

### Authentication Endpoints

#### POST /auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePassword123!"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2026-04-24T10:00:00Z"
    },
    "token": "jwt-token"
  }
}
```
**Errors:**
- 400: Validation error (invalid email format)
- 409: Email already exists

#### POST /auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt-token"
  }
}
```
**Errors:**
- 401: Invalid credentials

### Campaign Endpoints

#### GET /campaigns
**Query Params:** `?status=draft&page=1&limit=20`
**Response (200):**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "uuid",
        "name": "Spring Sale",
        "subject": "50% Off!",
        "status": "draft",
        "scheduled_at": null,
        "created_at": "2026-04-24T10:00:00Z",
        "updated_at": "2026-04-24T10:00:00Z",
        "recipient_count": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

#### POST /campaigns
**Request:**
```json
{
  "name": "Spring Sale",
  "subject": "50% Off!",
  "body": "<html>...</html>",
  "recipient_ids": ["uuid-1", "uuid-2"]
}
```
**Response (201):** Returns created campaign object

**Errors:**
- 400: Validation error
- 404: Recipient not found

#### GET /campaigns/:id
**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Spring Sale",
    "subject": "50% Off!",
    "body": "<html>...</html>",
    "status": "draft",
    "scheduled_at": "2026-04-25T10:00:00Z",
    "created_by": {
      "id": "uuid",
      "name": "John Doe"
    },
    "created_at": "2026-04-24T10:00:00Z",
    "updated_at": "2026-04-24T10:00:00Z",
    "recipients": [
      {
        "id": "uuid",
        "email": "recipient@example.com",
        "name": "Jane Smith",
        "sent_at": null,
        "opened_at": null,
        "status": "pending"
      }
    ]
  }
}
```
**Errors:**
- 404: Campaign not found
- 403: Not authorized (different user)

#### PATCH /campaigns/:id
**Request:**
```json
{
  "name": "Updated Name",
  "subject": "New Subject",
  "body": "<html>...</html>",
  "scheduled_at": "2026-04-26T10:00:00Z",
  "recipient_ids": ["uuid-1", "uuid-3"]
}
```
**Response (200):** Returns updated campaign

**Errors:**
- 400: Validation error
- 403: Not draft status
- 404: Campaign not found

#### DELETE /campaigns/:id
**Response (204):** No content

**Errors:**
- 403: Not draft status
- 404: Campaign not found

#### POST /campaigns/:id/schedule
**Request:**
```json
{
  "scheduled_at": "2026-04-25T10:00:00Z"
}
```
**Response (200):** Returns campaign with status="scheduled"

**Errors:**
- 400: scheduled_at in past
- 403: Not draft status
- 404: Campaign not found

#### POST /campaigns/:id/send
**Request:** No body

**Response (200):**
```json
{
  "success": true,
  "data": {
    "campaign_id": "uuid",
    "queued": true,
    "recipient_count": 150
  }
}
```

**Errors:**
- 403: Not draft or scheduled status
- 404: Campaign not found

#### GET /campaigns/:id/stats
**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "sent": 140,
    "failed": 10,
    "opened": 85,
    "open_rate": 0.607,
    "send_rate": 0.933
  }
}
```
**Errors:**
- 404: Campaign not found

---

## Critical Query Design

### Stats Aggregation Query

```sql
-- Single efficient query for /campaigns/:id/stats
SELECT
    COUNT(*) as total,
    COALESCE(SUM(CASE WHEN cr.status = 'sent' THEN 1 ELSE 0 END), 0) as sent,
    COALESCE(SUM(CASE WHEN cr.status = 'failed' THEN 1 ELSE 0 END), 0) as failed,
    COALESCE(SUM(CASE WHEN cr.opened_at IS NOT NULL THEN 1 ELSE 0 END), 0) as opened
FROM campaign_recipients cr
WHERE cr.campaign_id = $1;
```

**Application layer calculates:**
- `open_rate = opened / sent` (if sent > 0, else 0)
- `send_rate = sent / total` (if total > 0, else 0)

### Send Operation (CRITICAL - Transaction Required)

```sql
-- BEGIN TRANSACTION

-- 1. Lock and update campaign status
UPDATE campaigns
SET status = 'sent',
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND status IN ('draft', 'scheduled')
RETURNING id, status;

-- 2. Initialize all recipients as pending
UPDATE campaign_recipients
SET status = 'pending'
WHERE campaign_id = $1;

-- 3. Queue recipients for sending (separate worker queue)
-- Insert into outbox table or message queue

-- COMMIT TRANSACTION
```

**Strategy:**
1. **Transaction**: Ensures atomic state transition
2. **Outbox Pattern**: Insert to `campaign_send_outbox` table
3. **Worker Process**: Reads outbox, sends emails, updates status
4. **Idempotency**: Track each recipient send attempt

---

## Business Rule Enforcement

### Rule 1: Only draft campaigns can be edited/deleted

**Enforcement Point:** Service layer + API middleware

```typescript
// CampaignService.updateCampaign()
if (campaign.status !== 'draft') {
  throw new ConflictError('Only draft campaigns can be edited');
}
```

**Database:** No direct constraint (too complex), but application guard

### Rule 2: scheduled_at must be in the future

**Enforcement Point:** Database (primary) + Validator (secondary)

**Database:**
```sql
CONSTRAINT scheduled_at_future CHECK (
    scheduled_at IS NULL OR scheduled_at > CURRENT_TIMESTAMP
)
```

**Validator:**
```typescript
const scheduledAtSchema = z.string().datetime().refine(
  (date) => new Date(date) > new Date(),
  { message: "scheduled_at must be in the future" }
);
```

### Rule 3: Sending sets status to sent and cannot be undone

**Enforcement Point:** Service layer

```typescript
// CampaignService.sendCampaign()
async sendCampaign(campaignId: string, userId: string) {
  const campaign = await this.repo.findById(campaignId);

  if (campaign.status === 'sent') {
    throw new ConflictError('Campaign already sent');
  }

  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    throw new ConflictError('Only draft or scheduled campaigns can be sent');
  }

  // Transaction wraps this entire operation
  return await this.repo.sendCampaign(campaignId, userId);
}
```

**Database:** No constraint (already enforced by transition logic)

### Rule 4: Stats calculations

**Enforcement Point:** Service layer

```typescript
// CampaignService.getStats()
async getStats(campaignId: string) {
  const raw = await this.repo.getStats(campaignId);

  return {
    total: raw.total,
    sent: raw.sent,
    failed: raw.failed,
    opened: raw.opened,
    open_rate: raw.sent > 0 ? raw.opened / raw.sent : 0,
    send_rate: raw.total > 0 ? raw.sent / raw.total : 0
  };
}
```

---

## Edge Cases

### Edge Case 1: User deletes recipient during campaign send

**Scenario:** Recipient exists in campaign, user deletes recipient, send worker processes

**Handling:**
- `ON DELETE CASCADE` removes from campaign_recipients
- Send worker checks recipient existence before sending
- Logs warning for missing recipients

### Edge Case 2: Concurrent send requests

**Scenario:** Two users/threads call POST /send simultaneously

**Handling:**
- Database row-level lock in transaction
- First request wins, second gets 409 Conflict
- Optimistic locking with `updated_at` version check

### Edge Case 3: Scheduled time passes before cron runs

**Scenario:** Campaign scheduled for 10:00, cron runs at 10:05

**Handling:**
- Cron query: `WHERE status = 'scheduled' AND scheduled_at <= NOW()`
- Includes campaigns with past scheduled_at
- Sends immediately (better late than never)

### Edge Case 4: Edit campaign with future schedule

**Scenario:** Campaign is scheduled, user edits before send time

**Handling:**
- Allow PATCH on scheduled campaigns
- Reset status to draft if recipients change
- Keep scheduled_at if only content changes

### Edge Case 5: Open tracking before sent

**Scenario:** opened_at populated but sent_at is null

**Handling:**
- Database constraint: `opened_at IS NULL OR sent_at IS NOT NULL`
- Cannot happen at DB level
- Service layer validates before setting opened_at

### Edge Case 6: Empty recipient list

**Scenario:** Campaign created with no recipients

**Handling:**
- Validator: `recipient_ids` array must have at least 1 item
- Send endpoint checks recipient count before sending
- Returns 400 Bad Request if empty

### Edge Case 7: Duplicate recipients in campaign

**Scenario:** Same recipient added twice via PATCH

**Handling:**
- Database: PRIMARY KEY (campaign_id, recipient_id) prevents duplicates
- API returns 400 with clear error message

---

## Folder Structure Mapping

```
/backend
  /src
    /controllers
      ├── AuthController.ts          # POST /auth/register, /auth/login
      └── CampaignController.ts      # All /campaigns/* endpoints

    /services
      ├── AuthService.ts             # User creation, JWT generation
      ├── CampaignService.ts         # Business logic for campaigns
      └── EmailService.ts            # Email sending abstraction

    /repositories
      ├── UserRepository.ts          # User queries
      ├── CampaignRepository.ts      # Campaign queries
      ├── RecipientRepository.ts     # Recipient queries
      └── CampaignRecipientRepository.ts  # Junction queries

    /routes
      ├── auth.routes.ts             # Mount auth endpoints
      └── campaign.routes.ts         # Mount campaign endpoints

    /middlewares
      ├── auth.middleware.ts         # JWT verification
      ├── errorHandler.middleware.ts # Global error handling
      └── validation.middleware.ts   # Request validation wrapper

    /validators
      ├── auth.validator.ts          # Auth schemas
      └── campaign.validator.ts      # Campaign schemas

    /db
      ├── connection.ts              # PostgreSQL connection pool
      ├── queries/                   # SQL query files
      │   ├── user.sql
      │   ├── campaign.sql
      │   └── stats.sql
      └── migrations/                # Reference to /migrations

  /migrations
      ├── 001_create_users.sql
      ├── 002_create_campaigns.sql
      ├── 003_create_recipients.sql
      ├── 004_create_campaign_recipients.sql
      └── 005_add_password_column.sql

  /tests
      /unit
          ├── services/
          │   ├── CampaignService.test.ts
          │   └── AuthService.test.ts
          └── validators/
              └── campaign.validator.test.ts
      /integration
          ├── routes/
          │   └── campaigns.test.ts
          └── repositories/
              └── CampaignRepository.test.ts

  package.json
  tsconfig.json
```

### Responsibility Map

| Folder | Responsibility | Example |
|--------|---------------|---------|
| controllers | HTTP layer only | Parse req, call service, format response |
| services | Business logic | State transitions, validation rules |
| repositories | Data access | SQL queries, connection management |
| validators | Request/response schemas | Zod schemas for input validation |
| middlewares | Cross-cutting concerns | Auth, error handling, logging |
| db | Database setup | Connection pool, raw SQL files |

**Critical:** Controllers should NOT contain business logic. Services should NOT know about HTTP.

---

## Testing Strategy

### Test 1: State Machine Transitions

**File:** `tests/unit/services/CampaignService.test.ts`

```typescript
describe('Campaign State Transitions', () => {
  it('should transition draft → scheduled', async () => {
    const campaign = await createCampaign({ status: 'draft' });
    const result = await campaignService.schedule(campaign.id, futureDate);
    expect(result.status).toBe('scheduled');
  });

  it('should reject transition from sent to any state', async () => {
    const campaign = await createCampaign({ status: 'sent' });
    await expect(
      campaignService.update(campaign.id, { name: 'New Name' })
    ).rejects.toThrow('Only draft campaigns can be edited');
  });

  it('should allow cancel scheduled campaign', async () => {
    const campaign = await createCampaign({
      status: 'scheduled',
      scheduled_at: futureDate
    });
    const result = await campaignService.cancel(campaign.id);
    expect(result.status).toBe('draft');
  });
});
```

**Purpose:** Verify state machine rules

### Test 2: Stats Calculation Accuracy

**File:** `tests/unit/services/CampaignService.test.ts`

```typescript
describe('Campaign Stats', () => {
  it('should calculate open_rate correctly', async () => {
    const campaign = await createCampaign();
    await addRecipients(campaign.id, 100);
    await markAsSent(campaign.id, 90);  // 90 sent
    await markAsOpened(campaign.id, 60); // 60 opened

    const stats = await campaignService.getStats(campaign.id);
    expect(stats.open_rate).toBeCloseTo(0.667, 2); // 60/90
  });

  it('should handle zero sent without division by zero', async () => {
    const campaign = await createCampaign();
    await addRecipients(campaign.id, 10);

    const stats = await campaignService.getStats(campaign.id);
    expect(stats.open_rate).toBe(0);
    expect(stats.send_rate).toBe(0);
  });
});
```

**Purpose:** Verify business calculations and edge cases

### Test 3: Send Operation Transactionality

**File:** `tests/integration/repositories/CampaignRepository.test.ts`

```typescript
describe('Campaign Send Transaction', () => {
  it('should update campaign and recipients atomically', async () => {
    const campaign = await createCampaign({ status: 'draft' });
    await addRecipients(campaign.id, 5);

    // Mock failure during send
    const mockSend = jest.fn().mockRejectedValueOnce(new Error('SMTP error'));

    await expect(
      campaignRepository.sendCampaign(campaign.id)
    ).rejects.toThrow();

    // Verify rollback
    const updatedCampaign = await findById(campaign.id);
    expect(updatedCampaign.status).toBe('draft'); // Not 'sent'

    const recipients = await getCampaignRecipients(campaign.id);
    expect(recipients.every(r => r.status === 'pending')).toBe(true);
  });
});
```

**Purpose:** Verify transaction rollback on failure

---

## Additional Considerations

### Worker Process (Not in Scope but Critical)

For production, need a separate worker process:
- Polls `campaigns` where `status = 'scheduled' AND scheduled_at <= NOW()`
- Calls `POST /campaigns/:id/send` endpoint
- Runs as background service (systemd, Docker, etc.)

### Email Service Abstraction

Create interface for email sending:
```typescript
interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}
```

Implementations:
- Development: Log to console
- Staging: Send to test inbox
- Production: SMTP service (SendGrid, AWS SES, etc.)

---

## Summary

This design prioritizes:
1. **Data integrity** through database constraints and transactions
2. **Clear separation of concerns** via layered architecture
3. **Explicit state management** with defined transitions
4. **Production-ready error handling** and edge case coverage
5. **Maintainability** through consistent patterns and clear contracts

---

## How to Use This Document

### Before Implementation
- Read the architectural decisions section carefully
- Understand WHY each decision is immutable
- Plan your implementation around these constraints

### During Implementation
- Reference this document when making decisions
- If tempted to violate an architectural decision, STOP and reconsider
- Ask: "Can I work within this constraint instead?"

### During Code Review
- Check that PRs don't violate architectural decisions
- Reject changes that break architectural integrity
- Refer to this document as justification

### When You Think You Need to Change
1. You probably don't - find another way
2. If absolutely necessary, update THIS document first
3. Get explicit approval before changing
4. Update all dependent code
5. Update tests to reflect new architecture

---

**Remember:** These constraints exist for a reason. They represent production-ready best practices that prevent bugs, ensure scalability, and maintain code quality. Work within them, don't fight them.
