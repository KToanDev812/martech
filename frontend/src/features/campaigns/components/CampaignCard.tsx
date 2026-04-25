import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { CAMPAIGN_STATUS } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import type { Campaign } from '@/types/api.types'
import { Calendar, Mail, Users, TrendingUp } from 'lucide-react'

interface CampaignCardProps {
  campaign: Campaign
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onSend?: (id: string) => void
  onSchedule?: (id: string) => void
  isLoading?: boolean
  loadingCampaignId?: string | null
}

export function CampaignCard({
  campaign,
  onView,
  onEdit,
  onDelete,
  onSend,
  onSchedule,
  isLoading = false,
  loadingCampaignId = null,
}: CampaignCardProps) {
  const isDraft = campaign.status === CAMPAIGN_STATUS.DRAFT
  const isScheduled = campaign.status === CAMPAIGN_STATUS.SCHEDULED
  const isSent = campaign.status === CAMPAIGN_STATUS.SENT
  const isCampaignLoading = isLoading && loadingCampaignId === campaign.id

  // Determine which buttons to show (hide unused ones)
  const showEdit = isDraft
  const showDelete = isDraft
  const showSend = (isDraft || isScheduled) && campaign.recipient_count > 0
  const showSchedule = (isDraft || isScheduled) && campaign.recipient_count > 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {campaign.name}
              </h3>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-sm text-gray-600 mb-1">{campaign.subject}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {campaign.recipient_count} recipients
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created {formatDate(campaign.created_at)}
              </span>
              {campaign.scheduled_at && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Scheduled for {formatDate(campaign.scheduled_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(campaign.id)}
            disabled={isCampaignLoading}
            title="View campaign details"
          >
            View Details
          </Button>

          {onEdit && showEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(campaign.id)}
              disabled={isCampaignLoading}
              title="Edit campaign"
            >
              Edit
            </Button>
          )}

          {onSchedule && showSchedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSchedule(campaign.id)}
              disabled={isCampaignLoading}
              title={isScheduled ? 'Reschedule campaign' : 'Schedule campaign'}
            >
              {isScheduled ? 'Reschedule' : 'Schedule'}
            </Button>
          )}

          {onSend && showSend && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onSend(campaign.id)}
              disabled={isCampaignLoading}
              title="Send campaign now"
            >
              Send Now
            </Button>
          )}

          {onDelete && showDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(campaign.id)}
              disabled={isCampaignLoading}
              title="Delete campaign"
            >
              Delete
            </Button>
          )}

          {isSent && (
            <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
              <TrendingUp className="h-3 w-3" />
              View Stats
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


