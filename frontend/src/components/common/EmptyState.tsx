import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { MailOpen, Plus } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ComponentType<LucideProps> | React.ReactNode
  iconClassName?: string
}

export function EmptyState({
  title = 'No campaigns yet',
  description = 'Get started by creating your first email campaign',
  actionLabel = 'Create Campaign',
  onAction,
  icon,
  iconClassName,
}: EmptyStateProps) {
  const isIconComponent = icon && typeof icon !== 'function' && React.isValidElement(icon)

  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-20 px-6">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6",
          "bg-primary/5",
          iconClassName
        )}>
          {isIconComponent ? (
            icon
          ) : icon && typeof icon === 'function' ? (
            React.createElement(icon as React.ComponentType<LucideProps>, {
              className: "h-10 w-10 text-primary"
            })
          ) : (
            <MailOpen className="h-10 w-10 text-primary" />
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
          {title}
        </h3>

        <p className="text-sm text-gray-600 text-center mb-8 max-w-md leading-relaxed">
          {description}
        </p>

        {onAction && (
          <Button onClick={onAction} size="lg" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}


