/**
 * Multi-Line Chart Component
 *
 * Specialized for displaying multiple data series (e.g., keyword rankings)
 * Supports inverted Y-axis for ranking data
 */

'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface MultiLineChartDataPoint {
  [key: string]: string | number
}

export interface LineSeriesConfig {
  dataKey: string
  name: string
  color: string
  hide?: boolean
}

interface MultiLineChartProps {
  data: MultiLineChartDataPoint[]
  series: LineSeriesConfig[]
  xAxisKey: string
  yAxisLabel?: string
  height?: number
  invertYAxis?: boolean
  yAxisDomain?: [number, number]
  showGrid?: boolean
  showLegend?: boolean
  formatXAxis?: (value: any) => string
  formatYAxis?: (value: any) => string
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // yellow
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
]

export function MultiLineChart({
  data,
  series,
  xAxisKey,
  yAxisLabel,
  height = 300,
  invertYAxis = false,
  yAxisDomain,
  showGrid = true,
  showLegend = true,
  formatXAxis,
  formatYAxis,
}: MultiLineChartProps) {
  // Assign colors if not provided
  const seriesWithColors = series.map((s, index) => ({
    ...s,
    color: s.color || CHART_COLORS[index % CHART_COLORS.length],
  }))

  // Custom tooltip for keyword rankings
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200 max-w-xs">
          <p className="font-medium text-sm mb-2">{payload[0].payload[xAxisKey]}</p>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {payload
              .sort((a: any, b: any) => (invertYAxis ? a.value - b.value : b.value - a.value))
              .map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-neutral-600 truncate">{entry.name}:</span>
                  <span className="font-semibold">
                    {invertYAxis ? `#${entry.value}` : entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            tickFormatter={formatXAxis}
          />
          <YAxis
            reversed={invertYAxis}
            domain={yAxisDomain}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            tickFormatter={formatYAxis}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '14px' }}
              iconType="line"
            />
          )}
          {seriesWithColors.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              name={line.name}
              hide={line.hide}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
