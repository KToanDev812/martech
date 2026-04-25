# MarTech Frontend

React-based frontend for the email campaign management system.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit (auth only)
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: Tailwind CSS + shadcn/ui
- **HTTP Client**: Axios
- **Routing**: React Router v7

## Project Structure

```
/frontend
  /src
    /components
      /common         # Shared UI components
      /ui             # shadcn/ui components
    /features
      /auth           # Authentication feature
      /campaigns      # Campaign management feature
    /pages            # Page components
    /services         # API services
    /store            # Redux store
    /utils            # Utility functions
    /types            # TypeScript types
    App.tsx
    main.tsx
  public/             # Static assets
  package.json
  vite.config.ts
  tsconfig.json
  .env.example
```

## Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env if needed
# For local backend: VITE_API_URL=http://localhost:3001/api/v1
# For Docker backend: VITE_API_URL=http://localhost:3002/api/v1
```

**Important:** The `.env` file is required for the application to run. Docker Compose expects this file to exist at `./frontend/.env`.

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Variables

### Frontend (.env)
```bash
# API URL for backend
# For local development (backend running locally):
VITE_API_URL=http://localhost:3001/api/v1

# For Docker development (backend in container):
VITE_API_URL=http://localhost:3002/api/v1
```

## Key Features

### Authentication
- User registration and login
- Persistent authentication with HTTP-only cookies
- Protected routes
- Automatic token refresh

### Campaign Management
- Create campaigns with recipients
- Edit draft campaigns
- Schedule campaigns for future delivery
- Send campaigns immediately
- View campaign statistics
- Campaign state tracking (draft, scheduled, sent)

### State Management

**Redux Toolkit** (minimal usage):
- Authentication state (token, user)

**TanStack Query** (server state):
- All API data fetching
- Automatic caching and refetching
- Optimistic updates
- Loading and error states

### UI Components

Built with shadcn/ui and Tailwind CSS:
- Pre-built accessible components
- Consistent design system
- Responsive layouts
- Dark mode support (if needed)

## Pages

- **Login** (`/login`) - User authentication
- **Register** (`/register`) - User registration
- **Campaign List** (`/campaigns`) - List all campaigns
- **Campaign Detail** (`/campaigns/:id`) - View campaign details
- **Campaign Create** (`/campaigns/new`) - Create new campaign
- **Campaign Edit** (`/campaigns/:id/edit`) - Edit draft campaign

## API Services

All API calls go through the services layer:

```typescript
// services/api.ts
- authApi
- campaignsApi
- recipientsApi
```

## Custom Hooks

Feature-specific hooks in `/features`:

```typescript
// campaigns/hooks/useCampaignMutations.ts
- useCreateCampaign
- useUpdateCampaign
- useDeleteCampaign
- useScheduleCampaign
- useSendCampaign
```

## Error Handling

Centralized error handling:

```typescript
// utils/errors.ts
- getErrorMessage(error) - User-friendly error messages
- isNetworkError(error) - Detect network issues
- isAuthError(error) - Detect authentication failures
- isValidationError(error) - Detect validation errors
- isConflictError(error) - Detect state conflicts
```

## Development Guidelines

### State Management Rules

1. **Use React Query for ALL server state** (API data)
2. **Use Redux ONLY for authentication state** (token, user)
3. **DO NOT store API data in Redux**
4. **DO NOT duplicate server state in multiple places**

### Data Fetching

- All API calls must go through the services layer
- Use React Query hooks for all data fetching
- DO NOT call APIs directly inside components
- Handle loading, error, and empty states

### UI Components

- Use shadcn/ui components
- Prefer small, reusable components
- Separate data logic (hooks) from UI (components)
- Use path aliases (`@/`) instead of relative imports

### Code Quality

- Use TypeScript strictly
- Handle loading states
- Handle error states
- Handle empty states
- Avoid over-engineering

## Docker Support

The frontend can run in Docker using the provided Dockerfile:

```bash
# From project root
docker-compose up frontend

# Access at http://localhost:3000
```

## License

MIT License - Copyright © 2026 Lê Khánh Toàn
