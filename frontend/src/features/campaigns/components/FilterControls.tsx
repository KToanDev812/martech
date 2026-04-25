import { Button } from '@/components/ui/button'
import { CAMPAIGN_STATUS } from '@/utils/constants'

interface FilterControlsProps {
  currentFilter: string
  onFilterChange: (filter: string) => void
  counts?: {
    all: number
    draft: number
    scheduled: number
    sent: number
  }
}

export function FilterControls({
  currentFilter,
  onFilterChange,
  counts,
}: FilterControlsProps) {
  const filters = [
    { value: 'all', label: 'All', count: counts?.all ?? 0 },
    { value: CAMPAIGN_STATUS.DRAFT, label: 'Draft', count: counts?.draft ?? 0 },
    { value: CAMPAIGN_STATUS.SCHEDULED, label: 'Scheduled', count: counts?.scheduled ?? 0 },
    { value: CAMPAIGN_STATUS.SENT, label: 'Sent', count: counts?.sent ?? 0 },
  ]

  const showCounts = counts !== undefined

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentFilter === filter.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
          className="relative"
        >
          {filter.label}
          {showCounts && (
            <span className="ml-2 text-xs opacity-70">
              ({filter.count})
            </span>
          )}
        </Button>
      ))}
    </div>
  )
}
