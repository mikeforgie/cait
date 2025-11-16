/**
 * KeyMetricsCard Component
 *
 * Dashboard key metrics display with:
 * - 4-metric grid
 * - Trend indicators (up/down arrows)
 * - Color-coded values
 */

'use client'

import { TrendingUp, TrendingDown, Users, BarChart2, Clock, MousePointer } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface Metric {
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down'
    value: number
    label?: string
  }
  icon: LucideIcon
  color: 'green' | 'red' | 'yellow' | 'blue'
}

interface KeyMetricsCardProps {
  metrics?: Metric[]
}

export function KeyMetricsCard({
  metrics = [
    {
      label: 'Traffic',
      value: '12,458',
      trend: { direction: 'up', value: 23, label: 'vs last month' },
      icon: Users,
      color: 'green'
    },
    {
      label: 'Rankings',
      value: '+8',
      trend: { direction: 'up', value: 8, label: 'keywords' },
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: 'Bounce Rate',
      value: '42%',
      trend: { direction: 'down', value: 12, label: 'improvement' },
      icon: MousePointer,
      color: 'yellow'
    },
    {
      label: 'Avg Time',
      value: '2:45m',
      trend: undefined,
      icon: Clock,
      color: 'blue'
    }
  ]
}: KeyMetricsCardProps) {
  const colorStyles = {
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-gray-600" />
          <CardTitle>Key Metrics</CardTitle>
        </div>
        <CardDescription>Performance at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            const TrendIcon = metric.trend?.direction === 'up' ? TrendingUp : TrendingDown
            const trendColor = metric.trend?.direction === 'up' ? 'text-green-600' : 'text-red-600'

            return (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${colorStyles[metric.color]}`} />
                  <span className="text-xs text-gray-600 font-medium">{metric.label}</span>
                </div>

                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>

                {metric.trend && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{metric.trend.value}%</span>
                    {metric.trend.label && (
                      <span className="text-gray-500 ml-1">{metric.trend.label}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
