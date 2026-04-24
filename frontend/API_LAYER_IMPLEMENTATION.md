# API Layer & React Query Implementation

## Overview

Complete API layer with JWT authentication and React Query hooks for server state management.

## Architecture

```
Components → React Query Hooks → Service Layer → Axios API → Backend
     ↓              ↓                  ↓              ↓          ↓
  UI Logic    Cache/Mutations    API Calls    HTTP Client   REST API
```

## 1. Axios Configuration (`src/services/api.ts`)

### JWT Token Integration

```typescript
// Request interceptor - attaches JWT from Redux
api.interceptors.request.use((config) => {
  const state = store.getState()
  const token = state.auth.token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
```

### Response Handling

**Success Response:**
```typescript
// Unwrap { success: true, data: ... } envelope
return response.data.data
```

**Error Handling:**
```typescript
// 401 errors → Clear auth, redirect to login
if (error.response?.status === 401) {
  store.dispatch({ type: 'auth/clearAuth' })
  window.location.href = '/login'
}

// Backend error format
return Promise.reject(error.response.data)
```

### Configuration

- **Base URL**: From `VITE_API_URL` environment variable
- **Credentials**: `withCredentials: true` (HTTP-only cookies)
- **Headers**: `Content-Type: application/json`
- **Auth Header**: `Authorization: Bearer {token}`

## 2. Campaign Service (`src/services/campaigns.service.ts`)

Complete CRUD operations matching backend API:

```typescript
campaignsService.getAll(params?)        // GET /campaigns
campaignsService.getById(id)            // GET /campaigns/:id
campaignsService.create(data)           // POST /campaigns
campaignsService.update(id, data)       // PATCH /campaigns/:id
campaignsService.delete(id)             // DELETE /campaigns/:id
campaignsService.schedule(id, data)     // POST /campaigns/:id/schedule
campaignsService.send(id)               // POST /campaigns/:id/send
campaignsService.getStats(id)           // GET /campaigns/:id/stats
```

## 3. React Query Hooks

### Query Hooks (`src/features/campaigns/hooks/useCampaigns.ts`)

#### Query Keys Factory

```typescript
export const campaignKeys = {
  all: ['campaigns'],
  lists: () => [...campaignKeys.all, 'list'],
  list: (filters) => [...campaignKeys.lists(), filters],
  details: () => [...campaignKeys.all, 'detail'],
  detail: (id) => [...campaignKeys.details(), id],
  stats: () => [...campaignKeys.all, 'stats'],
  stat: (id) => [...campaignKeys.stats(), id],
}
```

#### Available Query Hooks

**`useCampaigns(params?)`**
- Fetches campaigns list with optional filters
- **Cache Time**: 5 minutes
- **Query Key**: `['campaigns', 'list', { status, page, limit }]`

```typescript
const { data, isLoading, error } = useCampaigns({
  status: 'draft',
  page: 1,
  limit: 20
})
```

**`useCampaign(id)`**
- Fetches single campaign by ID
- **Cache Time**: 10 minutes
- **Query Key**: `['campaigns', 'detail', id]`
- **Enabled**: Only if `id` exists

```typescript
const { data: campaign, isLoading, error } = useCampaign(campaignId)
```

**`useCampaignStats(id)`**
- Fetches campaign statistics
- **Cache Time**: 30 seconds (fresher during sends)
- **Query Key**: `['campaigns', 'stats', id]`
- **Polling**: Every 30 seconds
- **Enabled**: Only if `id` exists

```typescript
const { data: stats, isLoading, error } = useCampaignStats(campaignId)
```

### Mutation Hooks (`src/features/campaigns/hooks/useCampaignMutations.ts`)

#### Available Mutation Hooks

**`useCreateCampaign()`**
- Creates new campaign
- **Invalidates**: Campaigns list
- **Updates Cache**: Adds new campaign to cache
- **Toast**: Success/error messages

```typescript
const createCampaign = useCreateCampaign()

createCampaign.mutate({
  name: 'Spring Sale',
  subject: '50% Off!',
  body: '<html>...</html>',
  recipient_ids: ['uuid-1', 'uuid-2']
})
```

**`useUpdateCampaign()`**
- Updates existing campaign
- **Invalidates**: Campaigns list
- **Updates Cache**: Updates campaign in cache
- **Toast**: Success/error messages

```typescript
const updateCampaign = useUpdateCampaign()

updateCampaign.mutate({
  id: campaignId,
  data: { name: 'Updated Name' }
})
```

**`useDeleteCampaign()`**
- Deletes campaign (draft only)
- **Invalidates**: Campaigns list
- **Removes**: Campaign from cache
- **Toast**: Success/error messages

```typescript
const deleteCampaign = useDeleteCampaign()

deleteCampaign.mutate(campaignId)
```

**`useScheduleCampaign()`**
- Schedules campaign for future send
- **Invalidates**: Campaigns list
- **Updates Cache**: Updates campaign status
- **Toast**: Success/error messages

