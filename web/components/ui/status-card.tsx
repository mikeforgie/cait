/**
 * StatusCard Component
 *
 * Card for displaying connection or health status
 * Features: status dot, percentage/score, colored border and background
 */

import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusDot } from './status-dot'
import { GradientProgress } from './gradient-progress'

export interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  status: 'success' | 'warning' | 'danger'
  value?: number // 0-100 for percentage/score
  showProgress?: boolean
  subMetrics?: Array<{
    label: string
    value: number
    status: 'success' | 'warning' | 'danger'
  }>
}

export function StatusCard({
  icon: Icon,
  title,
  description,
  status,
  value,
  showProgress = false,
  subMetrics,
  className,
  ...props
}: StatusCardProps) {
  const statusStyles = {
    success: {
      border: 'border-green-200',
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      text: 'text-green-900',
      badge: 'bg-green-100 text-green-800'
    },
    warning: {
      border: 'border-yellow-200',
      bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      text: 'text-yellow-900',
      badge: 'bg-yellow-100 text-yellow-800'
    },
    danger: {
      border: 'border-red-200',
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      text: 'text-red-900',
      badge: 'bg-red-100 text-red-800'
    }
  }

  const statusLabels = {
    success: 'Healthy',
    warning: 'Attention Needed',
    danger: 'Issues Detected'
  }

  return (
    <div
      className={cn(
        'p-6 rounded-lg border',
        statusStyles[status].border,
        statusStyles[status].bg,
        'hover:shadow-lg transition-all',
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon className={cn('w-5 h-5', statusStyles[status].text)} />}
            <h3 className={cn('text-lg font-semibold', statusStyles[status].text)}>
              {title}
            </h3>
          </div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>

        <div className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          statusStyles[status].badge
        )}>
          <StatusDot status={status} size="sm" className="inline-block mr-1.5" />
          {statusLabels[status]}
        </div>
      </div>

      {/* Value and Progress */}
      {value !== undefined && (
        <div className="mb-4">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {value}%
          </div>
          {showProgress && <GradientProgress value={value} size="md" />}
        </div>
      )}

      {/* Sub Metrics */}
      {subMetrics && subMetrics.length > 0 && (
        <div className="space-y-2 border-t border-gray-200 pt-4">
          {subMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <StatusDot status={metric.status} size="sm" pulse={false} />
                <span className="text-gray-700">{metric.label}</span>
              </div>
              <span className="font-semibold text-gray-900">{metric.value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
