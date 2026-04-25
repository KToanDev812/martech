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
    className: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200',
  },
  [CAMPAIGN_STATUS.SCHEDULED]: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
  },
  [CAMPAIGN_STATUS.SENT]: {
    label: 'Sent',
    className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
  },
} as const

// Recipient Status Constants
export const RECIPIENT_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const

export type RecipientStatus = typeof RECIPIENT_STATUS[keyof typeof RECIPIENT_STATUS]

// Recipient Status Configuration (with icon component names)
export const RECIPIENT_STATUS_CONFIG = {
  [RECIPIENT_STATUS.PENDING]: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800',
    iconName: 'Mail',
  },
  [RECIPIENT_STATUS.SENT]: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-800',
    iconName: 'Send',
  },
  [RECIPIENT_STATUS.FAILED]: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800',
    iconName: 'AlertCircle',
  },
} as const

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

// UX Constants
export const UX = {
  // Animation durations (in ms)
  ANIMATION: {
    FAST: 150,
    BASE: 200,
    SLOW: 300,
  },

  // Debounce delays (in ms)
  DEBOUNCE: {
    INPUT: 300,
    SEARCH: 500,
  },

  // Toast durations (in ms)
  TOAST: {
    SHORT: 3000,
    MEDIUM: 5000,
    LONG: 10000,
  },

  // Loading states
  LOADING: {
    MIN_DISPLAY_TIME: 500, // Prevent flickering
    SKELETON_COUNT: 3,     // Default number of skeleton items
  },
} as const

// Z-index layers
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const

// Breakpoints for responsive design (matches Tailwind)
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const
