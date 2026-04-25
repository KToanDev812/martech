import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Mail, Send, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { CampaignStats } from '@/types/api.types'

interface StatsDisplayProps {
  stats: CampaignStats
}

export function StatsDisplay({ stats }: StatsDisplayProps) {

  const formatRate = (rate: number) => {
    return (rate * 100).toFixed(1)
  }

  const getRateColor = (rate: number) => {
    if (rate >= 0.5) return 'text-green-600'
    if (rate >= 0.3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRateIcon = (rate: number) => {
    if (rate >= 0.5) return TrendingUp
    if (rate >= 0.3) return TrendingUp
    return TrendingDown
  }

  const statsCards = [
    {
      label: 'Total Recipients',
      value: stats.total,
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      label: 'Successfully Sent',
      value: stats.sent,
      icon: Send,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Failed',
      value: stats.failed,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      label: 'Opened',
      value: stats.opened,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ]

  const rateStats = [
    {
      label: 'Send Rate',
      value: formatRate(stats.send_rate),
      rate: stats.send_rate,
      description: `${stats.sent} of ${stats.total} emails sent successfully`,
    },
    {
      label: 'Open Rate',
      value: formatRate(stats.open_rate),
      rate: stats.open_rate,
      description: `${stats.opened} of ${stats.sent} recipients opened email`,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Count Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Rate Stats with Progress Bars */}
      <div className="grid gap-4 md:grid-cols-2">
        {rateStats.map((stat) => {
          const RateIcon = getRateIcon(stat.rate)
          const percentage = Math.round(stat.rate * 100)
          return (
            <Card key={stat.label}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-2">
                  {stat.label}
                  <RateIcon className={`h-4 w-4 ${getRateColor(stat.rate)}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-gray-900">
                      {stat.value}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
