import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { campaignsService, campaignKeys } from './useCampaigns'
import type { Campaign, CreateCampaignRequest, UpdateCampaignRequest } from '@/types/api.types'

/**
 * Hook for creating a new campaign
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCampaignRequest) =>
      campaignsService.create(data),

    onSuccess: (newCampaign: Campaign) => {
      // Invalidate and refetch campaigns list
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })

      // Optionally add the new campaign to the cache
      queryClient.setQueryData(
        campaignKeys.detail(newCampaign.id),
        newCampaign
      )

      toast.success('Campaign created successfully!')
    },

    onError: (error: any) => {
      const message = error.error?.message || 'Failed to create campaign'
      toast.error(message)
    },
  })
}

/**
 * Hook for updating an existing campaign
 */
export function useUpdateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignRequest }) =>
      campaignsService.update(id, data),

    onSuccess: (updatedCampaign, { id }) => {
      // Update the specific campaign in cache
      queryClient.setQueryData(campaignKeys.detail(id), updatedCampaign)

      // Invalidate campaigns list
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })

      toast.success('Campaign updated successfully!')
    },

    onError: (error: any) => {
      const message = error.error?.message || 'Failed to update campaign'
      toast.error(message)
    },
  })
}

/**
 * Hook for deleting a campaign
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => campaignsService.delete(id),

    onSuccess: (_, deletedId) => {
      // Remove the campaign from cache
      queryClient.removeQueries({ queryKey: campaignKeys.detail(deletedId) })

      // Invalidate campaigns list
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })

      toast.success('Campaign deleted successfully!')
    },

    onError: (error: any) => {
      const message = error.error?.message || 'Failed to delete campaign'
      toast.error(message)
    },
  })
}

/**
 * Hook for scheduling a campaign
 */
export function useScheduleCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      campaignsService.schedule(id, { scheduled_at: scheduledAt }),

    onSuccess: (updatedCampaign, { id }) => {
      // Update the campaign in cache
      queryClient.setQueryData(campaignKeys.detail(id), updatedCampaign)

      // Invalidate campaigns list to reflect status change
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })

      toast.success('Campaign scheduled successfully!')
    },

    onError: (error: any) => {
      const message = error.error?.message || 'Failed to schedule campaign'
      toast.error(message)
    },
  })
}

/**
 * Hook for sending a campaign immediately
 */
export function useSendCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => campaignsService.send(id),

    onSuccess: (_, campaignId) => {
      // Invalidate campaign detail and stats
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) })
      queryClient.invalidateQueries({ queryKey: campaignKeys.stat(campaignId) })

      // Invalidate campaigns list to reflect status change
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })

      toast.success('Campaign sent successfully!')
    },

    onError: (error: any) => {
      const message = error.error?.message || 'Failed to send campaign'
      toast.error(message)
    },
  })
}

/**
 * Hook for cancelling a scheduled campaign
 * (Updates campaign by setting empty recipient_ids to reset to draft)
 */
export function useCancelSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      campaignsService.update(id, {
        scheduled_at: null,
      }),

    onSuccess: (updatedCampaign, campaignId) => {
      // Update the campaign in cache
      queryClient.setQueryData(campaignKeys.detail(campaignId), updatedCampaign)

      // Invalidate campaigns list
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })

      toast.success('Campaign schedule cancelled!')
    },

    onError: (error: any) => {
      const message = error.error?.message || 'Failed to cancel schedule'
      toast.error(message)
    },
  })
}
