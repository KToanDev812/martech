# Email Campaign Frontend - Complete Design Document

## Table of Contents
1. [Application Architecture](#application-architecture)
2. [State Management Strategy](#state-management-strategy)
3. [API Integration Layer](#api-integration-layer)
4. [Routing & Page Structure](#routing--page-structure)
5. [Component Design](#component-design)
6. [UI/UX Behavior](#uiux-behavior)
7. [Data Flow](#data-flow)
8. [Conditional UI Logic](#conditional-ui-logic)
9. [Folder Structure Mapping](#folder-structure-mapping)
10. [Environment Configuration](#environment-configuration)
11. [Path Alias Strategy](#path-alias-strategy)
12. [Performance Considerations](#performance-considerations)
13. [Edge Cases](#edge-cases)
14. [Testing Strategy](#testing-strategy)

---

## Application Architecture

### Tech Stack Alignment

**Framework & Core:**
- React 18+ with TypeScript for type safety
- React Router v6+ for client-side routing
- Vite for build tooling (fast HMR, optimized builds)

**State Management:**
- React Query for server state (campaigns, recipients, stats)
- Redux Toolkit exclusively for auth state
- Local component state for UI-only data

**UI Layer:**
- shadcn/ui for consistent, accessible components
- Tailwind CSS for styling (comes with shadcn/ui)
- React Hook Form for form handling
- Zod for schema validation (shared with backend)

### Architecture Pattern

**Feature-Based Architecture:**
```
Page Component → Feature Components → Shared Components
     ↓                    ↓                    ↓
  React Query       React Query         Local State
     ↓                    ↓                    ↓
  API Services     API Services         Props/Context
```

**Separation of Concerns:**
- **Pages:** Route-level components, layout composition
- **Features:** Business logic, domain-specific UI
- **Components:** Reusable UI primitives
- **Services:** API communication, data transformation
- **Hooks:** Reusable stateful logic

---

## State Management Strategy

### React Query for Server State (Primary)

**Why React Query?**
- Automatic caching and background refetching
- Optimistic updates for better UX
- Loading/error states built-in
- Deduplicates requests automatically
- Handles retries and stale data

**What Goes in React Query:**
- Campaigns list and details
- Recipients data
- Campaign stats
- User profile data
- All server-side data

**Query Organization:**
```typescript
// Query Keys Structure
['campaigns']                          // All campaigns
['campaigns', { status: 'draft' }]    // Filtered campaigns
['campaigns', id]                      // Single campaign
['campaigns', id, 'stats']            // Campaign stats
['recipients']                         // All recipients
```

### Redux for Auth State (Secondary)

**Why Redux for Auth Only?**
- Auth state is client-specific but global
- Needs immediate synchronous access across app
- Simple slice, no complex reducers
- Persists across page reloads

**Auth State Structure:**
```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  token: string | null
}
```

**Why Not Redux for Everything?**
- React Query handles server state better
- Redux adds boilerplate for simple data fetching
- React Query has built-in caching logic
- Avoids prop drilling and context complexity

### Local Component State (Tertiary)

**What Goes in Local State:**
- Form inputs (controlled components)
- UI toggles (modals, dropdowns)
- Temporary UI states (hover, focus)
- Draft data before submission

**Why Local State?**
- Simple, no external dependencies
- Component-scoped, no global pollution
- Perfect for ephemeral UI state

### Auth Token Storage Strategy

**HTTP-Only Cookies (Primary):**
- Tokens stored in HTTP-only cookies by backend
- Automatic CSRF protection
- Not accessible via JavaScript (security)
- Survives page refreshes

**Implementation:**
- Backend sets `auth_token` cookie on login
- Backend clears cookie on logout
- All API requests include cookies automatically
- No manual token management needed

**Why Not LocalStorage?**
- Vulnerable to XSS attacks
- Manual token management required
- Requires CSRF protection separately
- HTTP-only cookies are more secure

---

## API Integration Layer

### Services Structure (Aligned with Backend API)

**Service Organization:**
```
/services
  ├── api.ts              # Axios instance, interceptors
  ├── auth.service.ts     # POST /auth/register, /auth/login
  ├── campaigns.service.ts # All /campaigns/* endpoints
  └── types.ts            # API response types
```

### Backend API Contract Alignment

**Response Format (All Endpoints):**
```typescript
// Success Response
{
  success: true,
  data: <resource>
}

// Error Response
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    details?: <validation errors>
  }
}
```

**API Endpoints Mapped to Services:**

| Frontend Service | Backend Endpoint | Method | Purpose |
|-----------------|------------------|--------|---------|
| `authService.register()` | `/auth/register` | POST | User registration |
| `authService.login()` | `/auth/login` | POST | User login |
| `campaignService.getAll()` | `/campaigns` | GET | List campaigns with filters |
| `campaignService.getById()` | `/campaigns/:id` | GET | Single campaign with recipients |
| `campaignService.create()` | `/campaigns` | POST | Create new campaign |
| `campaignService.update()` | `/campaigns/:id` | PATCH | Update campaign (draft only) |
| `campaignService.delete()` | `/campaigns/:id` | DELETE | Delete campaign (draft only) |
| `campaignService.schedule()` | `/campaigns/:id/schedule` | POST | Schedule campaign |
| `campaignService.send()` | `/campaigns/:id/send` | POST | Send campaign immediately |
| `campaignService.getStats()` | `/campaigns/:id/stats` | GET | Campaign statistics |

### API Client Configuration

**Base Axios Instance:**
- Base URL from environment variable
- Request/response interceptors for response envelope handling
- Automatic cookie inclusion (credentials: 'include')
- Error response transformation

**Response Interceptor Strategy:**
```typescript
// Unwrap backend response envelope
response.data = response.data.data

// Transform errors to consistent format
error.response.data = {
  success: false,
  error: error.response.data.error
}
```

**Error Handling Strategy (Aligned with Backend HTTP Codes):**
- `400` → Validation error (show field-level errors)
- `401` → Authentication failed (redirect to login, clear auth state)
- `403` → Authorization/state conflict (show specific error message)
- `404` → Resource not found (show not found message)
- `500` → Server error (show server error message)

**State Conflict Handling (403 Responses):**
- "Not draft status" → Disable edit/delete buttons
- "Not draft or scheduled status" → Disable send button
- "Scheduled time in past" → Show validation error

### React Query Hooks Organization (Backend API Aligned)

**Custom Hooks Pattern:**
```
/hooks
  ├── /queries
  │   ├── useCampaigns.ts      # GET /campaigns with filters
  │   ├── useCampaign.ts       # GET /campaigns/:id
  │   └── useCampaignStats.ts  # GET /campaigns/:id/stats
  └── /mutations
      ├── useAuthMutations.ts      # POST /auth/register, /auth/login
      └── useCampaignMutations.ts  # POST/PATCH/DELETE /campaigns/*
```

**Query Hook Pattern (GET /campaigns):**
```typescript
// Aligned with backend query params
useCampaigns({
  status: 'draft' | 'scheduled' | 'sent',
  page: 1,
  limit: 20
})
```

**Query Hook Pattern (GET /campaigns/:id):**
```typescript
// Returns campaign with embedded recipients array
useCampaign(campaignId)
// Returns: { campaign, recipients[], created_by{} }
```

**Query Hook Pattern (GET /campaigns/:id/stats):**
```typescript
// Returns pre-calculated stats from backend
useCampaignStats(campaignId)
// Returns: { total, sent, failed, opened, open_rate, send_rate }
```

**Mutation Hook Pattern:**
- Optimistic updates for campaign status changes
- Rollback on 403/404 errors
- Automatic cache invalidation:
  - Create/update/delete → invalidate `useCampaigns`
  - Schedule/send → invalidate campaign detail & stats
  - Stats queries refetch on window focus

**Stats Caching Strategy:**
- Campaign list: 5 minute stale time
- Campaign detail: 10 minute stale time  
- Campaign stats: 30 second stale time (frequent updates during sends)

### Type Definitions (Backend Response Aligned)

**Campaign Types (Matching Backend Response):**
```typescript
interface Campaign {
  id: string;                    // UUID
  name: string;
  subject: string;
  body: string;                  // HTML content
  status: 'draft' | 'scheduled' | 'sent';
  scheduled_at: string | null;   // ISO datetime or null
  created_by: {
    id: string;                  // UUID
    name: string;
  };
  created_at: string;            // ISO datetime
  updated_at: string;            // ISO datetime
  recipient_count: number;       // For list view
  recipients?: Recipient[];      // Only in detail view
}

interface Recipient {
  id: string;                    // UUID
  email: string;
  name: string | null;
  sent_at: string | null;        // ISO datetime
  opened_at: string | null;      // ISO datetime
  status: 'pending' | 'sent' | 'failed';
}

interface CampaignStats {
  total: number;
  sent: number;
  failed: number;
  opened: number;
  open_rate: number;             // Pre-calculated by backend
  send_rate: number;             // Pre-calculated by backend
}

interface CampaignListResponse {
  campaigns: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

**API Response Wrapper:**
```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
```

### Request/Response Transformation

**Request Transformations:**
- Convert Date objects to ISO strings for scheduled_at
- Format recipient_ids array as expected by backend
- Remove undefined/null values from PATCH requests

**Response Transformations:**
- Convert ISO strings to Date objects for display
- Unwrap backend response envelope `{success, data}`
- Transform 403 errors to specific state machine messages

---

## Routing & Page Structure

### Route Configuration

**Public Routes:**
- `/login` - Login page
- `/register` - Registration page

**Protected Routes:**
- `/campaigns` - Campaign list page
- `/campaigns/new` - Create campaign page
- `/campaigns/:id` - Campaign detail page
- `/campaigns/:id/edit` - Edit campaign page

**Route Protection Strategy:**
- Higher-order component for auth check
- Redirect to login if not authenticated
- Preserve intended destination for redirect back

### Page Component Structure

**Page Responsibilities:**
- Compose feature components
- Manage page-level state
- Handle page-level navigation
- Load data via React Query hooks

**Page Layout Pattern:**
```
<AppLayout>
  <Sidebar />
  <MainContent>
    <Header />
    <PageContent />
  </MainContent>
</AppLayout>
```

### Navigation Architecture

**Primary Navigation:**
- Sidebar navigation for main sections
- Campaign list as default view
- Quick actions (New Campaign)

**Breadcrumb Navigation:**
- Campaigns → Spring Sale
- Campaigns → New Campaign
- Helps with context awareness

**Programmatic Navigation:**
- After successful login → Campaign list
- After campaign creation → Campaign detail
- After campaign deletion → Campaign list

---

## Component Design

### Component Hierarchy

**Page-Level Components:**
- `CampaignListPage` - Campaigns list page
- `CampaignDetailPage` - Campaign detail page
- `CampaignFormPage` - Create/edit campaign
- `LoginPage` - Authentication

**Feature Components:**
- `CampaignCard` - Campaign summary display
- `CampaignStats` - Stats visualization
- `RecipientSelector` - Recipient management
- `SchedulePicker` - Date/time selection
- `CampaignActions` - Action buttons

**Shared Components:**
- `StatusBadge` - Campaign status display
- `Button` - Enhanced shadcn button
- `Input` - Enhanced shadcn input
- `Modal` - Dialog wrapper
- `EmptyState` - No data message

### Component Design Principles

**Single Responsibility:**
- Each component has one clear purpose
- Components are composable, not monolithic

**Props Interface:**
- Clear, typed props
- Minimal prop drilling
- Composition over inheritance

**Styling Strategy:**
- Tailwind utility classes
- shadcn/ui base components
- Consistent spacing and colors
- Responsive design mobile-first

### Status Badge Component

**Status Mapping:**
```typescript
draft → Grey color, "Draft" label
scheduled → Blue color, "Scheduled" label  
sent → Green color, "Sent" label
```

**Visual Design:**
- Pill-shaped badge
- Color-coded by status
- Consistent sizing
- Accessible color contrast

---

## UI/UX Behavior

### Loading States

**Page-Level Loading:**
- Full-page skeleton loaders
- Shimmer effect during initial load
- Preserves layout structure

**Component-Level Loading:**
- Button spinners for actions
- Inline skeletons for cards
- Progress indicators for long operations

**Optimistic UI:**
- Immediate UI update on actions
- Revert on error
- Shows confidence in system

### Error States

**Form Validation Errors:**
- Field-level error messages
- Red outline on invalid fields
- Clear, actionable error text

**API Error Handling:**
- Toast notifications for global errors
- Inline errors for form submissions
- Error boundaries for crashes

**Error Recovery:**
- Retry buttons for failed requests
- Clear guidance on next steps
- Preserve user data when possible

### Empty States

**No Campaigns:**
- Friendly illustration
- Clear call-to-action
- "Create your first campaign"

**No Recipients:**
- Explanation of value
- "Add recipients to get started"
- Link to recipient management

**No Results:**
- After filtering/searching
- "No campaigns match your filters"
- Clear filters button

### Form Validation

**Real-Time Validation:**
- Validate on blur
- Show errors immediately
- Clear errors on input

**Schema Validation:**
- Zod schemas matching backend
- Consistent validation rules
- Type-safe form submission

**Submit Validation:**
- Validate all fields before submit
- Disable submit button if invalid
- Show loading state during submit

---

## Data Flow (Backend API Aligned)

### Campaign List Data Flow

```
User visits /campaigns
    ↓
CampaignListPage mounts
    ↓
useCampaigns({ status, page, limit }) hook called
    ↓
React Query checks cache (5 min stale time)
    ↓ (if stale)
API call: GET /campaigns?status=draft&page=1&limit=20
    ↓
Backend response: { success: true, data: { campaigns[], pagination{} } }
    ↓
Axios interceptor unwraps response.data.data
    ↓
Cache updated with campaigns array + pagination meta
    ↓
Component re-renders with data
```

### Campaign Creation Data Flow

```
User fills campaign form
    ↓
Local form state updates (React Hook Form)
    ↓
User clicks "Create Campaign"
    ↓
Zod validation against backend schema
    ↓ (valid)
useCreateCampaign() mutation called
    ↓
API call: POST /campaigns { name, subject, body, recipient_ids[] }
    ↓ (success 201)
Backend response: { success: true, data: campaign{} }
    ↓
Invalidate campaigns query (auto-refetch)
    ↓
Redirect to /campaigns/:id (detail view)
    ↓ (error 400/404)
Show validation errors from details object
    ↓
Preserve form data for retry
```

### Campaign Schedule Data Flow

```
User views draft campaign
    ↓
Clicks "Schedule" button
    ↓
SchedulePicker modal opens
    ↓
User selects future date/time
    ↓
Client validation: date > current time
    ↓ (valid)
useScheduleCampaign() mutation called
    ↓
API call: POST /campaigns/:id/schedule { scheduled_at: "ISO-8601" }
    ↓ (success 200)
Backend response: { success: true, data: campaign{ status: "scheduled" } }
    ↓
Optimistic update: campaign status = "scheduled"
    ↓
Invalidate campaign detail query
    ↓
Show success toast, redirect to campaign detail
    ↓ (error 400)
"Date must be in future" from backend validation
    ↓
Show field error on SchedulePicker
    ↓ (error 403)
"Campaign is not in draft status"
    ↓
Disable schedule button, redirect to campaign detail
```

### Campaign Send Data Flow

```
User views draft/scheduled campaign
    ↓
Clicks "Send Now" button
    ↓
Confirmation dialog: "Send to {recipient_count} recipients?"
    ↓ (confirmed)
useSendCampaign() mutation called
    ↓
API call: POST /campaigns/:id/send (no body)
    ↓ (success 200)
Backend response: { success: true, data: { campaign_id, queued: true, recipient_count } }
    ↓
Optimistic update: campaign status = "sent"
    ↓
Invalidate campaign detail + stats queries
    ↓
Show "Campaign sent!" toast
    ↓
Start polling stats (30s intervals) to track progress
    ↓ (error 403)
"Campaign cannot be sent from current status"
    ↓
Show state machine error in toast
```

### Auth Login Data Flow

```
User enters email + password
    ↓
Form submission (React Hook Form)
    ↓
Zod validation (email format, password length)
    ↓ (valid)
useLogin() mutation called
    ↓
API call: POST /auth/login { email, password }
    ↓ (success 200)
Backend response: { success: true, data: { user{}, token } }
    ↓
Backend sets HTTP-only cookie: auth_token=jwt (automatic)
    ↓
Redux auth state updated: { user, isAuthenticated: true }
    ↓
Redirect to /campaigns
    ↓ (error 401)
"Invalid credentials" from backend
    ↓
Show error toast, clear password field
```

### Stats Polling Data Flow

```
Campaign status = "sent" or sending in progress
    ↓
useCampaignStats(campaignId) mounts
    ↓
API call: GET /campaigns/:id/stats
    ↓
Backend response: { success: true, data: { total, sent, failed, opened, open_rate, send_rate } }
    ↓ (active send)
Enable 30-second refetch interval
    ↓
Background refetch while user views campaign
    ↓ (send complete)
Stop polling, cache for 5 minutes
    ↓
Display real-time stats updates
```

---

## Conditional UI Logic (Backend State Machine Aligned)

### Campaign Action Buttons (Based on Backend Status)

**Visibility Rules (Matching Backend State Machine):**
```typescript
// From backend: draft → scheduled → sent (terminal)

Create Campaign:  Always visible (if authenticated)
View Campaign:    Always visible
Edit:             visible only if status === 'draft' (backend 403 otherwise)
Delete:           visible only if status === 'draft' (backend 403 otherwise)
Schedule:         visible only if status === 'draft' (backend 403 otherwise)
Send:             visible if status === 'draft' || status === 'scheduled'
Cancel Schedule:  visible only if status === 'scheduled'
View Stats:       visible if status === 'sent' (meaningful data)
```

**Button State Management:**
- Disable all buttons during API mutations
- Show loading spinner on active action button
- Hide buttons after successful status transition
- Re-enable on error with toast message

### Status-Based UI Elements (Backend Response Aligned)

**Draft Status:**
- Badge: Grey "Draft" badge
- Actions: Edit, Delete, Schedule, Send buttons
- Metadata: Show "Last updated {updated_at}"
- Recipients: Show "Add recipients" if count === 0
- Stats: Hide stats section (not relevant)

**Scheduled Status:**
- Badge: Blue "Scheduled" badge
- Actions: Send, Cancel Schedule buttons
- Metadata: Show "Scheduled for {scheduled_at}" prominently
- Recipients: Show recipient count with checkmarks
- Stats: Hide stats section (not sent yet)
- Validation: Prevent edit (backend returns 403)

**Sent Status:**
- Badge: Green "Sent" badge
- Actions: No action buttons (terminal state)
- Metadata: Show "Sent {updated_at}" timestamp
- Recipients: Show delivery status per recipient
- Stats: Show prominent stats cards (open_rate, send_rate)
- Validation: Disable all edit/delete buttons

### Backend Error Handling in UI

**403 State Conflict Errors:**
```typescript
// Backend returns specific 403 messages:
"Campaign is not in draft status" → Hide edit/delete, redirect to detail
"Only draft campaigns can be edited" → Show toast, disable edit button
"Only draft or scheduled campaigns can be sent" → Disable send button
```

**400 Validation Errors:**
```typescript
// Backend returns field-level errors in details object:
"scheduled_at must be in future" → Show error on SchedulePicker
"recipient_ids must contain at least 1 recipient" → Show recipient error
"Email format is invalid" → Show error on email field
```

### Recipient Management UI (Embedded in Campaign)

**Since recipients are returned in GET /campaigns/:id:**
- Show recipients list on campaign detail page
- Display recipient status: pending/sent/failed
- Show individual recipient stats: sent_at, opened_at
- Add/remove recipients via campaign edit (PATCH /campaigns/:id)
- No standalone recipient management pages needed

**Recipient Status Display:**
```typescript
pending → Grey dot, "Not sent yet"
sent → Green dot, "Sent {sent_at}"
failed → Red dot, "Failed to send"
opened → Blue dot, "Opened {opened_at}" (only if sent)
```

---

## Folder Structure Mapping

### Complete Frontend Structure

```
/frontend
  /src
    /app
      ├── App.tsx                 # Root component, routing
      ├── main.tsx                # Entry point
      └── vite-env.d.ts          # Vite types

    /pages
      ├── CampaignListPage.tsx
      ├── CampaignDetailPage.tsx
      ├── CampaignFormPage.tsx
      ├── LoginPage.tsx
      └── RegisterPage.tsx

    /features
      /auth
        ├── components/
        │   ├── LoginForm.tsx
        │   └── RegisterForm.tsx
        ├── hooks/
        │   └── useAuth.ts
        └── types.ts

      /campaigns
        ├── components/
        │   ├── CampaignCard.tsx
        │   ├── CampaignStats.tsx
        │   ├── CampaignActions.tsx
        │   ├── CampaignForm.tsx
        │   ├── RecipientSelector.tsx
        │   └── SchedulePicker.tsx
        ├── hooks/
        │   ├── useCampaigns.ts
        │   ├── useCampaign.ts
        │   └── useCampaignMutations.ts
        └── types.ts

      /recipients
        ├── components/
        │   ├── RecipientList.tsx       # Embedded in campaign detail
        │   ├── RecipientItem.tsx       # Individual recipient display
        │   └── RecipientSelector.tsx   # Multi-select for campaign edit
        └── types.ts                    # Recipient data types

    /components
      ├── /ui                     # shadcn/ui components
      │   ├── button.tsx
      │   ├── input.tsx
      │   ├── card.tsx
      │   └── ...
      ├── /layout
      │   ├── AppLayout.tsx
      │   ├── Sidebar.tsx
      │   └── Header.tsx
      └── /common
          ├── StatusBadge.tsx
          ├── EmptyState.tsx
          ├── LoadingSpinner.tsx
          └── ErrorBoundary.tsx

    /services
      ├── api.ts                  # Axios configuration, interceptors
      ├── auth.service.ts         # POST /auth/register, /auth/login
      ├── campaigns.service.ts    # All /campaigns/* endpoints
      └── types.ts                # API response types

    /store
      ├── index.ts                # Store configuration
      └── slices/
          └── authSlice.ts        # Auth state management

    /hooks
      ├── useAuth.ts              # Auth hook
      ├── useToast.ts             # Toast notifications
      └── useModal.ts             # Modal state

    /routes
      ├── index.tsx               # Route configuration
      ├── ProtectedRoute.tsx      # Auth wrapper
      └── PublicRoute.tsx         # Public route wrapper

    /types
      ├── campaign.types.ts
      ├── recipient.types.ts
      ├── auth.types.ts
      └── api.types.ts

    /utils
      ├── date.ts                 # Date formatting
      ├── validation.ts           # Zod schemas
      ├── format.ts               # Number/text formatting
      └── constants.ts            # App constants

  public/
    └── favicon.ico

  .env                            # Environment variables
  .env.example                   # Env template
  .eslintrc.cjs                  # ESLint config
  .prettierrc                    # Prettier config
  tsconfig.json                  # TypeScript config
  tsconfig.paths.json            # Path aliases
  vite.config.ts                 # Vite configuration
  package.json
  tailwind.config.js             # Tailwind config
  index.html
```

---

## Environment Configuration

### Environment Variables Strategy

**Why .env Files?**
- Sensitive data never in code
- Different configs per environment
- Easy deployment management
- Security best practice

### Required Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### Environment-Specific Files

**Development:** `.env.development`
```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_ENABLE_DEBUG=true
```

**Production:** `.env.production`
```bash
VITE_API_URL=https://api.martech.com/api/v1
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

### Usage in Application

**Access Pattern:**
```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

**Validation:**
- Validate required env vars on app start
- Show clear error if missing
- Fail fast in development

### Security Considerations

**VITE_ Prefix Required:**
- Only vars with VITE_ prefix are exposed
- Prevents accidental leakage
- Vite handles this automatically

**Never Commit .env Files:**
- Add to .gitignore
- Provide .env.example as template
- Document required variables

---

## Path Alias Strategy

### Why Path Aliases?

**Problems with Relative Imports:**
```typescript
// Hard to read and maintain
import { Button } from '../../../components/ui/button'
import { useCampaigns } from '../../../../features/campaigns/hooks/useCampaigns'
```

**Benefits of Aliases:**
```typescript
// Clean and maintainable
import { Button } from '@/components/ui/button'
import { useCampaigns } from '@/features/campaigns/hooks/useCampaigns'
```

### Alias Configuration

**TypeScript Configuration (tsconfig.json):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/pages/*": ["./src/pages/*"],
      "@/services/*": ["./src/services/*"],
      "@/store/*": ["./src/store/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/routes/*": ["./src/routes/*"]
    }
  }
}
```

**Vite Configuration (vite.config.ts):**
```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/routes': path.resolve(__dirname, './src/routes'),
    }
  }
})
```

### Usage Guidelines

**Import Organization:**
1. External libraries (react, react-router-dom)
2. Internal aliases (@/)
3. Relative imports (./, ../)
4. TypeScript imports

**When to Use Each Alias:**
- `@/components/*` - Shared UI components
- `@/features/*` - Feature-specific code
- `@/pages/*` - Page components
- `@/services/*` - API services
- `@/store/*` - Redux store setup
- `@/hooks/*` - Custom React hooks
- `@/types/*` - TypeScript types
- `@/utils/*` - Utility functions
- `@/routes/*` - Route configuration

---

## Performance Considerations

### Code Splitting Strategy

**Route-Based Splitting:**
- Lazy load page components
- Separate bundles per route
- Faster initial load

**Component-Based Splitting:**
- Lazy load modals
- Lazy load heavy components
- Dynamic imports for features

### Data Caching Strategy

**React Query Cache Configuration:**
```typescript
// Campaigns data: 5 minutes
staleTime: 5 * 60 * 1000

// User data: 10 minutes
staleTime: 10 * 60 * 1000

// Stats data: 30 seconds
staleTime: 30 * 1000
```

**Background Refetching:**
- Refetch on window focus
- Refetch on reconnection
- Smart refetch intervals

### Bundle Optimization

**Tree Shaking:**
- Import specific functions, not entire libraries
- Remove unused code
- Keep bundle size minimal

**Image Optimization:**
- Use WebP format when possible
- Lazy load images
- Responsive images

### Network Optimization

**Request Batching:**
- Batch multiple requests
- Reduce HTTP overhead
- Parallel independent requests

**Pagination:**
- Limit data per request
- Infinite scroll or load more
- Don't fetch everything at once

---

## Edge Cases (Backend Error Handling Aligned)

### Authentication Edge Cases

**Token Expiry (401 Response):**
- HTTP-only cookies handled by backend
- Auto-redirect to login on any 401 response
- Preserve intended destination for post-login redirect
- Clear Redux auth state on 401

**Concurrent Login Requests:**
- Disable login button during API call
- Show loading spinner on button
- Prevent double form submission

**Invalid Credentials (401 Response):**
- Backend returns: "Invalid credentials"
- Clear password field only
- Show error toast with backend message
- Keep email populated for retry

### Campaign State Machine Edge Cases

**Edit Non-Draft Campaign (403 Response):**
- Backend returns: "Only draft campaigns can be edited"
- Disable edit/delete buttons when status !== 'draft'
- Show error toast if user somehow triggers edit
- Redirect to campaign detail view

**Send Invalid Status Campaign (403 Response):**
- Backend returns: "Only draft or scheduled campaigns can be sent"
- Disable send button for 'sent' status campaigns
- Show state machine error in toast
- Keep campaign in current state

**Schedule Past Date/Time (400 Response):**
- Backend validates: scheduled_at must be > CURRENT_TIMESTAMP
- Frontend pre-validates before API call
- Show field error: "Schedule time must be in the future"
- Clear error when user selects valid time

**Delete Non-Draft Campaign (403 Response):**
- Backend returns: "Only draft campaigns can be deleted"
- Hide delete button for non-draft campaigns
- Show error toast if triggered
- Keep campaign detail view open

**Schedule Already Scheduled Campaign (403 Response):**
- Backend returns: "Campaign is not in draft status"
- Hide "Schedule" button for 'scheduled' and 'sent' campaigns
- Show "Cancel Schedule" option for 'scheduled' campaigns only

### Network Edge Cases

**Offline Mode:**
- React Query pauses retries when offline
- Show "You're offline" banner
- Queue failed requests for auto-retry on reconnect
- Preserve optimistic updates during offline

**Slow Network:**
- Show skeleton loaders, not spinners
- Increase React Query timeout for large requests
- Progressive rendering: show basic content first
- Cancel stale requests on new navigation

**Server Error (500 Response):**
- Backend returns: { success: false, error: { message } }
- Show generic error toast: "Something went wrong"
- Provide "Retry" button for failed mutations
- Fallback to cached data if available

### Data Edge Cases

**Empty Campaign List:**
- Backend returns: { campaigns: [], pagination: { total: 0 } }
- Show EmptyState component
- Call-to-action: "Create your first campaign"
- Hide filter controls when no data

**No Recipients on Campaign:**
- Backend returns: { recipients: [], recipient_count: 0 }
- Show warning: "Add recipients before sending"
- Disable "Send" and "Schedule" buttons
- Show "Add Recipients" prompt

**Large Campaign List:**
- Backend pagination: { page, limit, total }
- Show "Load More" button or infinite scroll
- Display total count: "Showing 1-20 of 45 campaigns"
- Cache individual pages separately

**Stats During Active Send:**
- Backend returns partial stats: { sent: 50, total: 100, send_rate: 0.5 }
- Show progress indicator: "Sending... 50/100 sent"
- Poll stats endpoint every 30 seconds
- Stop polling when sent = total or status = 'sent'

---

## Testing Strategy

### Unit Testing

**Component Testing:**
- Test component rendering
- Test user interactions
- Test conditional rendering
- Test error states

**Hook Testing:**
- Test custom hooks behavior
- Test state changes
- Test error handling
- Test cleanup

**Utility Testing:**
- Test utility functions
- Test data transformations
- Test validation logic
- Test edge cases

### Integration Testing

**Service Testing:**
- Test API calls
- Test error handling
- Test data transformation
- Mock API responses

**Flow Testing:**
- Test user journeys
- Test page navigation
- Test form submission
- Test error recovery

### E2E Testing

**Critical Paths:**
- Login flow
- Campaign creation
- Campaign sending
- Stats viewing

**Cross-Browser Testing:**
- Chrome, Firefox, Safari
- Mobile responsive
- Accessibility testing

### Performance Testing

**Load Time:**
- Initial bundle size
- Time to interactive
- First contentful paint

**Runtime Performance:**
- Large list rendering
- Form performance
- Memory usage

---

## Backend API Alignment Summary

This frontend design is fully aligned with the backend API contract defined in BACKEND_DESIGN.md. Key alignment points:

### API Contract Mapping
**Frontend → Backend Endpoint Mapping:**
- All service methods map 1:1 to backend endpoints
- Response format handling: `{success, data/error}` envelope unwrapping
- HTTP status code handling: 401 (auth), 403 (state conflicts), 404 (not found)
- Query parameter alignment: status filtering, pagination

### State Machine Alignment
**Frontend UI enforces backend state machine:**
```typescript
draft → scheduled → sent (terminal)

Frontend buttons reflect backend transitions:
- Edit/Delete: Only for 'draft' (backend 403 otherwise)
- Schedule: Only for 'draft' (backend 403 otherwise)  
- Send: For 'draft' and 'scheduled' (backend 403 for 'sent')
- Stats: Only meaningful for 'sent' status
```

### Data Structure Alignment
**TypeScript types match backend response shapes:**
```typescript
// Backend returns this structure:
{
  success: true,
  data: {
    campaign: {
      id, name, subject, body, status, scheduled_at,
      created_by: {id, name}, created_at, updated_at,
      recipients: [{id, email, name, sent_at, opened_at, status}]
    }
  }
}

// Frontend types match exactly
interface Campaign {
  id: string;
  name: string;
  // ... matches backend field by field
}
```

### Error Handling Alignment
**Frontend handles backend error responses:**
- 403 errors → Disable specific buttons, show state conflict messages
- 400 errors → Show field-level validation errors from details object
- 404 errors → Show not found messages, redirect appropriately
- 500 errors → Show generic error messages with retry options

### Recipients Handling
**Recipients embedded in campaigns (no standalone endpoints):**
- Recipients returned in `GET /campaigns/:id` response
- Add/remove recipients via `PATCH /campaigns/:id` with recipient_ids array
- Display recipients on campaign detail page
- No separate recipient management pages needed

### Stats Display
**Stats are pre-calculated by backend:**
- Frontend displays backend-calculated open_rate and send_rate
- No frontend calculation needed (just display)
- Poll stats endpoint during active sends for real-time updates

### Authentication Flow
**JWT with HTTP-only cookies:**
- Backend sets cookie on successful login/register
- Frontend doesn't handle token storage manually
- Cookie automatically sent with all API requests
- 401 responses trigger automatic redirect to login

This tight alignment ensures the frontend and backend work together seamlessly, with clear error handling and consistent user experience.

---

## Summary

This frontend design prioritizes:

1. **Backend API Alignment** - 1:1 mapping with backend endpoints, response types, and error handling
2. **Type Safety** - TypeScript throughout, types match backend response structures exactly
3. **State Machine Consistency** - UI enforces backend state machine (draft → scheduled → sent)
4. **Developer Experience** - Path aliases, clear structure, good tooling
5. **User Experience** - Optimistic updates, loading states, comprehensive error handling
6. **Performance** - Code splitting, smart caching, bundle optimization
7. **Maintainability** - Feature-based structure, clear separation of concerns
8. **Security** - HTTP-only cookies, env variables, input validation

### Key Architectural Decisions

**React Query for Server State:**
- Handles caching, refetching, stale data
- Better than Redux for API data
- Reduces boilerplate significantly

**Redux for Auth Only:**
- Simple, focused state management
- Persists across page reloads
- Easy to debug and test

**HTTP-Only Cookies:**
- Most secure approach
- No manual token management
- Automatic CSRF protection

**Feature-Based Structure:**
- Scales well with app size
- Clear code organization
- Easy to find and modify code

**Path Aliases:**
- Clean, readable imports
- Easier refactoring
- Better developer experience

---

## Implementation Order

### Phase 1: Foundation
1. Project setup (Vite, TypeScript, Tailwind)
2. Configure path aliases
3. Setup shadcn/ui
4. Create base layout structure
5. Configure routing

### Phase 2: Authentication
1. Create auth pages
2. Setup Redux store
3. Implement auth service
4. Create protected routes
5. Add logout functionality

### Phase 3: Core Features
1. Campaign list page
2. Campaign detail page
3. Campaign create/edit forms
4. Recipient management
5. Campaign actions (send, schedule)

### Phase 4: Polish
1. Loading states
2. Error handling
3. Empty states
4. Notifications
5. Accessibility improvements

---

This design provides a solid foundation for building a production-ready frontend that aligns perfectly with your backend architecture. The separation of concerns, clear data flow, and type safety will make the codebase maintainable and scalable.