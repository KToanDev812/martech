import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { Campaign } from '@/types/api.types'

interface DeleteDialogProps {
  campaign?: Campaign
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => Promise<void>
  isDeleting: boolean
}

export function DeleteDialog({
  campaign,
  open,
  onOpenChange,
  onDelete,
  isDeleting,
}: DeleteDialogProps) {
  const handleDelete = async () => {
    await onDelete()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4">
            {campaign ? (
              <>
                Are you sure you want to delete the campaign <strong>"{campaign.name}"</strong>?
                <br />
                <br />
                This action cannot be undone. All campaign data including recipients and
                statistics will be permanently removed.
              </>
            ) : (
              <>
                Are you sure you want to delete this campaign?
                <br />
                <br />
                This action cannot be undone. All campaign data including recipients and
                statistics will be permanently removed.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !campaign}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Campaign'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
