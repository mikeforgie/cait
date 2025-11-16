/**
 * StatusDot Component
 *
 * Simple colored dot indicator with status variants
 * Used for connection status, task priority, health indicators, etc.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

export function StatusDot({
  status,
  size = 'md',
  pulse = false,
  className,
  ...props
}: StatusDotProps) {
  const statusColors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  }

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <span
      className={cn(
        'rounded-full inline-block',
        statusColors[status],
        sizes[size],
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    />
  )
}
