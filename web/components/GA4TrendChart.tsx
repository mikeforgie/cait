/**
 * GA4 Trend Chart Component
 *
 * Displays Google Analytics trends over time
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface DailyMetric {
  date: string
  users: number
  sessions: number
  pageviews: number
}

interface GA4TrendChartProps {
  data: DailyMetric[]
  title?: string
  description?: string
  showComparison?: boolean
  previousPeriodData?: DailyMetric[]
}

export function GA4TrendChart({
  data,
  title = 'Traffic Trends',
  description = 'Daily analytics over time',
  showComparison = false,
  previousPeriodData,
}: GA4TrendChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'sessions' | 'pageviews'>('users')

  // Calculate totals for current period
  const totalUsers = data.reduce((sum, day) => sum + day.users, 0)
  const totalSessions = data.reduce((sum, day) => sum + day.sessions, 0)
  const totalPageviews = data.reduce((sum, day) => sum + day.pageviews, 0)

  // Calculate comparison if previous period data exists
  const comparison = showComparison && previousPeriodData ? calculateComparison(data, previousPeriodData) : null

  // Format date for display
  const formatDate = (dateStr: string, includeYear: boolean = false) => {
    try {
      // Handle YYYYMMDD format from GA4
      if (dateStr.length === 8) {
        const year = dateStr.substring(0, 4)
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        const date = new Date(`${year}-${month}-${day}`)
        return date.toLocaleDateString('en-US', includeYear ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' })
      }
      // Handle ISO date format
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', includeYear ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' })
    } catch (error) {
      return dateStr
    }
  }

  // Format data for chart
  const chartData = data.map((day) => ({
    date: formatDate(day.date),
    users: day.users,
    sessions: day.sessions,
    pageviews: day.pageviews,
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-neutral-200">
          <p className="font-medium text-sm mb-2">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-neutral-600">{entry.name}:</span>
              <span className="font-semibold">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {comparison && (
            <div className="flex gap-2">
              <TrendComparisonBadge
                current={totalUsers}
                previous={comparison.previousUsers}
                label="Users"
              />
              <TrendComparisonBadge
                current={totalSessions}
                previous={comparison.previousSessions}
                label="Sessions"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedMetric === 'users'
                ? 'border-blue-500 bg-blue-50'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
            onClick={() => setSelectedMetric('users')}
          >
            <div className="text-sm text-neutral-600 mb-1">Total Users</div>
            <div className="text-2xl font-semibold">{totalUsers.toLocaleString()}</div>
            {comparison && (
              <div className="mt-2">
                <TrendIndicator
                  current={totalUsers}
                  previous={comparison.previousUsers}
                />
              </div>
            )}
          </div>

          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedMetric === 'sessions'
                ? 'border-green-500 bg-green-50'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
            onClick={() => setSelectedMetric('sessions')}
          >
            <div className="text-sm text-neutral-600 mb-1">Total Sessions</div>
            <div className="text-2xl font-semibold">{totalSessions.toLocaleString()}</div>
            {comparison && (
              <div className="mt-2">
                <TrendIndicator
                  current={totalSessions}
                  previous={comparison.previousSessions}
                />
              </div>
            )}
          </div>

          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedMetric === 'pageviews'
                ? 'border-purple-500 bg-purple-50'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
            onClick={() => setSelectedMetric('pageviews')}
          >
            <div className="text-sm text-neutral-600 mb-1">Total Pageviews</div>
            <div className="text-2xl font-semibold">{totalPageviews.toLocaleString()}</div>
            {comparison && (
              <div className="mt-2">
                <TrendIndicator
                  current={totalPageviews}
                  previous={comparison.previousPageviews}
                />
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '14px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Users"
                hide={selectedMetric !== 'users' && selectedMetric !== 'sessions'}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Sessions"
                hide={selectedMetric === 'pageviews'}
              />
              <Line
                type="monotone"
                dataKey="pageviews"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Pageviews"
                hide={selectedMetric !== 'pageviews'}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        {data.length > 1 && (
          <div className="text-sm text-neutral-600">
            <p>
              Showing data for {data.length} days (
              {formatDate(data[0].date)} - {formatDate(data[data.length - 1].date)})
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper component for trend comparison badges
function TrendComparisonBadge({
  current,
  previous,
  label,
}: {
  current: number
  previous: number
  label: string
}) {
  const change = ((current - previous) / previous) * 100
  const isPositive = change > 0
  const isNeutral = Math.abs(change) < 1

  return (
    <Badge
      variant={isNeutral ? 'secondary' : isPositive ? 'default' : 'destructive'}
      className="text-xs"
    >
      {label}: {isPositive && '+'}{change.toFixed(1)}%
    </Badge>
  )
}

// Helper component for trend indicators
function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const change = ((current - previous) / previous) * 100
  const isPositive = change > 0
  const isNeutral = Math.abs(change) < 1

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
  const color = isNeutral ? 'text-neutral-600' : isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {isPositive && '+'}
      {change.toFixed(1)}% vs previous
    </div>
  )
}

// Helper function to calculate comparison metrics
function calculateComparison(current: DailyMetric[], previous: DailyMetric[]) {
  const currentUsers = current.reduce((sum, day) => sum + day.users, 0)
  const currentSessions = current.reduce((sum, day) => sum + day.sessions, 0)
  const currentPageviews = current.reduce((sum, day) => sum + day.pageviews, 0)

  const previousUsers = previous.reduce((sum, day) => sum + day.users, 0)
  const previousSessions = previous.reduce((sum, day) => sum + day.sessions, 0)
  const previousPageviews = previous.reduce((sum, day) => sum + day.pageviews, 0)

  return {
    previousUsers,
    previousSessions,
    previousPageviews,
  }
}
