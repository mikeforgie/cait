/**
 * Gauge Chart Component
 *
 * Circular gauge for displaying single metric scores (0-100)
 * Perfect for SEO scores, performance metrics, etc.
 */

'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface GaugeChartProps {
  value: number
  max?: number
  size?: number
  label?: string
  previousValue?: number
  colorZones?: {
    low: { max: number; color: string }
    medium: { max: number; color: string }
    high: { color: string }
  }
}

const DEFAULT_COLOR_ZONES = {
  low: { max: 40, color: '#ef4444' }, // red
  medium: { max: 70, color: '#f59e0b' }, // yellow
  high: { color: '#10b981' }, // green
}

export function GaugeChart({
  value,
  max = 100,
  size = 200,
  label = 'Score',
  previousValue,
  colorZones = DEFAULT_COLOR_ZONES,
}: GaugeChartProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  // Animate the gauge on mount
  useEffect(() => {
    const duration = 1000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setAnimatedValue(value)
        clearInterval(timer)
      } else {
        setAnimatedValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  // Determine color based on value
  const getColor = (val: number): string => {
    if (val <= colorZones.low.max) return colorZones.low.color
    if (val <= colorZones.medium.max) return colorZones.medium.color
    return colorZones.high.color
  }

  const color = getColor(value)

  // Calculate change from previous value
  const change = previousValue !== undefined ? value - previousValue : null
  const changePercent = previousValue && previousValue > 0 ? ((change || 0) / previousValue) * 100 : null

  // Data for the gauge (180-degree semicircle)
  const percentage = (animatedValue / max) * 100
  const gaugeData = [
    { name: 'value', value: percentage },
    { name: 'empty', value: 100 - percentage },
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={0}
              dataKey="value"
            >
              <Cell fill={color} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
          <div className="text-4xl font-bold" style={{ color }}>
            {animatedValue}
          </div>
          <div className="text-sm text-neutral-600 mt-1">{label}</div>
        </div>
      </div>

      {/* Change indicator */}
      {change !== null && changePercent !== null && (
        <div className="mt-2 flex items-center gap-1 text-sm">
          <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)} points
          </span>
          <span className="text-neutral-500">
            ({change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  )
}
