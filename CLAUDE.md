# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MarTech is a full-stack email campaign management system built with a layered architecture. The application manages email campaigns through a draft → scheduled → sent lifecycle, with user authentication, recipient management, and analytics.

## Quick Start Commands

### Docker (Recommended)
```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Seed database with test data
docker-compose exec backend npm run seed
```

### Backend Development
```bash
cd backend
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run seed         # Seed database with sample data
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Build for production
npm run lint         # Run ESLint
```

## Architecture

### Backend: Layered Architecture (Strict)

**Critical Rule:** Follow the layered separation strictly. No skipping layers.

```
Controllers (HTTP) → Services (Business Logic) → Repositories (Data Access) → Database
```

**Layer Responsibilities:**
- **Controllers** (`src/controllers/`): Handle HTTP only - parse requests, call services, format responses
- **Services** (`src/services/`): Business logic, state transitions, orchestration
- **Repositories** (`src/repositories/`): SQL queries and database interaction only
- **Validators** (`src/validators/`): Zod schemas for input validation

**Path Aliases:**
```typescript
import { campaignService } from '@services/CampaignService'
import { campaignRepository } from '@repositories/CampaignRepository'
```

### Campaign State Machine

**States:** `draft` → `scheduled` → `sent` (terminal)

**Valid Transitions:**
- draft → scheduled
- draft → sent
- scheduled → sent

**Rules:**
- `sent` is terminal - no transitions allowed
- Only `draft` campaigns can be edited or deleted
- State transitions must be enforced in service layer
- Database uses CHECK constraints for status validation

### Database Design Principles

- **Primary Keys:** Always use UUID
- **Timestamps:** Use `TIMESTAMP WITH TIME ZONE` (store in UTC)
- **Constraints:** Use CHECK constraints for status values and business rules
- **Foreign Keys:** 
  - `ON DELETE RESTRICT` for users → campaigns
  - `ON DELETE CASCADE` for campaigns → campaign_recipients
- **Indexes:** Index frequently filtered fields (status, created_by)

### Transactions & Concurrency

**Mandatory Transactions:**
Multi-step operations must use transactions (e.g., `/campaigns/:id/send` updates both campaign status and recipients).

**Concurrency Control:**
Use row-level locking (`SELECT ... FOR UPDATE`) to prevent race conditions on critical operations like sending campaigns.

**Idempotency:**
Critical operations must be idempotent - always check current state before applying updates.

### Frontend: State Management (Strict Separation)

**Critical Rule:** Separate server state from client state strictly.

```
React Query → ALL server state (API data)
Redux → ONLY authentication state (token, user info)
```

**Data Fetching Pattern:**
```
Components → React Query hooks → Services layer → Axios API client
```

**Path Aliases:**
```typescript
import { campaignsService } from '@/services/campaigns.service'
import { useCampaigns } from '@/features/campaigns/hooks/useCampaigns'
```

### Frontend Feature Structure

```
features/
├── auth/
│   ├── hooks/          # React Query hooks
│   ├── services/       # API service functions
│   └── components/     # Auth-specific UI components
└── campaigns/
    ├── hooks/
    ├── services/
    └── components/
```

**Key Pattern:** Each feature has its own hooks and services. Hooks export services for use in mutations.

### API Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

**Axios Interceptor:** The frontend API client (`src/services/api.ts`) automatically unwraps the response envelope and handles authentication errors.

## Configuration

### Environment Setup

**Backend** (`backend/.env`):
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://martech:martech_password@localhost:5432/martech
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3001/api/v1
```

### Docker Services

- **PostgreSQL:** `localhost:5432`
- **Backend API:** `localhost:3001`
- **Frontend:** `localhost:3000`

## Testing

**Backend:** Jest tests in `backend/tests/unit/`
**Frontend:** No test setup currently configured

## Code Quality Standards

### Backend
- Use TypeScript with strict mode disabled (project uses gradual typing)
- All business logic must be in service layer
- Use Winston for structured logging
- Use Zod for request validation
- Handle errors with custom error classes (`NotFoundError`, `ValidationError`)

### Frontend
- Use React Query for all server state with proper query keys
- Use shadcn/ui for UI components
- Handle loading, error, and empty states
- Avoid unnecessary abstractions - prefer simple, maintainable solutions
- Never duplicate server state in Redux

## Common Patterns

### Creating a New API Endpoint

1. Add Zod schema in `src/validators/`
2. Create repository methods in `src/repositories/`
3. Create service methods in `src/services/`
4. Create controller in `src/controllers/`
5. Add routes in `src/routes/`
6. Update API documentation

### Creating a New Frontend Feature

1. Create feature directory: `src/features/feature-name/`
2. Create service: `services/feature.service.ts`
3. Create hooks: `hooks/useFeature.ts` (export service for mutations)
4. Create components: `components/FeatureComponent.tsx`
5. Use React Query for data fetching
6. Use shadcn/ui for UI elements

### Database Migrations

Place SQL migrations in `backend/migrations/` with numbered prefix:
```
001_create_users.sql
002_create_campaigns.sql
```

## Important Notes

- **Seeding:** Running `npm run seed` will clear all existing data
- **Authentication:** JWT tokens stored in HTTP-only cookies, handled by Redux
- **Error Handling:** Backend uses custom error classes, frontend uses Axios interceptors
- **Path Aliases:** Both frontend and backend use path aliases - check respective tsconfig.json files
- **Port Conflicts:** Default ports are 3000 (frontend), 3001 (backend), 5432 (database)