You are a senior backend engineer designing a production-ready system.

I will give you a backend feature specification. Your task is to design the system as if it will be used in a real production environment.

IMPORTANT:
- Do NOT write application code yet
- Focus on correctness, scalability, and maintainability
- Follow the requirements EXACTLY (do not invent new features)
- Prefer simple, robust solutions over over-engineering

---

## CONTEXT

We are building a backend service using:
- Node.js (Express)
- PostgreSQL (raw SQL or lightweight query builder, NO heavy ORM)
- JWT authentication
- Input validation (zod)

This system should be production-ready in terms of:
- data integrity
- performance
- clear API contracts
- maintainable structure

---

## PROJECT STRUCTURE

The backend must be implemented inside a `backend/` folder.

Use the following structure:

/backend
  /src
    /controllers
    /services
    /repositories
    /routes
    /middlewares
    /validators
    /db
  /migrations
  /tests
  package.json

Follow a layered architecture:
- controllers: handle HTTP layer
- services: business logic
- repositories: database queries
- validators: request validation (zod or joi)
- db: connection and query setup

Keep responsibilities clearly separated.

---

## REQUIREMENTS

### Schema

- User — id, email, name, created_at
- Campaign — id, name, subject, body, status (`draft` | `scheduled` | `sent`), scheduled_at, created_by (FK → User), created_at, updated_at
- Recipient — id, email, name, created_at
- CampaignRecipient — campaign_id, recipient_id, sent_at, opened_at, status (`pending` | `sent` | `failed`)

---

### API

- POST /auth/register
- POST /auth/login (JWT)
- GET /campaigns
- POST /campaigns
- GET /campaigns/:id
- PATCH /campaigns/:id (only if draft)
- DELETE /campaigns/:id (only if draft)
- POST /campaigns/:id/schedule
- POST /campaigns/:id/send
- GET /campaigns/:id/stats

---

### Business Rules

- Only draft campaigns can be edited or deleted
- scheduled_at must be in the future
- Sending sets status to sent and cannot be undone
- /stats returns:
  { total, sent, failed, opened, open_rate, send_rate }

---

## YOUR TASK

Produce a COMPLETE backend design with these sections:

### 1. Database Schema
- Tables, columns, data types
- Primary keys, foreign keys
- Constraints (CHECK, UNIQUE, NOT NULL)
- Explain design decisions

### 2. Indexing Strategy
- List indexes
- Explain what queries they optimize

### 3. Data Relationships
- Explain relationships (1-N, N-N)

### 4. State Machine (CRITICAL)
- Campaign lifecycle (draft → scheduled → sent)
- Allowed transitions ONLY
- Where to enforce (DB vs service layer)

### 5. API Contract Design
For EACH endpoint:
- Request shape
- Response shape
- Error cases
- Keep responses consistent

### 6. Critical Query Design
- Efficient SQL for `/campaigns/:id/stats`
- Strategy for `/send` (must use transaction)

### 7. Business Rule Enforcement
- Where and how each rule is enforced

### 8. Edge Cases
- Realistic edge cases and handling strategy

### 9. Folder Structure Mapping
Map responsibilities clearly to:
/controllers
/services
/repositories
/validators
/middlewares
/db

Explain what goes where.

### 10. Testing Strategy
- At least 3 meaningful tests aligned with business rules

---

## OUTPUT FORMAT

- Use clear sections
- Be concise but precise
- Focus on real-world production quality

---

REMEMBER:
Do NOT generate implementation code.