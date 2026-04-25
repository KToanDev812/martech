import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { CampaignCard } from '@/features/campaigns/components/CampaignCard'
import { FilterControls } from '@/features/campaigns/components/FilterControls'
import { ScheduleDialog } from '@/features/campaigns/components/ScheduleDialog'
import { DeleteDialog } from '@/features/campaigns/components/DeleteDialog'
import { SendDialog } from '@/features/campaigns/components/SendDialog'
import { useCampaigns, useScheduleCampaign, useSendCampaign, useDeleteCampaign } from '@/features/campaigns/hooks'
import { Button } from '@/components/ui/button'
import { CampaignListSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Pagination } from '@/components/common/Pagination'
import { Plus } from 'lucide-react'
import type { ApiError } from '@/types/api.types'

const CAMPAIGNS_PER_PAGE = 12

export default function CampaignListPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Handle filter changes and reset page to 1
  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter)
    setCurrentPage(1) // Reset to page 1 when filter changes
  }

  // Server-side filtering and pagination
  const { data, isLoading, error, refetch } = useCampaigns({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: currentPage,
    limit: CAMPAIGNS_PER_PAGE,
  })

  // Mutation hooks
  const scheduleCampaign = useScheduleCampaign()
  const sendCampaign = useSendCampaign()
  const deleteCampaign = useDeleteCampaign()

  // Dialog states
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)

  // Pagination data
  const campaigns = data?.campaigns || []
  const pagination = data?.pagination
  const totalCampaigns = pagination?.total || 0
  const totalPages = pagination?.total_pages || 1
  const hasCampaigns = campaigns.length > 0

  // Show loading state only during initial load, not filter changes
  const isInitialLoad = isLoading && !data

  const handleViewCampaign = (id: string) => {
    navigate(`/campaigns/${id}`)
  }

  const handleCreateCampaign = () => {
    navigate('/campaigns/new')
  }

  const handleEditCampaign = (id: string) => {
    navigate(`/campaigns/${id}/edit`)
  }

  const handleDeleteCampaign = (id: string) => {
    setSelectedCampaign(id)
    setDeleteDialogOpen(true)
  }

  const handleSendCampaign = (id: string) => {
    setSelectedCampaign(id)
    setSendDialogOpen(true)
  }

  const handleScheduleCampaign = (id: string) => {
    setSelectedCampaign(id)
    setScheduleDialogOpen(true)
  }

  const handleConfirmSchedule = async (scheduledAt: string) => {
    if (selectedCampaign) {
      await scheduleCampaign.mutateAsync({
        id: selectedCampaign,
        scheduledAt,
      })
      setScheduleDialogOpen(false)
      setSelectedCampaign(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (selectedCampaign) {
      await deleteCampaign.mutateAsync(selectedCampaign)
      setDeleteDialogOpen(false)
      setSelectedCampaign(null)
    }
  }

  const handleConfirmSend = async () => {
    if (selectedCampaign) {
      await sendCampaign.mutateAsync(selectedCampaign)
      setSendDialogOpen(false)
      setSelectedCampaign(null)
    }
  }

  // Loading state
  // Show skeleton only on initial page load, not when switching filters
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
            <p className="text-gray-600">Loading your campaigns...</p>
          </div>
          <CampaignListSkeleton />
        </main>
      </div>
    )
  }

  // Error state
  if (error) {
    const errorMessage = (error as unknown as ApiError)?.error?.message || 'Unknown error'

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
            <p className="text-gray-600">Manage your email campaigns</p>
          </div>
          <ErrorState
            title="Unable to load campaigns"
            message={errorMessage}
            onRetry={() => refetch()}
            isRetrying={isLoading}
          />
        </main>
      </div>
    )
  }

  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">Manage your email campaigns</p>
          </div>
          <Button onClick={handleCreateCampaign} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="mb-6">
          <FilterControls
            currentFilter={statusFilter}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Campaign List */}
        {hasCampaigns ? (
          <>
            {/* Loading indicator for filter changes */}
            {isLoading && data && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Loading campaigns...
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onView={handleViewCampaign}
                  onEdit={handleEditCampaign}
                  onDelete={handleDeleteCampaign}
                  onSend={handleSendCampaign}
                  onSchedule={handleScheduleCampaign}
                  isLoading={
                    scheduleCampaign.isPending ||
                    sendCampaign.isPending ||
                    deleteCampaign.isPending
                  }
                  loadingCampaignId={selectedCampaign}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={totalCampaigns}
                limit={CAMPAIGNS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <EmptyState
            title={statusFilter !== 'all' ? `No ${statusFilter} campaigns` : 'No campaigns yet'}
            description={
              statusFilter !== 'all'
                ? `You don't have any ${statusFilter} campaigns. Try a different filter or create your first campaign.`
                : 'Get started by creating your first email campaign to engage with your audience.'
            }
            actionLabel="Create Campaign"
            onAction={handleCreateCampaign}
          />
        )}

        {/* Dialogs */}
        {selectedCampaignData && (
          <>
            <ScheduleDialog
              campaign={selectedCampaignData}
              open={scheduleDialogOpen}
              onOpenChange={setScheduleDialogOpen}
              onSchedule={handleConfirmSchedule}
            />
            <DeleteDialog
              campaign={selectedCampaignData}
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onDelete={handleConfirmDelete}
              isDeleting={deleteCampaign.isPending}
            />
            <SendDialog
              campaign={selectedCampaignData}
              open={sendDialogOpen}
              onOpenChange={setSendDialogOpen}
              onSend={handleConfirmSend}
              isSending={sendCampaign.isPending}
            />
          </>
        )}
      </main>
    </div>
  )
}
