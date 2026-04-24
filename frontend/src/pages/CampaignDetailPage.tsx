import { useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { useCampaign, useCampaignStats } from '@/features/campaigns/hooks'
import type { ApiError } from '@/types/api.types'

export default function CampaignDetailPage() {
  const { id } = useParams()
  const campaignId = id || ''

  const { data: campaign, isLoading, error } = useCampaign(campaignId)
  const { data: stats } = useCampaignStats(campaignId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading campaign...</div>
        </main>
      </div>
    )
  }

  if (error || !campaign) {
    const errorMessage = error
      ? (error as unknown as ApiError)?.error?.message || 'Campaign not found'
      : 'Campaign not found'

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-red-600">
            Failed to load campaign: {errorMessage}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
          <p className="text-gray-600">{campaign.subject}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Campaign Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Campaign Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{campaign.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created by:</span>
                <span className="font-medium">{campaign.created_by.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{new Date(campaign.created_at).toLocaleDateString()}</span>
              </div>
              {campaign.scheduled_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Scheduled:</span>
                  <span className="font-medium">
                    {new Date(campaign.scheduled_at).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Recipients:</span>
                <span className="font-medium">{campaign.recipient_count}</span>
              </div>
            </div>
          </div>

          {/* Campaign Stats */}
          {stats && campaign.status === 'sent' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Statistics</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Recipients:</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sent:</span>
                  <span className="font-medium">{stats.sent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium">{stats.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Opened:</span>
                  <span className="font-medium">{stats.opened}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600">Send Rate:</span>
                  <span className="font-medium">{(stats.send_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Open Rate:</span>
                  <span className="font-medium">{(stats.open_rate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Campaign Body */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Email Content</h2>
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: campaign.body }} />
          </div>
        </div>
      </main>
    </div>
  )
}
