import api from './api'
import type {
  Campaign,
  CampaignListResponse,
  CampaignStats,
  CreateCampaignRequest,
  ScheduleCampaignRequest,
  UpdateCampaignRequest,
} from '@/types/api.types'

export const campaignsService = {
  // GET /campaigns
  async getAll(params?: { status?: string; page?: number; limit?: number }): Promise<CampaignListResponse> {
    return api.get('/campaigns', { params })
  },

  // GET /campaigns/:id
  async getById(id: string): Promise<Campaign> {
    return api.get(`/campaigns/${id}`)
  },

  // POST /campaigns
  async create(data: CreateCampaignRequest): Promise<Campaign> {
    return api.post('/campaigns', data)
  },

  // PATCH /campaigns/:id
  async update(id: string, data: UpdateCampaignRequest): Promise<Campaign> {
    return api.patch(`/campaigns/${id}`, data)
  },

  // DELETE /campaigns/:id
  async delete(id: string): Promise<void> {
    return api.delete(`/campaigns/${id}`)
  },

  // POST /campaigns/:id/schedule
  async schedule(id: string, data: ScheduleCampaignRequest): Promise<Campaign> {
    return api.post(`/campaigns/${id}/schedule`, data)
  },

  // POST /campaigns/:id/send
  async send(id: string): Promise<{ campaign_id: string; queued: boolean; recipient_count: number }> {
    return api.post(`/campaigns/${id}/send`)
  },

  // GET /campaigns/:id/stats
  async getStats(id: string): Promise<CampaignStats> {
    return api.get(`/campaigns/${id}/stats`)
  },
}