```typescript
const scheduleCampaign = useScheduleCampaign()

scheduleCampaign.mutate({
  id: campaignId,
  scheduledAt: '2026-04-25T10:00:00Z'
})
```

**`useSendCampaign()`**
- Sends campaign immediately
- **Invalidates**: Campaign detail + stats + list
- **Polling**: Stats will auto-refresh
- **Toast**: Success/error messages

```typescript
const sendCampaign = useSendCampaign()

sendCampaign.mutate(campaignId)
```

**`useCancelSchedule()`**
- Cancels scheduled campaign (resets to draft)
- **Invalidates**: Campaigns list
- **Updates Cache**: Updates campaign status
- **Toast**: Success/error messages

```typescript
const cancelSchedule = useCancelSchedule()

cancelSchedule.mutate(campaignId)
```

## 4. Cache Strategy

### Stale Times

```typescript
Campaign List:     5 minutes  // General campaign data
Campaign Detail:  10 minutes  // Specific campaign data
Campaign Stats:    30 seconds // Real-time stats during sends
```

### Cache Invalidation

**Automatic Invalidation:**
- Create/update/delete mutations invalidate campaigns list
- Send/schedule mutations invalidate detail + stats
- 401 responses clear all auth-related data

**Manual Invalidation:**
```typescript
// Invalidate specific query
queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })

// Invalidate multiple queries
queryClient.invalidateQueries({ queryKey: campaignKeys.all })

// Remove specific query from cache
queryClient.removeQueries({ queryKey: campaignKeys.detail(id) })
```

## 5. Error Handling

### API Error Responses

```typescript
// Backend error format
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    details?: { field: "error message" }
  }
}
```

### Frontend Error Handling

```typescript
// In mutation hooks
onError: (error: any) => {
  const message = error.error?.message || 'Default error message'
  toast.error(message)
}
```

### Error Display

- **Validation Errors**: Show field-level errors in forms
- **API Errors**: Show toast notifications
- **401 Errors**: Clear auth, redirect to login
- **403 Errors**: Show permission/state error messages
- **404 Errors**: Show not found messages
- **500 Errors**: Show server error messages

## 6. Usage Examples

### In Components

```typescript
// Query example
function CampaignList() {
  const { data, isLoading, error } = useCampaigns({ status: 'draft' })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.error.message}</div>

  return (
    <ul>
      {data?.campaigns.map(campaign => (
        <li key={campaign.id}>{campaign.name}</li>
      ))}
    </ul>
  )
}

// Mutation example
function CreateCampaignButton() {
  const createCampaign = useCreateCampaign()

  const handleCreate = () => {
    createCampaign.mutate({
      name: 'New Campaign',
      subject: 'Test',
      body: '<p>Test email</p>',
      recipient_ids: []
    })
  }

  return (
    <button
      onClick={handleCreate}
      disabled={createCampaign.isPending}
    >
      {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
    </button>
  )
}
```

## 7. Performance Optimizations

### Automatic Optimizations

- **Deduplication**: Multiple components requesting same data = single API call
- **Background Refetch**: Auto-refetch on window focus
- **Cache Management**: Automatic stale data handling
- **Request Cancellation**: Component unmount = pending requests cancelled

### Manual Optimizations

```typescript
// Optimistic updates (in mutations)
onMutate: async (newData) => {
  // Cancel outgoing queries
  await queryClient.cancelQueries({ queryKey: campaignKeys.detail(id) })

  // Snapshot previous value
  const previousCampaign = queryClient.getQueryData(campaignKeys.detail(id))

  // Optimistically update cache
  queryClient.setQueryData(campaignKeys.detail(id), newData)

  return { previousCampaign }
}

// Rollback on error
onError: (err, newData, context) => {
  queryClient.setQueryData(campaignKeys.detail(id), context.previousCampaign)
}
```

## 8. Best Practices

### DO's
✅ Use React Query for all server state
✅ Use proper query keys for cache management
✅ Handle loading, error, and empty states
✅ Invalidate related queries after mutations
✅ Use stale times appropriate to data freshness needs
✅ Show toast notifications for user feedback

### DON'Ts
❌ Don't call APIs directly in components
❌ Don't duplicate server state in Redux
❌ Don't ignore error handling
❌ Don't forget to handle loading states
❌ Don't use arbitrary query keys
❌ Don't skip cache invalidation

## 9. Testing

### Manual Testing Steps

1. **List Campaigns**:
   - Visit `/campaigns`
   - Should see loading state
   - Should see campaigns or empty state

2. **View Campaign**:
   - Click on a campaign
   - Should see loading state
   - Should see campaign details

3. **Create Campaign**:
   - Click "Create Campaign"
   - Fill form and submit
   - Should see success toast
   - Should redirect to campaign detail

4. **Error Handling**:
   - Try to create with invalid data
   - Should see error toast
   - Should show field errors

## 10. Next Steps

To complete the API layer:
- Add optimistic updates for better UX
- Add retry logic for failed requests
- Add request cancellation for race conditions
- Add infinite scroll for large lists
- Add request deduplication for identical requests
- Add offline support with cache persistence
