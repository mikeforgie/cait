/**
 * Area Chart Component
 *
 * Stacked area chart for visualizing cumulative data (e.g., backlink growth)
 */

'use client'

import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface AreaChartDataPoint {
  [key: string]: string | number
}

export interface AreaConfig {
  dataKey: string
  name: string
  color: string
  fillOpacity?: number
}

interface AreaChartProps {
  data: AreaChartDataPoint[]
  areas: AreaConfig[]
  xAxisKey: string
  height?: number
  stacked?: boolean
  showGrid?: boolean
  showLegend?: boolean
  formatXAxis?: (value: any) => string
  formatYAxis?: (value: any) => string
  formatTooltip?: (value: any, name: string) => [string, string]
}

export function AreaChart({
  data,
  areas,
  xAxisKey,
  height = 300,
  stacked = false,
  showGrid = true,
  showLegend = true,
  formatXAxis,
  formatYAxis,
  formatTooltip,
}: AreaChartProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
          <p className="font-medium text-sm mb-2">{payload[0].payload[xAxisKey]}</p>
          {payload.map((entry: any, index: number) => {
            const [formattedValue, formattedName] = formatTooltip
              ? formatTooltip(entry.value, entry.name)
              : [entry.value.toLocaleString(), entry.name]

            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-neutral-600">{formattedName}:</span>
                <span className="font-semibold">{formattedValue}</span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            {areas.map((area) => (
              <linearGradient key={area.dataKey} id={`color-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={area.color} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            tickFormatter={formatXAxis}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            tickFormatter={formatYAxis}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '14px' }}
              iconType="rect"
            />
          )}
          {areas.map((area) => (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              stackId={stacked ? '1' : undefined}
              stroke={area.color}
              strokeWidth={2}
              fill={`url(#color-${area.dataKey})`}
              fillOpacity={area.fillOpacity || 1}
              name={area.name}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
