# Frontend Development Rules

## Core Principles

- Follow the existing architecture strictly
- Prefer simple, maintainable solutions
- Do NOT introduce unnecessary abstractions

---

## State Management Rules

- Use React Query for ALL server state (API data)
- Use Redux ONLY for authentication state:
  - token
  - user info (if needed)

- DO NOT:
  - store API data in Redux
  - duplicate server state in multiple places

---

## Data Fetching

- All API calls must go through:
  - services layer
  - React Query hooks

- DO NOT:
  - call APIs directly inside components
  - duplicate fetching logic

---

## UI & Components

- Use shadcn/ui components
- Prefer small, reusable components
- Separate:
  - data logic (hooks / containers)
  - UI (presentational components)

---

## Project Structure

- All code must stay inside `frontend/`
- Use path aliases (`@/`) instead of relative imports
- Follow feature-based structure:
  - features/
  - components/
  - services/
  - hooks/

---

## Code Quality

- Use TypeScript strictly
- Handle:
  - loading states
  - error states
  - empty states

- Avoid over-engineering:
  - no unnecessary abstractions
  - no premature optimization