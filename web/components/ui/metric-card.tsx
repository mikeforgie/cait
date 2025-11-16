/**
 * MetricCard Component
 *
 * Display card for key metrics and statistics
 * Features icon, label, value, and optional trend indicator
 */

import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down'
    label?: string
  }
  iconColor?: 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray'
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  iconColor = 'blue',
  className,
  ...props
}: MetricCardProps) {
  const iconColorStyles = {
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600'
  }

  const trendColorStyles = {
    up: 'text-green-600',
    down: 'text-red-600'
  }

  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-gray-200 bg-gray-50 hover:shadow-md transition-shadow',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('p-2 rounded-md', iconColorStyles[iconColor])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-gray-900">{value}</div>

        {trend && (
          <div className={cn('text-xs font-medium', trendColorStyles[trend.direction])}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
            {trend.label && <span className="ml-1 text-gray-500">{trend.label}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
