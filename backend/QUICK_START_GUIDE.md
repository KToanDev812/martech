# Quick Start Guide - Testing GET /campaigns

## Prerequisites

1. **Database Setup**: PostgreSQL database with migrations applied
2. **Server Running**: Backend server started with `npm run dev`
3. **Test Data**: At least one user registered

## Complete Testing Flow

### Step 1: Start the Server

```bash
cd backend
npm run dev
```

The server should start on `http://localhost:3000`

### Step 2: Register a User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "SecurePass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "test@example.com",
      "name": "Test User",
      "created_at": "2026-04-24T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token for next steps:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: Create Test Recipients

First, you need recipients in the database. Connect to your PostgreSQL database and run:

```sql
-- Insert test recipients
INSERT INTO recipients (id, email, name) VALUES
  ('recipient-1', 'john@example.com', 'John Doe'),
  ('recipient-2', 'jane@example.com', 'Jane Smith'),
  ('recipient-3', 'bob@example.com', 'Bob Johnson');
```

### Step 4: Create Test Campaigns

```bash
curl -X POST http://localhost:3000/api/v1/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Sale Campaign",
    "subject": "50% Off Everything!",
    "body": "<html><body>Don'\''t miss our spring sale!</body></html>",
    "recipient_ids": ["recipient-1", "recipient-2"]
  }'
```

Create a few more campaigns to test pagination:

```bash
# Campaign 2
curl -X POST http://localhost:3000/api/v1/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Newsletter April",
    "subject": "Monthly Updates",
    "body": "<html>Here are our latest updates this month.</html>",
    "recipient_ids": ["recipient-1", "recipient-2", "recipient-3"]
  }'

# Campaign 3
curl -X POST http://localhost:3000/api/v1/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Launch",
    "subject": "New Product Available!",
    "body": "<html>We'\''re excited to announce our new product!</html>",
    "recipient_ids": ["recipient-3"]
  }'
```

### Step 5: Test GET /campaigns

#### 5.1. Get All Campaigns (Default Pagination)

```bash
curl -X GET "http://localhost:3000/api/v1/campaigns" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign-uuid-1",
        "name": "Spring Sale Campaign",
        "subject": "50% Off Everything!",
        "body": "<html><body>Don't miss our spring sale!</body></html>",
        "status": "draft",
        "scheduled_at": null,
        "created_by": "user-uuid",
        "created_at": "2026-04-24T10:00:00Z",
        "updated_at": "2026-04-24T10:00:00Z",
        "recipient_count": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

#### 5.2. Test Pagination

```bash
# Get first page with 2 campaigns per page
curl -X GET "http://localhost:3000/api/v1/campaigns?page=1&limit=2" \
  -H "Authorization: Bearer $TOKEN"
```

#### 5.3. Filter by Status

```bash
# Get only draft campaigns
curl -X GET "http://localhost:3000/api/v1/campaigns?status=draft" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6: Test Edge Cases

#### 6.1. Test Invalid Status

```bash
curl -X GET "http://localhost:3000/api/v1/campaigns?status=invalid" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status value. Must be one of: draft, scheduled, sent"
  }
}
```

#### 6.2. Test Without Authentication

```bash
curl -X GET "http://localhost:3000/api/v1/campaigns"
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token required"
  }
}
```

## Automated Testing Script

Save this as `test_campaigns.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

echo "=== Campaign API Testing Script ==="

# Step 1: Register/Login
echo -e "\n1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "name": "Test User",
    "password": "SecurePass123"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.data.user.id')

if [ "$TOKEN" == "null" ]; then
  echo "Registration failed!"
  echo $REGISTER_RESPONSE
  exit 1
fi

echo "User registered successfully! Token: ${TOKEN:0:20}..."

# Step 2: Create campaigns (assuming recipients exist)
echo -e "\n2. Creating test campaigns..."

CAMPAIGN1=$(curl -s -X POST "$BASE_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign 1",
    "subject": "Test Subject 1",
    "body": "Test body with enough content",
    "recipient_ids": ["recipient-1"]
  }')

CAMPAIGN2=$(curl -s -X POST "$BASE_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign 2",
    "subject": "Test Subject 2",
    "body": "Another test body with sufficient content",
    "recipient_ids": ["recipient-2"]
  }')

echo "Campaigns created!"

# Step 3: List all campaigns
echo -e "\n3. Listing all campaigns..."
curl -s -X GET "$BASE_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Step 4: Test pagination
echo -e "\n4. Testing pagination (page=1, limit=1)..."
curl -s -X GET "$BASE_URL/campaigns?page=1&limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.pagination'

# Step 5: Test status filter
echo -e "\n5. Testing status filter (draft only)..."
curl -s -X GET "$BASE_URL/campaigns?status=draft" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.pagination'

# Step 6: Test error case - invalid status
echo -e "\n6. Testing error case (invalid status)..."
curl -s -X GET "$BASE_URL/campaigns?status=invalid" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n=== Testing Complete ==="
```

**Run the script:**
```bash
chmod +x test_campaigns.sh
./test_campaigns.sh
```

## Common Issues & Solutions

### Issue: "recipient does not exist"
**Solution**: Add recipients to the database first:
```sql
INSERT INTO recipients (id, email, name) VALUES
  ('recipient-1', 'test1@example.com', 'Test Recipient 1');
```

### Issue: "Authentication token required"
**Solution**: Make sure you're including the Authorization header with a valid JWT token.

### Issue: "Database connection failed"
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct in `.env` file.

### Issue: "No campaigns returned"
**Solution**: Create test campaigns first using the POST /campaigns endpoint.

## Next Steps

Once you've verified GET /campaigns works:

1. Test other campaign endpoints (GET by ID, PATCH, DELETE)
2. Implement campaign scheduling (POST /campaigns/:id/schedule)
3. Implement campaign sending (POST /campaigns/:id/send)
4. Test the campaign stats endpoint (GET /campaigns/:id/stats)

## Monitoring & Debugging

### Check Server Logs
```bash
# Logs are in backend/logs/
tail -f backend/logs/combined.log
```

### Database Queries
```sql
-- Verify campaigns exist
SELECT id, name, status, created_at FROM campaigns ORDER BY created_at DESC;

-- Check campaign recipients
SELECT c.name, COUNT(cr.recipient_id) as recipient_count
FROM campaigns c
LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
GROUP BY c.id, c.name
ORDER BY c.created_at DESC;
```

### Test with Different Users
Register multiple users and verify they only see their own campaigns:
```bash
# User 1
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","name":"User 1","password":"SecurePass123"}'

# User 2
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@example.com","name":"User 2","password":"SecurePass123"}'
```
