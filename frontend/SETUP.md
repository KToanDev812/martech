# Frontend - Email Campaign Management System

React + TypeScript frontend for the email campaign management system.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Query** - Server state management
- **Redux Toolkit** - Client state (auth only)
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Axios** - HTTP client
- **Zod** - Schema validation
- **React Hook Form** - Form management

## Prerequisites

- Node.js 18+
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your environment variables:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api/v1

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run type-check

# Run linter
npm run lint
```

## Project Structure

```
frontend/
  /src
    /app              # App configuration
    /pages            # Page components
    /features         # Feature modules
      /auth           # Authentication feature
      /campaigns      # Campaigns feature
      /recipients     # Recipients feature
    /components       # Shared components
      /ui            # shadcn/ui components
      /layout        # Layout components
      /common        # Common components
    /services        # API services
    /store           # Redux store
    /hooks           # Custom hooks
    /routes          # Route configuration
    /types           # TypeScript types
    /utils           # Utility functions
```

## Path Aliases

The project uses path aliases for cleaner imports:

```typescript
import { Button } from '@/components/ui/button'
import { useCampaigns } from '@/features/campaigns/hooks/useCampaigns'
import { api } from '@/services/api'
```

Available aliases:
- `@/` → `./src/`
- `@/components` → `./src/components/`
- `@/features` → `./src/features/`
- `@/pages` → `./src/pages/`
- `@/services` → `./src/services/`
- `@/store` → `./src/store/`
- `@/hooks` → `./src/hooks/`
- `@/types` → `./src/types/`
- `@/utils` → `./src/utils/`
- `@/routes` → `./src/routes/`
- `@/app` → `./src/app/`

## State Management

### React Query (Server State)
- Campaigns and recipients data
- API response caching
- Automatic refetching
- Optimistic updates

### Redux (Client State)
- User authentication state
- JWT token management
- User profile data

### Local State
- Form inputs
- UI toggles
- Temporary data

## API Integration

The frontend integrates with the backend REST API:

- **Base URL**: Set via `VITE_API_URL` environment variable
- **Authentication**: HTTP-only cookies (handled automatically)
- **Response Format**: `{ success: true, data: ... }`
- **Error Handling**: `{ success: false, error: { code, message, details } }`

## Component Library

This project uses shadcn/ui components. To add new components:

```bash
npx shadcn@latest add [component-name]
```

Available components: https://ui.shadcn.com/docs/components

## Development Notes

### Authentication Flow
1. User logs in via `/login`
2. Backend sets HTTP-only cookie
3. Redux auth state is updated
4. User redirected to `/campaigns`

### Protected Routes
TODO: Implement `ProtectedRoute` component to check authentication status

### Error Handling
- 401 errors → Redirect to login
- 403 errors → Show permission/state error
- 404 errors → Show not found message
- 500 errors → Show server error message

## Build & Deploy

### Production Build

```bash
npm run build
```

Output will be in `dist/` directory.

### Environment Variables for Production

Create `.env.production`:

```bash
VITE_API_URL=https://api.martech.com/api/v1
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

## License

MIT License - Copyright © 2026 Lê Khánh Toàn
