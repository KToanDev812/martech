# GET /campaigns API Documentation

## Endpoint
`GET /api/v1/campaigns`

## Authentication
Required (JWT token in Authorization header)

## Description
Retrieves a paginated list of campaigns belonging to the authenticated user. Supports filtering by status and pagination parameters.

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-based) |
| `limit` | number | 20 | Number of campaigns per page (1-100) |
| `status` | string | - | Filter by campaign status: `draft`, `scheduled`, or `sent` |

## Request Examples

### Get all campaigns (default pagination)
```bash
curl -X GET "http://localhost:3000/api/v1/campaigns" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get second page with 10 campaigns per page
```bash
curl -X GET "http://localhost:3000/api/v1/campaigns?page=2&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get only draft campaigns
```bash
curl -X GET "http://localhost:3000/api/v1/campaigns?status=draft" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get scheduled campaigns with pagination
```bash
curl -X GET "http://localhost:3000/api/v1/campaigns?status=scheduled&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "uuid-1",
        "name": "Spring Sale Campaign",
        "subject": "50% Off Everything!",
        "body": "<html>Don't miss our spring sale...</html>",
        "status": "draft",
        "scheduled_at": null,
        "created_by": "user-uuid",
        "created_at": "2026-04-24T10:00:00Z",
        "updated_at": "2026-04-24T10:00:00Z",
        "recipient_count": 150
      },
      {
        "id": "uuid-2",
        "name": "Newsletter April",
        "subject": "Monthly Updates",
        "body": "<html>Here are our latest updates...</html>",
        "status": "sent",
        "scheduled_at": "2026-04-20T09:00:00Z",
        "created_by": "user-uuid",
        "created_at": "2026-04-18T15:30:00Z",
        "updated_at": "2026-04-20T09:00:00Z",
        "recipient_count": 500
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token required"
  }
}
```

#### 400 Bad Request (Invalid Status)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status value. Must be one of: draft, scheduled, sent"
  }
}
```

## Pagination Behavior

- **Default**: Returns first 20 campaigns
- **Maximum**: 100 campaigns per page
- **Sorting**: Campaigns are sorted by `created_at` DESC (newest first)
- **Total Pages**: Calculated as `Math.ceil(total / limit)`

### Pagination Metadata
- `page`: Current page number
- `limit`: Number of campaigns per page
- `total`: Total number of campaigns matching the query
- `total_pages`: Total number of pages
- `has_next`: Boolean indicating if there's a next page
- `has_prev`: Boolean indicating if there's a previous page

## Filtering

### By Status
Filter campaigns by their current state:
- `draft`: Campaigns being created/edited
- `scheduled`: Campaigns scheduled for future delivery
- `sent`: Campaigns that have been delivered

### Example Use Cases

#### Get all draft campaigns
```bash
curl -X GET "http://localhost:3000/api/v1/campaigns?status=draft" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get sent campaigns with pagination
```bash
curl -X GET "http://localhost:3000/api/v1/campaigns?status=sent&page=1&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Performance Considerations

- Campaigns are fetched with a single optimized SQL query
- Recipient count is included using a LEFT JOIN
- Pagination is enforced at the database level (LIMIT/OFFSET)
- Indexes on `created_by` and `status` ensure fast queries

## Complete Example with JavaScript

```javascript
// Using fetch API
const token = 'your-jwt-token';

async function getCampaigns(page = 1, limit = 20, status = null) {
  let url = `http://localhost:3000/api/v1/campaigns?page=${page}&limit=${limit}`;
  if (status) {
    url += `&status=${status}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (data.success) {
    return data.data;
  } else {
    throw new Error(data.error.message);
  }
}

// Usage examples
const allCampaigns = await getCampaigns();
console.log(`Found ${allCampaigns.pagination.total} campaigns`);

const draftCampaigns = await getCampaigns(1, 20, 'draft');
console.log(`Found ${draftCampaigns.pagination.total} draft campaigns`);

// Pagination
const page1 = await getCampaigns(1, 10);
console.log(`Page 1 of ${page1.pagination.total_pages}`);

if (page1.pagination.has_next) {
  const page2 = await getCampaigns(2, 10);
  console.log('Page 2 campaigns:', page2.campaigns);
}
```

## Complete Example with cURL

```bash
# First, get your JWT token by logging in
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}' \
  | jq -r '.data.token')

# Get first page of campaigns
curl -X GET "http://localhost:3000/api/v1/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data'

# Get second page with custom page size
curl -X GET "http://localhost:3000/api/v1/campaigns?page=2&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.pagination'

# Get only draft campaigns
curl -X GET "http://localhost:3000/api/v1/campaigns?status=draft" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.campaigns | length'

# Pretty print campaign names
curl -X GET "http://localhost:3000/api/v1/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.campaigns[] | {name: .name, status: .status, recipients: .recipient_count}'
```

## Testing the Endpoint

### Using the test suite
```bash
cd backend
npm test -- CampaignController.test.ts
```

### Manual testing
```bash
# 1. Start the server
npm run dev

# 2. Register/login to get token
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"SecurePass123"}'

# 3. Use the token to list campaigns
curl -X GET "http://localhost:3000/api/v1/campaigns" \
  -H "Authorization: Bearer YOUR_TOKEN_FROM_STEP_2"
```

## Error Handling

The endpoint handles various error scenarios:

1. **No Authentication**: Returns 401 if JWT token is missing
2. **Invalid Token**: Returns 401 if JWT token is invalid/expired
3. **Invalid Status**: Returns 400 if status is not `draft`, `scheduled`, or `sent`
4. **Invalid Pagination**: Automatically clamps values to valid ranges
5. **Database Errors**: Returns 500 with error details (in development mode)

## Related Endpoints

- `POST /api/v1/campaigns` - Create a new campaign
- `GET /api/v1/campaigns/:id` - Get a specific campaign
- `PATCH /api/v1/campaigns/:id` - Update a campaign
- `DELETE /api/v1/campaigns/:id` - Delete a campaign
