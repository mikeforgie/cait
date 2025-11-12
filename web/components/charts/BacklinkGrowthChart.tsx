'use client'

import { useState } from 'react'
import { AreaChart } from './AreaChart'
import { LineChart } from './LineChart'
import { CHART_COLORS } from '@/lib/charts'
import { format } from 'date-fns'

export interface BacklinkDataPoint {
  date: string
  new: number
  lost: number
  existing: number
  total: number
  domainAuthority: number
  [key: string]: string | number
}

export interface BacklinkGrowthChartProps {
  data: BacklinkDataPoint[]
  height?: number
  showDomainAuthority?: boolean
  title?: string
  className?: string
}

export function BacklinkGrowthChart({
  data,
  height = 350,
  showDomainAuthority = true,
  title = 'Backlink Growth Over Time',
  className = '',
}: BacklinkGrowthChartProps) {
  const [viewMode, setViewMode] = useState<'stacked' | 'total'>('stacked')

  // Calculate summary statistics
  const latestData = data[data.length - 1]
  const firstData = data[0]

  const totalBacklinks = latestData?.total || 0
  const totalNew = data.reduce((sum, d) => sum + d.new, 0)
  const totalLost = data.reduce((sum, d) => sum + d.lost, 0)
  const netGrowth = totalBacklinks - (firstData?.total || 0)
  const currentDA = latestData?.domainAuthority || 0
  const daChange = currentDA - (firstData?.domainAuthority || 0)

  // Calculate average monthly growth
  const monthsOfData = data.length > 0 ? data.length / 30 : 1
  const avgMonthlyGrowth = netGrowth / monthsOfData

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('stacked')}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${viewMode === 'stacked'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Breakdown
            </button>
            <button
              onClick={() => setViewMode('total')}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${viewMode === 'total'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Total
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          {/* Total Backlinks */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Total Backlinks</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalBacklinks.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {netGrowth > 0 ? '+' : ''}{netGrowth.toLocaleString()} net growth
            </div>
          </div>

          {/* New Backlinks */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">New Backlinks</div>
            <div className="text-2xl font-bold text-green-600">
              {totalNew.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ~{Math.round(avgMonthlyGrowth)}/month avg
            </div>
          </div>

          {/* Lost Backlinks */}
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Lost Backlinks</div>
            <div className="text-2xl font-bold text-red-600">
              {totalLost.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((totalLost / (totalNew || 1)) * 100).toFixed(1)}% loss rate
            </div>
          </div>

          {/* Domain Authority */}
          {showDomainAuthority && (
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Domain Authority</div>
              <div className="text-2xl font-bold text-purple-600">
                {currentDA}
              </div>
              <div className={`text-xs mt-1 ${daChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {daChange > 0 ? '+' : ''}{daChange} change
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        {viewMode === 'stacked' ? (
          <AreaChart
            data={data}
            areas={[
              {
                dataKey: 'new',
                name: 'New Backlinks',
                color: CHART_COLORS.success,
              },
              {
                dataKey: 'existing',
                name: 'Existing Backlinks',
                color: CHART_COLORS.primary,
              },
              {
                dataKey: 'lost',
                name: 'Lost Backlinks',
                color: CHART_COLORS.error,
              },
            ]}
            xAxisKey="date"
            stacked={true}
            height={height}
            formatXAxis={(value) => {
              try {
                return format(new Date(value), 'MMM d')
              } catch {
                return value
              }
            }}
            formatYAxis={(value) => value.toLocaleString()}
          />
        ) : (
          <LineChart
            data={data}
            lines={[
              {
                dataKey: 'total',
                name: 'Total Backlinks',
                color: CHART_COLORS.primary,
              },
              ...(showDomainAuthority && data.some(d => d.domainAuthority) ? [{
                dataKey: 'domainAuthority',
                name: 'Domain Authority',
                color: CHART_COLORS.purple,
              }] : []),
            ]}
            xAxisKey="date"
            height={height}
            formatXAxis={(value) => {
              try {
                return format(new Date(value), 'MMM d')
              } catch {
                return value
              }
            }}
            formatYAxis={(value) => value.toLocaleString()}
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        {viewMode === 'stacked' ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">New</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Existing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Lost</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Total Backlinks</span>
            </div>
            {showDomainAuthority && data.some(d => d.domainAuthority) && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-600">Domain Authority</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Data Quality Indicator */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Tracking {data.length} days of backlink data • Last updated: {format(new Date(), 'MMM d, yyyy')}
      </div>
    </div>
  )
}
