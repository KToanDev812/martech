/**
 * Shared date formatting utilities
 * Ensures consistent date formatting across the application
 */

/**
 * Format a date string to short format (e.g., "Jan 15, 2026")
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a date string to long format with time (e.g., "January 15, 2026, 02:30 PM")
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a date string to locale string format
 */
export function toLocaleString(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString()
}

/**
 * Format a date string for datetime-local input (e.g., "2026-04-25T14:30")
 */
export function toDateTimeLocal(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toISOString().slice(0, 16)
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(dateString: string): boolean {
  return new Date(dateString) > new Date()
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins === 0) return 'just now'
  if (diffMins < 0 && Math.abs(diffMins) < 60) return `${Math.abs(diffMins)} minutes ago`
  if (diffMins > 0 && diffMins < 60) return `in ${diffMins} minutes`
  if (diffHours < 0 && Math.abs(diffHours) < 24) return `${Math.abs(diffHours)} hours ago`
  if (diffHours > 0 && diffHours < 24) return `in ${diffHours} hours`
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
  if (diffDays > 0) return `in ${diffDays} days`

  return formatDate(dateString)
}
