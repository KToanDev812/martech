// API Response Types (Matching Backend Contract)
export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string>
  }
}

// Auth Types
export interface User {
  id: string
  email: string
  name: string
  created_at?: string
}

export interface AuthResponse {
  user: User
  token: string
}

// Campaign Types
export type CampaignStatus = 'draft' | 'scheduled' | 'sent'

export interface Campaign {
  id: string
  name: string
  subject: string
  body: string
  status: CampaignStatus
  scheduled_at: string | null
  created_by: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
  recipient_count: number
  recipients?: Recipient[]
}

export interface Recipient {
  id: string
  email: string
  name: string | null
  sent_at: string | null
  opened_at: string | null
  status: 'pending' | 'sent' | 'failed'
}

export interface CampaignListResponse {
  campaigns: Campaign[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export interface CampaignStats {
  total: number
  sent: number
  failed: number
  opened: number
  open_rate: number
  send_rate: number
}

// Request Types
export interface CreateCampaignRequest {
  name: string
  subject: string
  body: string
  recipient_emails?: string[]
}

export interface UpdateCampaignRequest {
  name?: string
  subject?: string
  body?: string
  scheduled_at?: string | null | undefined
}

export interface ScheduleCampaignRequest {
  scheduled_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
}
