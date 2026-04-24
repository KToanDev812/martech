import { useQuery } from '@tanstack/react-query'
import { campaignsService } from '@/services/campaigns.service'

// Export service for use in mutation hooks
export { campaignsService }

// Query keys factory
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters: { status?: string; page?: number; limit?: number }) =>
    [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  stats: () => [...campaignKeys.all, 'stats'] as const,
  stat: (id: string) => [...campaignKeys.stats(), id] as const,
} as const

/**
 * Hook to fetch campaigns list with optional filters
 * @param params - Query parameters for filtering and pagination
 */
export function useCampaigns(params?: {
  status?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: campaignKeys.list(params || {}),
    queryFn: () => campaignsService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch single campaign by ID
 * @param id - Campaign ID
 */
export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsService.getById(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id, // Only run query if id exists
  })
}

/**
 * Hook to fetch campaign statistics
 * @param id - Campaign ID
 */
export function useCampaignStats(id: string) {
  return useQuery({
    queryKey: campaignKeys.stat(id),
    queryFn: () => campaignsService.getStats(id),
    staleTime: 30 * 1000, // 30 seconds (fresher during active sends)
    enabled: !!id,
    refetchInterval: () => {
      // Poll every 30 seconds if campaign is being sent
      // You can customize this logic based on campaign status
      return 30 * 1000
    },
  })
}
