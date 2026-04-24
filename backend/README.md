# Martech Backend

Email campaign management backend service built with Node.js, Express, and PostgreSQL.

## 🔒 Security First

This application implements comprehensive security measures including SQL injection prevention, input validation, and security monitoring. **See [SECURITY.md](./SECURITY.md) for detailed security documentation.**

**Security Score: 9/10 (Production-Ready)**

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 12+
- **Language**: TypeScript
- **Authentication**: JWT (HTTP-only cookies)
- **Validation**: Zod
- **Logging**: Winston

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
    /db              # Database connection & SQL files
    /utils           # Utility functions (including security.ts)
  /migrations        # Database migrations
  /tests
    /security        # Security test suite
  SECURITY.md        # Comprehensive security documentation
  package.json
  tsconfig.json
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Database Setup

```bash
# Create database
createdb martech

# Run migrations
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

# Run security tests
npm test -- SQLInjection.test.ts

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Campaigns
- `GET /api/v1/campaigns` - List user's campaigns
- `POST /api/v1/campaigns` - Create new campaign
- `GET /api/v1/campaigns/:id` - Get campaign details
- `PATCH /api/v1/campaigns/:id` - Update campaign (draft only)
- `DELETE /api/v1/campaigns/:id` - Delete campaign (draft only)
- `POST /api/v1/campaigns/:id/schedule` - Schedule campaign
- `POST /api/v1/campaigns/:id/send` - Send campaign immediately
- `GET /api/v1/campaigns/:id/stats` - Get campaign statistics

### Health Check
- `GET /health` - Server health check

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
3. scheduled → sent (worker or POST /send)
4. scheduled → draft (PATCH to cancel)

**Invalid:**
- sent → any state (terminal state)

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 chars)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development, staging, production)
- `EMAIL_SERVICE` - Email provider (console, sendgrid, ses)

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

### SQL Injection Prevention ✅
- Parameterized queries for all database operations
- Input validation at repository level
- UUID format validation
- Email format validation
- Column name whitelisting
- Status enum validation

### Security Monitoring ✅
- Enhanced query logging
- Slow query detection (>1s)
- Transaction monitoring
- Sanitized logs (no sensitive data)
- Performance metrics

### Input Validation ✅
- Zod schema validation
- TypeScript type safety
- Runtime validation in repositories
- Defense in depth approach

**For detailed security information, see [SECURITY.md](./SECURITY.md)**

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- CampaignService.test.ts

# Run security tests
npm test -- SQLInjection.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

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
3. Set strong JWT_SECRET
4. Configure email service (SendGrid, AWS SES, etc.)
5. Set appropriate CORS_ORIGIN

### Security Checklist for Deployment
- [ ] Review security documentation (SECURITY.md)
- [ ] Run security test suite
- [ ] Verify database connection encryption
- [ ] Configure CORS properly
- [ ] Set strong JWT_SECRET (32+ chars)
- [ ] Enable security logging
- [ ] Set up monitoring and alerts
- [ ] Review rate limiting configuration

### Process Manager

Use PM2 for production:

```bash
npm install -g pm2
pm2 start dist/index.js --name martech-backend
pm2 startup
pm2 save
```

## Contributing

When contributing to this codebase:
1. Follow the security guidelines in [SECURITY.md](./SECURITY.md)
2. Always validate inputs at repository level
3. Use parameterized queries
4. Add security tests for new features
5. Update documentation

## License

MIT License - Copyright © 2026 Lê Khánh Toàn
