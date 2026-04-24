# Authentication Flow Implementation

## Overview

Complete authentication flow has been implemented using Redux for state management and React Router for navigation.

## Components Implemented

### 1. Redux Store (`src/store/`)
- **`authSlice.ts`**: Manages authentication state
  - `user`: User information (id, email, name)
  - `token`: JWT token
  - `isAuthenticated`: Boolean flag

### 2. Custom Hooks (`src/hooks/`)
- **`useAuth.ts`**: Main authentication hook
  - `login(email, password)`: Login function
  - `register(email, name, password)`: Register function
  - `logout()`: Logout function
  - `user`: Current user data
  - `isAuthenticated`: Auth status

### 3. Services (`src/services/`)
- **`auth.service.ts`**: API integration
  - `login()`: POST /auth/login
  - `register()`: POST /auth/register
  - `logout()`: POST /auth/logout (clears HTTP-only cookie)

### 4. Components (`src/features/auth/components/`)
- **`LoginForm.tsx`**: Login form with validation
  - Email and password fields
  - Zod schema validation
  - Error handling with toast notifications
  - Loading states

### 5. Protected Routes (`src/routes/`)
- **`ProtectedRoute.tsx`**: Route wrapper
  - Checks authentication status
  - Redirects to /login if not authenticated
  - Protects all campaign routes

### 6. Layout (`src/components/layout/`)
- **`Header.tsx`**: Navigation header
  - Displays user name/email
  - Logout button
  - Shown on all protected pages

## Authentication Flow

### Login Process
```
User enters credentials
    ↓
Form validation (Zod)
    ↓
login() called via useAuth hook
    ↓
authService.login() → POST /auth/login
    ↓
Backend: Validates credentials
    ↓
Backend: Sets HTTP-only cookie with JWT
    ↓
Backend: Returns { user, token }
    ↓
Redux: Stores user and token
    ↓
Frontend: Redirects to /campaigns
```

### Logout Process
```
User clicks logout button
    ↓
logout() called via useAuth hook
    ↓
authService.logout() → POST /auth/logout
    ↓
Backend: Clears HTTP-only cookie
    ↓
Redux: Clears auth state
    ↓
Frontend: Redirects to /login
```

## Protected Routes

All campaign routes are protected:
- `/campaigns` → Campaign list
- `/campaigns/new` → Create campaign
- `/campaigns/:id` → Campaign details
- `/campaigns/:id/edit` → Edit campaign

If not authenticated, users are automatically redirected to `/login`.

## Form Validation

Login form uses Zod schema validation:
- **Email**: Required, valid email format
- **Password**: Required, minimum 1 character

Error messages are displayed inline for each field.

## Token Management

- **Storage**: Redux store (in-memory)
- **Cookie**: HTTP-only cookie set by backend
- **API calls**: Automatic cookie inclusion via `withCredentials: true`
- **Security**: Token not accessible via JavaScript (HTTP-only cookie)

## Error Handling

All auth errors are handled gracefully:
- **Invalid credentials**: Show error toast
- **Network errors**: Show error toast
- **Validation errors**: Inline field errors
- **Unexpected errors**: Generic error message

## Usage Example

```typescript
// In any component
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return <div>Please login</div>
  }

  return (
    <div>
      Welcome, {user.name}!
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

## Next Steps

To complete the auth system:
1. Add registration page (/register)
2. Add "forgot password" flow
3. Add remember me functionality
4. Add session timeout handling
5. Add token refresh mechanism
6. Add loading skeletons for better UX

## Testing

Manual testing steps:
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Should redirect to `/login`
4. Try accessing `/campaigns` directly - should redirect to login
5. Enter credentials (need backend running)
6. On success, should redirect to `/campaigns`
7. Header should show user name and logout button
8. Click logout - should return to login page
