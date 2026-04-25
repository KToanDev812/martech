# MarTech Backend

Email campaign management backend service built with Node.js, Express, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 16+
- **Language**: TypeScript
- **Authentication**: JWT (HTTP-only cookies)
- **Validation**: Zod
- **Testing**: Jest

## Project Structure

```
/backend
  /src
    /controllers     # HTTP layer only
    /services        # Business logic
    /repositories    # Data access (SQL queries)
    /routes          # Route definitions
    /middlewares     # Cross-cutting concerns
    /validators      # Zod validation schemas
    /db              # Database connection
    /utils           # Utility functions
  /migrations        # Database migrations
  /tests             # Test files
  package.json
  tsconfig.json
  .env.example
```

## Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Important:** The `.env` file is required for the application to run. Docker Compose expects this file to exist at `./backend/.env`.

## Database Setup

```bash
# Create database
createdb martech

# Run migrations in order
psql -U username -d martech -f migrations/001_create_users.sql
psql -U username -d martech -f migrations/002_create_campaigns.sql
psql -U username -d martech -f migrations/003_create_recipients.sql
psql -U username -d martech -f migrations/004_create_campaign_recipients.sql
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Seed database with sample data
npm run seed

# Lint code
npm run lint
```

### Seed Data

Populate your database with sample data for testing:

```bash
npm run seed
```

**What gets seeded:**
- 1 test user (admin@martech.com)
- 8 recipients with different profiles
- 20 campaigns in various states (draft, scheduled, sent)
- Campaign-recipient relationships

**Warning:** Seeding will clear all existing data. Use only for development/testing!

**Test Account:**
- Email: `admin@martech.com` / Password: `password123`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Campaigns
- `GET /api/v1/campaigns` - List user's campaigns
- `POST /api/v1/campaigns` - Create new campaign
- `GET /api/v1/campaigns/:id` - Get campaign details
- `PATCH /api/v1/campaigns/:id` - Update campaign (draft only)
- `DELETE /api/v1/campaigns/:id` - Delete campaign (draft only)
- `POST /api/v1/campaigns/:id/schedule` - Schedule campaign
- `POST /api/v1/campaigns/:id/send` - Send campaign immediately
- `GET /api/v1/campaigns/:id/stats` - Get campaign statistics

### Recipients
- `GET /api/v1/recipients` - List all recipients
- `POST /api/v1/recipients` - Create recipient
- `GET /api/v1/recipients/:id` - Get recipient details
- `PATCH /api/v1/recipients/:id` - Update recipient
- `DELETE /api/v1/recipients/:id` - Delete recipient

## Architecture

### Layered Architecture

```
Controllers (HTTP)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Database (PostgreSQL)
```

**Key Principles:**
- Controllers handle HTTP only (parse req, call service, format response)
- Services contain business logic and state transitions
- Repositories handle SQL queries and database connections
- No logic crosses layer boundaries

### State Machine

Campaign lifecycle: `draft → scheduled → sent`

**Valid Transitions:**
1. draft → scheduled (POST /schedule)
2. draft → sent (POST /send)
3. scheduled → sent (POST /send)
4. scheduled → draft (reschedule)

**Invalid:**
- sent → any state (terminal state)

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_POOL_MIN` - Minimum pool size (default: 2)
- `DATABASE_POOL_MAX` - Maximum pool size (default: 10)
- `JWT_SECRET` - Secret key for JWT tokens (min 32 chars)
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `PORT` - Server port (default: 3000)
- `API_VERSION` - API version prefix (default: v1)
- `LOG_LEVEL` - Logging level (default: info)
- `LOG_FORMAT` - Log format (json or pretty)
- `CORS_ORIGIN` - Allowed CORS origins

## Error Handling

All errors return consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

HTTP Status Codes:
- `400` - Validation error
- `401` - Authentication failed
- `403` - Authorization failed
- `404` - Resource not found
- `409` - State conflict
- `500` - Server error

## Database Schema

See `migrations/` folder for complete schema definition.

Key tables:
- `users` - User accounts and credentials
- `campaigns` - Email campaigns with state management
- `recipients` - Email contacts
- `campaign_recipients` - Junction table with delivery tracking

## Security Features

### SQL Injection Prevention
- Parameterized queries for all database operations
- Input validation at repository level
- UUID format validation
- Email format validation
- Column name whitelisting
- Status enum validation

### Input Validation
- Zod schema validation
- TypeScript type safety
- Runtime validation in repositories
- Defense in depth approach

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- campaign.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

**Testing Focus:**
- Service layer business logic
- State machine transitions
- Validation schemas
- Repository SQL queries
- Edge cases and error handling

## Deployment

### Production Build

```bash
# Build TypeScript
npm run build

# The compiled JavaScript will be in /dist
# Start the server
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set strong JWT_SECRET (32+ chars)
4. Set appropriate CORS_ORIGIN
5. Configure email service if needed

### Process Manager

Use PM2 for production:

```bash
npm install -g pm2
pm2 start dist/index.js --name martech-backend
pm2 startup
pm2 save
```

## License

MIT License - Copyright © 2026 Lê Khánh Toàn
