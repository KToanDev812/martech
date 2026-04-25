# MarTech - Email Campaign Management System

A full-stack email campaign management application with campaign creation, scheduling, and analytics.

## Features

- **User Authentication**: JWT-based authentication with HTTP-only cookies
- **Campaign Management**: Create, edit, delete, and manage email campaigns
- **Scheduling**: Schedule campaigns for future delivery
- **Analytics**: Track email opens, send rates, and campaign performance
- **State Machine**: Draft → Scheduled → Sent workflow with proper validation
- **Responsive UI**: Built with React, TypeScript, and Tailwind CSS

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- TanStack Query (data fetching)
- Redux Toolkit (auth state management)
- Tailwind CSS + shadcn/ui (UI components)

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL (database)
- JWT authentication
- Raw SQL with connection pooling

## Local Setup

### Quick Start with Docker (Recommended)

The fastest way to get the entire application running locally:

```bash
# Clone the repository
git clone <repository-url>
cd martech

# Create .env files (required)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# Wait for services to be healthy (10-20 seconds)
# Check status: docker-compose ps

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3002
# Database: localhost:5432
```

**Stop the application:**
```bash
docker-compose down
```

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Manual Setup (Without Docker)

See individual README files for detailed manual setup instructions:
- **[Backend Setup](./backend/README.md#installation)** - Backend dependencies, database, environment
- **[Frontend Setup](./frontend/README.md#installation)** - Frontend dependencies, environment

## Seed Data

Populate your database with sample data for testing and development:

### Option 1: Docker with Seed Script

```bash
# Create .env files first (if they don't exist)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run seed script in the backend container
docker-compose exec backend npm run seed

# Output: Test accounts and sample data will be created
```

### Option 2: Local Development with Seed

```bash
cd backend

# Create .env file first (if it doesn't exist)
cp .env.example .env

# Run seed script (ensure database is running)
npm run seed

# Output: Test accounts and sample data will be created
```

### What Gets Seeded?

**Test Account:**
- `admin@martech.com` / `password123`

**Sample Data:**
- 8 recipients with different profiles
- 20 campaigns in various states (draft, scheduled, sent)
- Campaign-recipient relationships with delivery status
- Realistic campaign names and content

**Note:** Seeding will **clear all existing data** in the database. Use this only for development/testing!

## Project Structure

```
martech/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── controllers/    # HTTP request handlers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Database queries
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Express middleware
│   │   ├── validators/     # Zod schemas
│   │   └── db/             # Database connection & seed script
│   ├── migrations/         # SQL migrations
│   └── tests/              # Test files
├── frontend/         # React/TypeScript app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── features/       # Feature-based modules
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
└── docker-compose.yml      # Docker orchestration
```

## Campaign Lifecycle

```
draft → scheduled → sent (terminal)
```

- **Draft**: Can be edited, deleted, scheduled, or sent
- **Scheduled**: Can be rescheduled or sent
- **Sent**: Terminal state, cannot be modified

## API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Campaigns
- `GET /api/v1/campaigns` - List campaigns (paginated)
- `GET /api/v1/campaigns/:id` - Get campaign details
- `POST /api/v1/campaigns` - Create campaign
- `PATCH /api/v1/campaigns/:id` - Update campaign
- `DELETE /api/v1/campaigns/:id` - Delete campaign
- `POST /api/v1/campaigns/:id/schedule` - Schedule campaign
- `POST /api/v1/campaigns/:id/send` - Send campaign
- `GET /api/v1/campaigns/:id/stats` - Get campaign statistics

### Recipients
- `GET /api/v1/recipients` - List all recipients
- `POST /api/v1/recipients` - Create recipient
- `GET /api/v1/recipients/:id` - Get recipient details
- `PATCH /api/v1/recipients/:id` - Update recipient
- `DELETE /api/v1/recipients/:id` - Delete recipient

## Development

### Backend Commands
```bash
cd backend
npm run dev          # Start development server
npm run seed         # Seed database with sample data
npm run test         # Run tests
npm run lint         # Lint code
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Lint code
```

See individual README files for complete command reference.

## Documentation

- **[Backend README](./backend/README.md)** - Backend setup, architecture, API endpoints
- **[Frontend README](./frontend/README.md)** - Frontend setup, components, state management
- **[CLAUDE.md](./CLAUDE.md)** - Project guidelines and development rules

**Missing .env files?**
```bash
# Create them before running docker-compose
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Then restart docker-compose
docker-compose down
docker-compose up -d
```

**Port already in use?**
```bash
# Check what's using the port
netstat -ano | findstr :3002
# Or change ports in docker-compose.yml if needed
```

**Database connection errors?**
```bash
# Check PostgreSQL container is healthy
docker-compose ps

# Restart services
docker-compose restart postgres
```

**Frontend can't reach backend?**
```bash
# Check backend container logs
docker-compose logs backend

# Verify backend is running
curl http://localhost:3002/health
```

## How I Used Claude Code

This project was built with Claude Code as a design assistant and implementation accelerator, while maintaining full control over architecture and critical decisions.

### What Tasks I Delegated to Claude Code

I used Claude Code for:

- **Drafting backend and frontend architecture plans**
- **Generating database schema and migration structure**
- **Scaffolding API layers and React components**
- **Creating React Query hooks and service layer patterns**
- **Suggesting test cases for business logic and edge cases**

All outputs were reviewed, simplified, and aligned with production-level standards before being accepted.

### Example Prompts I Used

**Prompt 1 — Backend Design**
```
You are a senior backend engineer designing a production-ready system.
Design database schema, indexing strategy, state machine, API contracts,
and transaction handling. Do NOT write implementation code.
```

**Prompt 2 — Frontend Architecture**
```
Design a production-ready React frontend using:
- React Query for server state
- Redux for auth only
- shadcn/ui for UI

Focus on data flow, state management, and maintainability.
Do NOT write code.
```

**Prompt 3 — Fix React Query Flicker**
```
We have a flicker issue when switching filter badges (first-time only).

Context:
- React Query is used
- Query key changes based on filter
- No cached data causes UI reset

Fix it by preserving previous data and avoiding UI flicker.
Do NOT use Redux for API data.
```

### Where Claude Code Was Wrong or Needed Correction

Claude Code was helpful but required active guidance and correction:

**Over-engineering**
- Initial designs included unnecessary abstractions and patterns beyond scope
- I simplified them to keep the system clear and maintainable

**State Management Misuse**
- It sometimes attempted to use Redux for server data
- I enforced a strict rule:
  - **React Query → server state**
  - **Redux → authentication only**

**UI/UX Issues (Flicker on Filter Change)**
- The first solution caused UI flickering
- I corrected it using:
  - `placeholderData` and `keepPreviousData`
  - Proper handling of `isLoading` vs `isFetching`

### What I Would NOT Let Claude Code Do — and Why

I intentionally did not rely on Claude Code for:

**Final Architecture Decisions**
- These require understanding trade-offs and system constraints
- Must be explicitly controlled

**Business Rules and State Machine Design**
- Critical logic such as campaign lifecycle and constraints must be precise and deterministic

**Generating Full Features in One Step**
- Large, unreviewed outputs often introduce:
  - Inconsistent structure
  - Hidden bugs
  - Violations of architecture rules

**Instead**, I used Claude Code in a controlled, step-by-step workflow, similar to guiding a junior engineer — ensuring correctness, simplicity, and maintainability.

## License

MIT License - Copyright © 2026 Lê Khánh Toàn
