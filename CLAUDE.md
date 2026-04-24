# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Email campaign management backend service with a production-ready architecture using Node.js, Express, and PostgreSQL.

## License

MIT License - Copyright © 2026 Lê Khánh Toàn

## Architecture Principles

### Layered Architecture (Immutable)
```
Controllers (HTTP) → Services (Business Logic) → Repositories (Data Access) → Database
```

**Strict separation of concerns:**
- Controllers handle HTTP only (parse req, call service, format response)
- Services contain business logic and state transitions
- Repositories handle SQL queries and database connections
- No logic crosses layer boundaries

### State Machine (Campaign Lifecycle)
```
draft → scheduled → sent (terminal)
```

**Valid transitions:** draft→scheduled, draft→sent, scheduled→sent, scheduled→draft
**Invalid:** sent→any state (terminal)

### Database Design
- **UUIDs** for all primary keys (distributed-friendly, no ID enumeration)
- **TIMESTAMP WITH TIME ZONE** (UTC storage, convert to local in API layer)
- **CHECK constraints** at DB level for business rules (defense in depth)
- **ON DELETE RESTRICT** for users→campaigns, **CASCADE** for campaigns/recipients→junction

### Tech Stack Decisions
- **No heavy ORM** - raw SQL with lightweight query builder
- **JWT authentication** - HTTP-only cookies, 7-day access/30-day refresh tokens
- **Zod validation** - schemas on input + database constraints
- **Transaction strategy** - send operations use atomic transactions

## Development Workflow

### Adding New Features
1. **Start with schema** - Add migration with proper constraints
2. **Define API contract** - consistent response format: `{success: true/false, data/error}`
3. **Implement layers in order** - Repository → Service → Controller → Routes
4. **Add validation** - Zod schemas + database constraints
5. **Test state transitions** - verify state machine rules

### Code Organization
```
/backend/src/
  /controllers     # HTTP layer only
  /services        # Business logic & state transitions  
  /repositories    # SQL queries & connection management
  /routes          # Route definitions (no logic)
  /middlewares     # Cross-cutting concerns (auth, errors)
  /validators      # Zod schemas
  /db              # Connection & raw SQL files
  /utils           # Utilities (logger, helpers)
```

### Error Handling
**HTTP status codes:**
- `400` - Validation error
- `401` - Authentication failed  
- `403` - Authorization failed
- `404` - Resource not found
- `409` - State conflict (invalid state transition)
- `500` - Server error

**Consistent error format:**
```json
{"success": false, "error": {"code": "ERROR_CODE", "message": "...", "details": {}}}
```

## Critical Rules

### State Management
- Only draft campaigns can be edited/deleted
- sent is terminal - no transitions out
- scheduled_at must be in future (DB constraint enforced)

### Data Integrity  
- All stat calculations use single SQL query (not N+1)
- Division by zero returns 0 (not NaN/Infinity)
- Send operations are atomic (transaction wraps status + recipients)

### Testing Strategy
- **Unit tests** - service layer business logic
- **Integration tests** - repository SQL queries
- **State transition tests** - verify state machine rules

## Build & Deploy

```bash
# Development
npm run dev          # Hot reload server
npm test            # Run test suite
npm run lint        # Lint code

# Production  
npm run build       # Compile TypeScript
npm start           # Start server
```

**Environment:** Use `.env.example` as template. Minimum required: `DATABASE_URL`, `JWT_SECRET` (32+ chars), `PORT`.

## Database Migrations

Located in `/backend/migrations/`. Run in numerical order:
```bash
psql -U username -d martech -f migrations/001_create_users.sql
# ... continue through 004
```

**Rollback:** Drop tables in reverse order if needed.
