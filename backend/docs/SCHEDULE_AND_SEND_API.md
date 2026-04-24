# Campaign Schedule & Send API Documentation

## Critical Endpoints

These endpoints control the campaign lifecycle and state transitions. The `/send` endpoint is particularly critical as it uses database transactions to ensure data integrity.

---

## POST /campaigns/:id/schedule

Schedule a campaign for future delivery.

### Authentication
Required (JWT token)

### Parameters
| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | string | Path | Campaign UUID |
| `scheduled_at` | string | Body | ISO 8601 datetime (must be in future) |

### Request Body
```json
{
  "scheduled_at": "2026-12-31T10:00:00Z"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "campaign-uuid",
    "name": "Spring Sale",
    "subject": "50% Off!",
    "body": "<html>...</html>",
    "status": "scheduled",
    "scheduled_at": "2026-12-31T10:00:00Z",
    "created_by": "user-uuid",
    "created_at": "2026-04-24T10:00:00Z",
    "updated_at": "2026-04-24T11:00:00Z"
  }
}
```

### Error Responses

#### 400 Bad Request (Past Date)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "scheduled_at must be in the future"
  }
}
```

#### 403 Forbidden (Not Draft)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Only draft campaigns can be scheduled"
  }
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Campaign not found"
  }
}
```

### Business Rules
- ✅ Campaign must be in `draft` status
- ✅ `scheduled_at` must be in the future
- ✅ User must own the campaign
- ✅ Campaign status changes to `scheduled`
- ❌ Cannot schedule already sent campaigns

### State Transition
```
draft → scheduled
```

### Example Usage
```bash
curl -X POST "http://localhost:3000/api/v1/campaigns/campaign-uuid/schedule" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduled_at": "2026-12-31T10:00:00Z"
  }'
```

---

## POST /campaigns/:id/send

**CRITICAL OPERATION** - Send campaign immediately using database transaction.

### Authentication
Required (JWT token)

### Parameters
| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `id` | string | Path | Campaign UUID |

### Request Body
None (empty POST request)

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "campaign_id": "campaign-uuid",
    "queued": true,
    "recipient_count": 150
  }
}
```

### Error Responses

#### 403 Forbidden (Already Sent)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Campaign has already been sent"
  }
}
```

#### 403 Forbidden (Invalid Status)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Only draft or scheduled campaigns can be sent"
  }
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Campaign not found"
  }
}
```

### Business Rules
- ✅ Campaign must be in `draft` or `scheduled` status
- ✅ User must own the campaign
- ✅ **Transaction-based**: Campaign status AND recipient statuses updated atomically
- ✅ All recipients initialized to `pending` status
- ✅ Campaign status changes to `sent`
- ❌ Cannot send already sent campaigns (idempotent)
- ❌ Send is irreversible (sent is terminal state)

### State Transitions
```
draft → sent
scheduled → sent
```

### Transaction Details

The send operation uses a database transaction to ensure atomicity:

```sql
BEGIN TRANSACTION;

-- 1. Lock and update campaign status
UPDATE campaigns
SET status = 'sent', updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND status IN ('draft', 'scheduled')
RETURNING id, status;

-- 2. Initialize all recipients as pending
UPDATE campaign_recipients
SET status = 'pending'
WHERE campaign_id = $1;

COMMIT TRANSACTION;
```

**What this ensures:**
1. **Atomicity**: Both updates succeed or both fail
2. **Consistency**: No partial state (campaign sent but recipients not initialized)
3. **Isolation**: Concurrent sends are serialized
4. **Durability**: Changes are permanent once committed

### Failure Scenarios

**If transaction fails:**
- Campaign status remains unchanged
- Recipient statuses remain unchanged
- No partial state corruption
- Safe to retry

**Concurrent sends:**
- First request acquires database lock
- Second request waits or fails with 409 Conflict
- No double-sending possible

### Example Usage
```bash
curl -X POST "http://localhost:3000/api/v1/campaigns/campaign-uuid/send" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript Example
```javascript
async function sendCampaign(campaignId, token) {
  const response = await fetch(`/api/v1/campaigns/${campaignId}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (result.success) {
    console.log(`Campaign ${result.data.campaign_id} is queued for sending`);
    console.log(`Recipients: ${result.data.recipient_count}`);
  } else {
    console.error(`Failed to send: ${result.error.message}`);
  }
}
```

---

## State Machine Reference

### Valid Transitions

| From | To | Endpoint | Reversible |
|------|-----|----------|------------|
| draft | scheduled | POST /schedule | ✅ Yes |
| draft | sent | POST /send | ❌ NO |
| scheduled | sent | POST /send | ❌ NO |
| scheduled | draft | PATCH /campaigns/:id | ✅ Yes |

### Invalid Transitions

```
sent → any state (BLOCKED - terminal state)
draft → scheduled (with past date) (BLOCKED)
scheduled → draft (after send time passes) (BLOCKED)
```

### State Diagram

```
    ┌──────────────┐
    │    draft     │ ←─┐
    └──────┬───────┘   │
           │           │ PATCH to cancel
           │ /schedule │ (with recipients change)
           ▼           │
    ┌──────────────┐   │
    │  scheduled   │───┘
    └──────┬───────┘
           │
           │ /send
           ▼
    ┌──────────────┐
    │     sent     │ (terminal)
    └──────────────┘
```

---

## Testing Guide

### Test Schedule Endpoint

```bash
# 1. Create a draft campaign
CAMPAIGN_ID=$(curl -X POST "http://localhost:3000/api/v1/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "subject": "Test Subject",
    "body": "Test body with enough content",
    "recipient_ids": ["recipient-1"]
  }' | jq -r '.data.id')

