/**
 * GradientButton Component
 *
 * Primary button with red → yellow → green gradient
 * Variants: primary, secondary, danger
 * States: hover, active, loading, disabled
 */

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function GradientButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: GradientButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantStyles = {
    primary: cn(
      'gradient-bg text-white shadow-gradient',
      'hover:gradient-bg-hover hover:shadow-xl hover:-translate-y-0.5',
      'active:translate-y-0 active:shadow-md',
      'focus:ring-red-500',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0'
    ),
    secondary: cn(
      'bg-gray-200 text-gray-900',
      'hover:bg-gray-300',
      'active:bg-gray-200',
      'focus:ring-gray-400',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ),
    danger: cn(
      'bg-red-50 text-red-800 border border-red-200',
      'hover:bg-red-500 hover:text-white hover:border-red-500',
      'active:bg-red-600',
      'focus:ring-red-500',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50 disabled:hover:text-red-800'
    )
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        loading && 'cursor-wait opacity-70',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
