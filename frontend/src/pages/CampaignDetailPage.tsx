import { useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { useCampaign, useCampaignStats, useScheduleCampaign, useSendCampaign, useDeleteCampaign } from '@/features/campaigns/hooks'
import { StatsDisplay } from '@/features/campaigns/components/StatsDisplay'
import { RecipientTable } from '@/features/campaigns/components/RecipientTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ScheduleDialog } from '@/features/campaigns/components/ScheduleDialog'
import { DeleteDialog } from '@/features/campaigns/components/DeleteDialog'
import { SendDialog } from '@/features/campaigns/components/SendDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CampaignListSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { ArrowLeft, Calendar, Mail, User, Edit, CalendarClock, Send, Trash2 } from 'lucide-react'
import { formatDateTime } from '@/utils/date'
import { CAMPAIGN_STATUS } from '@/utils/constants'
import type { ApiError } from '@/types/api.types'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function CampaignDetailPage() {
  const { id } = useParams()
  const campaignId = id || ''

  const { data: campaign, isLoading, error, refetch } = useCampaign(campaignId)
  const { data: stats } = useCampaignStats(campaignId)

  // Mutation hooks
  const scheduleCampaign = useScheduleCampaign()
  const sendCampaign = useSendCampaign()
  const deleteCampaign = useDeleteCampaign()

  // Dialog states
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  // Determine campaign state
  const isDraft = campaign?.status === CAMPAIGN_STATUS.DRAFT
  const isScheduled = campaign?.status === CAMPAIGN_STATUS.SCHEDULED
  const isSent = campaign?.status === CAMPAIGN_STATUS.SENT

  // Check if any action is in progress
  const isActionInProgress = scheduleCampaign.isPending || sendCampaign.isPending || deleteCampaign.isPending

  // Handler functions
  const handleEdit = () => {
    if (campaign) {
      window.location.href = `/campaigns/${campaign.id}/edit`
    }
  }

  const handleSchedule = () => {
    setScheduleDialogOpen(true)
  }

  const handleSend = () => {
    setSendDialogOpen(true)
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmSchedule = async (scheduledAt: string) => {
    if (campaign) {
      await scheduleCampaign.mutateAsync({
        id: campaign.id,
        scheduledAt,
      })
      setScheduleDialogOpen(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (campaign) {
      await deleteCampaign.mutateAsync(campaign.id)
      setDeleteDialogOpen(false)
      // Navigate back to campaigns list after deletion
      window.location.href = '/campaigns'
    }
  }

  const handleConfirmSend = async () => {
    if (campaign) {
      await sendCampaign.mutateAsync(campaign.id)
      setSendDialogOpen(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              to="/campaigns"
              className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Campaigns
            </Link>
          </div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Loading campaign...</h1>
          </div>
          <CampaignListSkeleton />
        </main>
      </div>
    )
  }

  // Error state
  if (error || !campaign) {
    const errorMessage = error
      ? (error as unknown as ApiError)?.error?.message || 'Campaign not found'
      : 'Campaign not found'

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              to="/campaigns"
              className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Campaigns
            </Link>
          </div>
          <ErrorState
            title="Campaign not found"
            message={errorMessage}
            onRetry={() => refetch()}
            isRetrying={isLoading}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/campaigns"
            className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Link>
        </div>

        {/* Campaign Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{campaign?.name}</h1>
                {campaign?.status && <StatusBadge status={campaign.status} />}
              </div>
              <p className="text-gray-600 text-lg">{campaign?.subject}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4">
            {campaign && (
              <>
                {/* Edit - only for draft campaigns */}
                {isDraft && (
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    disabled={isActionInProgress}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Campaign
                  </Button>
                )}

                {/* Schedule - for draft campaigns with recipients, or scheduled campaigns */}
                {(isDraft || isScheduled) && campaign.recipient_count > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleSchedule}
                    disabled={isActionInProgress}
                    className="flex items-center gap-2"
                  >
                    <CalendarClock className="h-4 w-4" />
                    {isScheduled ? 'Reschedule' : 'Schedule'}
                  </Button>
                )}

                {/* Send - for draft or scheduled campaigns with recipients */}
                {(isDraft || isScheduled) && campaign.recipient_count > 0 && (
                  <Button
                    variant="default"
                    onClick={handleSend}
                    disabled={isActionInProgress}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Now
                  </Button>
                )}

                {/* Delete - only for draft campaigns */}
                {isDraft && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isActionInProgress}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}

                {/* Message for sent campaigns */}
                {isSent && (
                  <div className="text-sm text-gray-500 italic">
                    This campaign has been sent and cannot be modified
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Campaign Info Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Campaign Information</h2>
            {campaign && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={campaign.status} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Created by
                  </p>
                  <p className="text-sm font-medium">{campaign.created_by?.name}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Created
                  </p>
                  <p className="text-sm font-medium">{formatDateTime(campaign.created_at)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Recipients
                  </p>
                  <p className="text-sm font-medium">{campaign.recipient_count}</p>
                </div>

                {campaign.scheduled_at && (
                  <div className="space-y-1 md:col-span-2 lg:col-span-4">
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      Scheduled for
                    </p>
                    <p className="text-sm font-medium">{formatDateTime(campaign.scheduled_at)}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Section */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Campaign Statistics</h2>
            <StatsDisplay stats={stats} />
          </div>
        )}

        {/* Recipients Section */}
        {campaign && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recipients</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {campaign.recipients?.length || campaign.recipient_count} total
                </span>
              </div>
            </div>

            {campaign.recipients && campaign.recipients.length > 0 ? (
              <RecipientTable recipients={campaign.recipients} />
            ) : (
              <EmptyState
                title="No recipients"
                description="This campaign has no recipients yet. Add recipients to see them here."
                icon={null}
              />
            )}
          </div>
        )}

        {/* Email Content Section */}
        {campaign && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Content</h2>
            <Card>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: campaign.body }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialogs */}
        {campaign && (
          <>
            <ScheduleDialog
              campaign={campaign}
              open={scheduleDialogOpen}
              onOpenChange={setScheduleDialogOpen}
              onSchedule={handleConfirmSchedule}
            />
            <SendDialog
              campaign={campaign}
              open={sendDialogOpen}
              onOpenChange={setSendDialogOpen}
              onSend={handleConfirmSend}
              isSending={sendCampaign.isPending}
            />
            <DeleteDialog
              campaign={campaign}
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onDelete={handleConfirmDelete}
              isDeleting={deleteCampaign.isPending}
            />
          </>
        )}
      </main>
    </div>
  )
}
