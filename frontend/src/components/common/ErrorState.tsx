import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  isRetrying?: boolean
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Failed to load campaigns. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
          {title}
        </h3>

        <p className="text-sm text-gray-600 text-center mb-8 max-w-md leading-relaxed">
          {message}
        </p>

        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="gap-2 border-destructive/50 hover:bg-destructive/10"
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {retryLabel}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

