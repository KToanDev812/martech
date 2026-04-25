import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RECIPIENT_STATUS_CONFIG } from '@/utils/constants'
import { toLocaleString } from '@/utils/date'
import type { Recipient } from '@/types/api.types'
import { ChevronDown, ChevronUp, Mail, Send, MailOpen, AlertCircle } from 'lucide-react'

interface RecipientTableProps {
  recipients: Recipient[]
}

export function RecipientTable({ recipients }: RecipientTableProps) {
  const [sortField, setSortField] = useState<keyof Recipient>('email')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: keyof Recipient) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedRecipients = [...recipients].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue == null || bValue == null) return 0

    let comparison = 0
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else {
      comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  const getStatusIcon = (iconName: string) => {
    switch (iconName) {
      case 'Mail': return Mail
      case 'Send': return Send
      case 'AlertCircle': return AlertCircle
      default: return Mail
    }
  }

  const SortIcon = ({ field }: { field: keyof Recipient }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  if (recipients.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No recipients</h3>
        <p className="text-gray-600">This campaign has no recipients yet.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('email')}
            >
              <div className="flex items-center gap-2">
                Email
                <SortIcon field="email" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-2">
                Name
                <SortIcon field="name" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-2">
                Status
                <SortIcon field="status" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('sent_at')}
            >
              <div className="flex items-center gap-2">
                Sent At
                <SortIcon field="sent_at" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('opened_at')}
            >
              <div className="flex items-center gap-2">
                Opened At
                <SortIcon field="opened_at" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRecipients.map((recipient) => {
            const statusConfig = RECIPIENT_STATUS_CONFIG[recipient.status] || {
              label: recipient.status,
              className: 'bg-gray-100 text-gray-800',
              iconName: 'Mail',
            }
            const StatusIcon = getStatusIcon(statusConfig.iconName)

            return (
              <TableRow key={recipient.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{recipient.email}</TableCell>
                <TableCell>{recipient.name || '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig.className}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {toLocaleString(recipient.sent_at)}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {recipient.opened_at ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <MailOpen className="h-3 w-3" />
                      {toLocaleString(recipient.opened_at)}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

