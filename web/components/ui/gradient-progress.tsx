/**
 * GradientProgress Component
 *
 * Progress bar with red → yellow → green gradient
 * Adapts color based on percentage value
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface GradientProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0-100
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export function GradientProgress({
  value,
  showLabel = false,
  size = 'md',
  animated = true,
  className,
  ...props
}: GradientProgressProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100)

  // Determine color based on value
  const getColorClass = (val: number) => {
    if (val < 34) return 'bg-red-500'
    if (val < 67) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{clampedValue}%</span>
        </div>
      )}

      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            animated ? 'transition-all duration-500' : '',
            // Use gradient for full bar, or single color based on current value
            clampedValue >= 67 ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500' : getColorClass(clampedValue)
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  )
}
