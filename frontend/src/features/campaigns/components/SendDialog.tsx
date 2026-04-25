import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import type { Campaign } from '@/types/api.types'

interface SendDialogProps {
  campaign?: Campaign
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: () => Promise<void>
  isSending: boolean
}

export function SendDialog({
  campaign,
  open,
  onOpenChange,
  onSend,
  isSending,
}: SendDialogProps) {
  const handleSend = async () => {
    await onSend()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <AlertDialogTitle>Send Campaign Now</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4">
            {campaign ? (
              <>
                Are you sure you want to send <strong>"{campaign.name}"</strong> to{' '}
                <strong>{campaign.recipient_count}</strong> recipients?
                <br />
                <br />
                {campaign.status === 'scheduled' ? (
                  <>
                    This will override the existing schedule and send the campaign immediately.
                    <br />
                    The campaign will be sent to all recipients and cannot be undone.
                  </>
                ) : (
                  <>
                    The campaign will be sent immediately to all recipients.
                    <br />
                    This action cannot be undone.
                  </>
                )}
              </>
            ) : (
              <>
                Are you sure you want to send this campaign?
                <br />
                <br />
                This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending || !campaign}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Campaign
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
