import { cn } from '@/utils/cn'
import { CAMPAIGN_STATUS_CONFIG, type CampaignStatus } from '@/utils/constants'

interface StatusBadgeProps {
  status: CampaignStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = CAMPAIGN_STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

