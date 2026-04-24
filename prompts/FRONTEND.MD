You are a senior frontend engineer designing a production-ready React application.

Your task is to DESIGN the frontend system — NOT implement code yet.

IMPORTANT:
- Do NOT write React code
- Focus on architecture, state management, data flow, and UX behavior
- Keep the design simple, maintainable, and aligned with the backend API
- Do NOT over-engineer

---

## CONTEXT

We are building a frontend for a campaign management system.

Tech stack:
- React 18+ with TypeScript
- React Query (for server state)
- Redux (for minimal global state, e.g. auth)
- shadcn/ui (UI components)
- Backend is REST API with JWT authentication

---

## PROJECT STRUCTURE

The frontend must be implemented inside a `frontend/` folder.

Use a feature-based structure:

/frontend
  /src
    /features
      /auth
      /campaigns
    /components
    /layouts
    /pages
    /services
    /store
    /hooks
    /types
    /utils
  .env
  tsconfig.json

---

## ENVIRONMENT CONFIGURATION (IMPORTANT)

Design how environment variables are handled:

- Use `.env` for:
  - API base URL
  - environment-specific configs

- Follow best practices:
  - no hardcoded URLs
  - clear naming convention (e.g. VITE_API_URL or similar)
  - safe usage in code

Explain how env variables are accessed in the app.

---

## PATH ALIASES (IMPORTANT)

Design path alias strategy to avoid relative imports like `../../../`.

- Example:
  - `@/components`
  - `@/features`
  - `@/services`

Explain:
- how aliases are structured
- how they improve maintainability

---

## REQUIREMENTS

### Pages

- /login
- /campaigns
- /campaigns/new
- /campaigns/:id

---

### UI Features

- Status badge:
  - draft = grey
  - scheduled = blue
  - sent = green

- Actions:
  - Schedule, Send, Delete (conditional)

- Stats:
  - open rate
  - send rate

- Error handling
- Loading states

---

## TECH CONSTRAINTS

- React Query for server state
- Redux ONLY when necessary (e.g. auth)
- shadcn/ui for UI
- TypeScript strictly

---

## YOUR TASK

Produce a COMPLETE frontend design with these sections:

### 1. Application Architecture

### 2. State Management Strategy (CRITICAL)
- React Query vs Redux vs local state
- Auth handling (token storage, persistence)
- Explain WHY

### 3. API Integration Layer
- services structure
- React Query hooks
- error handling

### 4. Routing & Page Structure

### 5. Component Design

### 6. UI/UX Behavior
- loading
- error
- empty states
- form validation

### 7. Data Flow (IMPORTANT)

### 8. Conditional UI Logic

### 9. Folder Structure Mapping

### 10. Environment Configuration
- how `.env` is used
- how API URL is managed

### 11. Path Alias Strategy
- alias structure
- usage guidelines

### 12. Performance Considerations

### 13. Edge Cases

### 14. Testing Strategy

---

## OUTPUT FORMAT

- Clear sections
- Concise but precise
- Include short explanations for key decisions (1–2 sentences)
- Avoid over-engineering

---

REMEMBER:
This is a production frontend design.
Do NOT generate implementation code.