import { Header } from '@/components/layout/Header'
import { useCampaigns } from '@/features/campaigns/hooks'
import { Button } from '@/components/ui/button'
import type { ApiError } from '@/types/api.types'

export default function CampaignListPage() {
  const { data, isLoading, error } = useCampaigns()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading campaigns...</div>
        </main>
      </div>
    )
  }

  if (error) {
    const errorMessage = (error as unknown as ApiError)?.error?.message || 'Unknown error'

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-red-600">
            Failed to load campaigns: {errorMessage}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <Button>Create Campaign</Button>
        </div>

        {data?.campaigns && data.campaigns.length > 0 ? (
          <div className="grid gap-4">
            {data.campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Status: {campaign.status}</span>
                      <span>Recipients: {campaign.recipient_count}</span>
                      <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No campaigns yet</p>
            <Button>Create your first campaign</Button>
          </div>
        )}
      </main>
    </div>
  )
}
