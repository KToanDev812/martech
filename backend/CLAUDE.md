# Backend Development Guide

This file defines backend rules and architecture for the email campaign management service.

---

## Architecture Principles

### Layered Architecture (Strict)

Controllers (HTTP) → Services (Business Logic) → Repositories (Data Access) → Database

**Rules:**
- Controllers handle HTTP only (parse request, call service, format response)
- Services contain business logic and state transitions
- Repositories handle SQL queries and DB interaction
- No business logic in controllers or repositories
- No direct DB access outside repositories

---

## State Machine (Campaign Lifecycle)

States:
- draft
- scheduled
- sent (terminal)

**Valid transitions:**
- draft → scheduled
- draft → sent
- scheduled → sent

**Rules:**
- sent is terminal — no transitions allowed
- Only draft campaigns can be edited or deleted
- State transitions must be enforced in the service layer

---

## Database Design

- Use **UUID** for all primary keys
- Use **TIMESTAMP WITH TIME ZONE** (store in UTC)
- Use **CHECK constraints** for:
  - status values
  - scheduled_at > NOW()
- Use **FOREIGN KEYS** with:
  - ON DELETE RESTRICT (users → campaigns)
  - ON DELETE CASCADE (campaigns → campaign_recipients)

**Data integrity rules:**
- Prevent duplicate campaign-recipient pairs (composite PK)
- Avoid nullable fields unless necessary
- All critical rules must exist at DB level (defense in depth)

---

## Indexing Strategy

- Index frequently filtered fields:
  - campaigns(status)
  - campaigns(created_by)
  - campaign_recipients(campaign_id, status)

**Rules:**
- Every index must justify a query use case
- Avoid over-indexing

---

## Transactions & Concurrency

### Transactions (Mandatory)

- Multi-step operations must use transactions:
  - `/campaigns/:id/send`

**Example:**
- update campaign status
- update campaign recipients

→ must succeed or fail together (atomicity)

---

### Concurrency Control

- Prevent race conditions for critical operations
- Use row-level locking when necessary:
  - SELECT ... FOR UPDATE

**Example:**
- Prevent multiple simultaneous "send" requests

---

### Idempotency

- Critical operations must be idempotent:
  - Repeating `/send` should not duplicate effects
- Always check current state before applying updates

---

## API Design Rules

### Response Format

Success:
```json
{ "success": true, "data": {} }