# 2. Schedule for future date
curl -X POST "http://localhost:3000/api/v1/campaigns/$CAMPAIGN_ID/schedule" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduled_at": "2026-12-31T10:00:00Z"
  }'

# 3. Verify status changed
curl -X GET "http://localhost:3000/api/v1/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.status'
# Should return "scheduled"
```

### Test Send Endpoint

```bash
# 1. Create another draft campaign
CAMPAIGN_ID=$(curl -X POST "http://localhost:3000/api/v1/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Send Campaign",
    "subject": "Test Send Subject",
    "body": "Test send body with enough content here",
    "recipient_ids": ["recipient-1", "recipient-2"]
  }' | jq -r '.data.id')

# 2. Send campaign immediately
curl -X POST "http://localhost:3000/api/v1/campaigns/$CAMPAIGN_ID/send" \
  -H "Authorization: Bearer $TOKEN"

# 3. Verify status changed to sent
curl -X GET "http://localhost:3000/api/v1/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.status'
# Should return "sent"

# 4. Try to send again (should fail)
curl -X POST "http://localhost:3000/api/v1/campaigns/$CAMPAIGN_ID/send" \
  -H "Authorization: Bearer $TOKEN"
# Should return 403 error
```

### Test Transaction Integrity

```bash
# This requires database access to verify atomic updates

# Before sending, check recipient status
psql -U user -d martech -c \
  "SELECT status FROM campaign_recipients WHERE campaign_id = '$CAMPAIGN_ID';"

# Send campaign
curl -X POST "http://localhost:3000/api/v1/campaigns/$CAMPAIGN_ID/send" \
  -H "Authorization: Bearer $TOKEN"

# After sending, verify both campaign AND recipients updated atomically
psql -U user -d martech -c \
  "SELECT c.status as campaign_status, COUNT(cr.status) as total_recipients,
          SUM(CASE WHEN cr.status = 'pending' THEN 1 ELSE 0 END) as pending_count
   FROM campaigns c
   LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
   WHERE c.id = '$CAMPAIGN_ID'
   GROUP BY c.status;"

# Expected result:
# campaign_status = sent, total_recipients = N, pending_count = N
```

---

## Common Issues & Solutions

### Issue: "scheduled_at must be in future"
**Cause**: You're trying to schedule with a past date
**Solution**: Use a future date in ISO 8601 format

### Issue: "Only draft campaigns can be scheduled"
**Cause**: Campaign is already sent or scheduled
**Solution**: Use PATCH to cancel scheduled campaigns first

### Issue: "Campaign has already been sent"
**Cause**: Campaign is in terminal state
**Solution**: Cannot be undone, sent campaigns cannot be sent again

### Issue: Transaction timeout
**Cause**: Database connection issue or too many recipients
**Solution**: Check database logs, optimize recipient batch size

### Issue: "Only draft or scheduled campaigns can be sent"
**Cause**: Campaign is in invalid state
**Solution**: Check campaign status before attempting send

---

## Performance Considerations

### Schedule Operation
- **Single database update**
- **Fast**: < 10ms
- **No locks**: Can be called concurrently

### Send Operation (CRITICAL)
- **Database transaction**: ACID guaranteed
- **Slower**: Depends on recipient count
- **Row-level lock**: Prevents concurrent sends
- **Index usage**: Optimized with `idx_campaigns_status`

### Scalability

**Current Implementation:**
- Transaction holds lock for duration
- Suitable for campaigns with < 10,000 recipients
- Timeout: 2-5 seconds typical

**For Large Campaigns (>10K recipients):**
Consider background job queue (future enhancement):
```javascript
// Future implementation pattern
async function sendCampaignLarge(id) {
  // Create job in queue
  await queue.add('send-campaign', { campaignId: id });
  return { queued: true, processing: 'background' };
}
```

---

## Monitoring & Debugging

### Check Transaction Logs
```bash
# PostgreSQL logs show transaction activity
tail -f /var/log/postgresql/postgresql-*.log | grep TRANSACTION
```

### Monitor Campaign Sends
```sql
-- Track send operations
SELECT 
    c.name,
    c.status,
    c.updated_at,
    COUNT(cr.recipient_id) as recipient_count,
    SUM(CASE WHEN cr.status = 'pending' THEN 1 ELSE 0 END) as pending_count
FROM campaigns c
LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
WHERE c.status = 'sent'
GROUP BY c.id, c.name, c.status, c.updated_at
ORDER BY c.updated_at DESC;
```

### Detect Failed Sends
```sql
-- Find campaigns with failed recipients
SELECT 
    c.name,
    COUNT(cr.recipient_id) FILTER (WHERE cr.status = 'failed') as failed_count
FROM campaigns c
JOIN campaign_recipients cr ON c.id = cr.campaign_id
WHERE c.status = 'sent'
GROUP BY c.id, c.name
HAVING COUNT(cr.recipient_id) FILTER (WHERE cr.status = 'failed') > 0;
```

---

## Security Considerations

### Authorization
- ✅ Users can only send their own campaigns
- ✅ JWT token required
- ✅ User ownership verified before send

### Data Integrity
- ✅ Transaction prevents partial state
- ✅ Database constraints enforce state rules
- ✅ Cascade deletes maintain referential integrity

### Idempotency
- ✅ Sending same campaign twice returns error
- ✅ No double-sending possible
- ✅ Safe to retry on transient failures

---

## Next Steps

After implementing these endpoints:

1. **Email Worker Process**: Background service to actually send emails
2. **Stats Tracking**: Update opened_at when emails are opened
3. **Failed Sends**: Handle bounces and delivery failures
4. **Retry Logic**: Automatic retry for failed sends
5. **Webhooks**: Notify external systems of send events
