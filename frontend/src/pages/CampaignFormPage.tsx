import { useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'

export default function CampaignFormPage() {
  const { id } = useParams()
  const isEdit = !!id

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          {isEdit ? 'Edit Campaign' : 'Create Campaign'}
        </h1>
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600">Campaign form page - TODO: Implement</p>
          <p className="text-sm text-green-600 mt-4">✅ Authenticated successfully!</p>
        </div>
      </main>
    </div>
  )
}
