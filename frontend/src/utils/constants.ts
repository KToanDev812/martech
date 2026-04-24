// Campaign Status Constants
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
} as const

export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS]

// Campaign Status Configuration
export const CAMPAIGN_STATUS_CONFIG = {
  [CAMPAIGN_STATUS.DRAFT]: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  [CAMPAIGN_STATUS.SCHEDULED]: {
    label: 'Scheduled',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  [CAMPAIGN_STATUS.SENT]: {
    label: 'Sent',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
} as const

// Recipient Status Constants
export const RECIPIENT_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const

export type RecipientStatus = typeof RECIPIENT_STATUS[keyof typeof RECIPIENT_STATUS]

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

// API Response Messages
export const API_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_EXISTS: 'Email already exists',
  CAMPAIGN_NOT_FOUND: 'Campaign not found',
  NOT_DRAFT_STATUS: 'Campaign is not in draft status',
  ONLY_DRAFT_EDITABLE: 'Only draft campaigns can be edited',
  ONLY_DRAFT_DELETABLE: 'Only draft campaigns can be deleted',
  SCHEDULE_TIME_PAST: 'scheduled_at must be in the future',
} as const
