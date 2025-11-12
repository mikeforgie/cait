/**
 * Chart Configuration
 *
 * Centralized styling and configuration for all charts
 */

// Brand colors matching dashboard theme
export const CHART_COLORS = {
  primary: '#3b82f6', // blue
  success: '#10b981', // green
  warning: '#f59e0b', // yellow/orange
  error: '#ef4444', // red
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
  indigo: '#6366f1',
} as const

// Multi-line chart color palette (for keywords, competitors, etc.)
export const MULTI_LINE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.purple,
  CHART_COLORS.warning,
  CHART_COLORS.error,
  CHART_COLORS.cyan,
  CHART_COLORS.pink,
  CHART_COLORS.orange,
  CHART_COLORS.teal,
  CHART_COLORS.indigo,
] as const

// Gauge chart color zones
export const GAUGE_ZONES = {
  critical: { max: 40, color: CHART_COLORS.error },
  warning: { max: 70, color: CHART_COLORS.warning },
  good: { color: CHART_COLORS.success },
} as const

// Chart dimensions
export const CHART_HEIGHTS = {
  small: 200,
  medium: 300,
  large: 400,
  xlarge: 500,
} as const

// Common chart configuration
export const CHART_CONFIG = {
  grid: {
    strokeDasharray: '3 3',
    stroke: '#e5e7eb',
  },
  axis: {
    fontSize: 12,
    stroke: '#9ca3af',
  },
  legend: {
    fontSize: 14,
  },
  tooltip: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    padding: '0.75rem',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  line: {
    strokeWidth: 2,
    dotRadius: 3,
    activeDotRadius: 5,
  },
  area: {
    strokeWidth: 2,
    fillOpacity: 1,
  },
  bar: {
    borderRadius: [4, 4, 0, 0],
  },
} as const

// Animation configuration
export const CHART_ANIMATIONS = {
  duration: 500, // ms
  easing: 'ease-in-out',
} as const

// Date format presets
export const DATE_FORMATS = {
  short: 'MMM d', // Jan 15
  medium: 'MMM d, yyyy', // Jan 15, 2024
  long: 'MMMM d, yyyy', // January 15, 2024
  iso: 'yyyy-MM-dd', // 2024-01-15
} as const

// Number format utilities
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`
}

export const formatCompactNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}
