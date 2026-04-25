import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent as AlertDialogContentWrapper,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Campaign } from '@/types/api.types'

interface ScheduleDialogProps {
  campaign?: Campaign
  open: boolean
  onOpenChange: (open: boolean) => void
  onSchedule: (scheduledAt: string) => Promise<void>
}

export function ScheduleDialog({
  campaign,
  open,
  onOpenChange,
  onSchedule,
}: ScheduleDialogProps) {
  const [scheduledAt, setScheduledAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setScheduledAt('')
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!campaign) {
      return
    }

    setIsSubmitting(true)

    try {
      // Convert datetime-local format to ISO 8601 datetime
      // datetime-local gives us "2026-04-26T10:00", we need "2026-04-26T10:00:00.000Z"
      const scheduledDate = new Date(scheduledAt)
      const isoDateTime = scheduledDate.toISOString()

      await onSchedule(isoDateTime)
      handleOpenChange(false)
    } catch (error) {
      console.error('Failed to schedule campaign:', error)
      setIsSubmitting(false)
    }
  }

  // Get minimum date (current time + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5)
    return now.toISOString().slice(0, 16)
  }

  // Initialize scheduled date when dialog opens for a specific campaign
  const getInitialScheduledAt = () => {
    if (campaign?.scheduled_at) {
      return new Date(campaign.scheduled_at).toISOString().slice(0, 16)
    }
    // Default to tomorrow 10 AM
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    return tomorrow.toISOString().slice(0, 16)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContentWrapper key={campaign?.id}>
        <AlertDialogHeader>
          <AlertDialogTitle>Schedule Campaign</AlertDialogTitle>
          <AlertDialogDescription>
            {campaign ? `Choose when to send the "${campaign.name}" campaign` : 'Choose when to send this campaign'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled-at">Schedule Date & Time</Label>
              <Input
                id="scheduled-at"
                type="datetime-local"
                min={getMinDateTime()}
                value={scheduledAt || getInitialScheduledAt()}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Campaign will be sent automatically at the scheduled time
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button type="submit" disabled={isSubmitting || !scheduledAt || !campaign}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Campaign'
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContentWrapper>
    </AlertDialog>
  )
}
