/**
 * Bar Chart Component
 *
 * For comparing metrics across categories or time periods
 */

'use client'

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface BarChartDataPoint {
  [key: string]: string | number
}

export interface BarConfig {
  dataKey: string
  name: string
  color: string
}

interface BarChartProps {
  data: BarChartDataPoint[]
  bars: BarConfig[]
  xAxisKey: string
  height?: number
  horizontal?: boolean
  stacked?: boolean
  showGrid?: boolean
  showLegend?: boolean
  formatXAxis?: (value: any) => string
  formatYAxis?: (value: any) => string
  formatTooltip?: (value: any, name: string) => [string, string]
}

export function BarChart({
  data,
  bars,
  xAxisKey,
  height = 300,
  horizontal = false,
  stacked = false,
  showGrid = true,
  showLegend = true,
  formatXAxis,
  formatYAxis,
  formatTooltip,
}: BarChartProps) {
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
                  className="w-3 h-3 rounded"
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
        <RechartsBarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 20, left: horizontal ? 100 : 0, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                tickFormatter={formatYAxis}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                tickFormatter={formatXAxis}
              />
            </>
          ) : (
            <>
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
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '14px' }}
              iconType="rect"
            />
          )}
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.color}
              stackId={stacked ? '1' : undefined}
              name={bar.name}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
