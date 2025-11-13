/**
 * StatusDot Component
 *
 * Pulsing status indicator dot
 * Colors: green (success), yellow (warning), red (danger)
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'success' | 'warning' | 'danger' | 'green' | 'yellow' | 'red'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  label?: string
}

export function StatusDot({
  status,
  size = 'md',
  pulse = true,
  label,
  className,
  ...props
}: StatusDotProps) {
  // Normalize status to color
  const colorMap = {
    success: 'green',
    warning: 'yellow',
    danger: 'red',
    green: 'green',
    yellow: 'yellow',
    red: 'red'
  }

  const color = colorMap[status]

  const sizeStyles = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  const colorStyles = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  if (label) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)} {...props}>
        <span
          className={cn(
            'rounded-full',
            sizeStyles[size],
            colorStyles[color],
            pulse && 'animate-pulse'
          )}
        />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeStyles[size],
        colorStyles[color],
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    />
  )
}
