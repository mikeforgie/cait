/**
 * GA4 Data Display Component
 *
 * Shows Google Analytics 4 metrics for a client
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, MousePointer, Clock, TrendingUp, RefreshCw } from 'lucide-react'
import { GA4TrendChart } from './GA4TrendChart'

interface DailyMetric {
  date: string
  users: number
  sessions: number
  pageviews: number
}

interface GA4Data {
  dateRange: {
    startDate: string
    endDate: string
  }
  metrics: {
    totalUsers: number
    newUsers: number
    sessions: number
    bounceRate: number
    avgSessionDuration: number
    pageviews: number
    eventsCount: number
  }
  topPages: Array<{
    pagePath: string
    pageTitle: string
    screenPageViews: number
    bounceRate: number
  }>
  topSources: Array<{
    source: string
    medium: string
    users: number
    sessions: number
  }>
  dailyMetrics?: DailyMetric[]
}

interface GA4DataCardProps {
  clientId: string
  initialData?: GA4Data | null
  propertyName?: string
}

type TimePeriod = '7days' | '30days' | '90days'

const TIME_PERIODS: Record<TimePeriod, { label: string; days: string }> = {
  '7days': { label: '7 Days', days: '7daysAgo' },
  '30days': { label: '30 Days', days: '30daysAgo' },
  '90days': { label: '90 Days', days: '90daysAgo' },
}

export function GA4DataCard({ clientId, initialData, propertyName }: GA4DataCardProps) {
  const [data, setData] = useState<GA4Data | null>(initialData || null)
  const [previousPeriodData, setPreviousPeriodData] = useState<DailyMetric[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days')
  const [showComparison, setShowComparison] = useState(false)

  const fetchGA4Data = async (period?: TimePeriod) => {
    setLoading(true)
    setError(null)

    const periodToUse = period || selectedPeriod
    const startDate = TIME_PERIODS[periodToUse].days

    try {
      // Fetch current period data
      const response = await fetch('/api/analytics/ga4/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          startDate,
          endDate: 'today',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch GA4 data')
      }

      const result = await response.json()
      setData(result.data)

      // If comparison is enabled, fetch previous period data
      if (showComparison) {
        const daysAgo = parseInt(startDate.replace('daysAgo', ''))
        const previousStartDate = `${daysAgo * 2}daysAgo`
        const previousEndDate = `${daysAgo + 1}daysAgo`

        const previousResponse = await fetch('/api/analytics/ga4/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            startDate: previousStartDate,
            endDate: previousEndDate,
          }),
        })

        if (previousResponse.ok) {
          const previousResult = await previousResponse.json()
          setPreviousPeriodData(previousResult.data.dailyMetrics || null)
        }
      } else {
        setPreviousPeriodData(null)
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching GA4 data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}m ${secs}s`
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatDateRange = (dateStr: string) => {
    try {
      // Handle YYYYMMDD format from GA4
      if (dateStr.length === 8) {
        const year = dateStr.substring(0, 4)
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        const date = new Date(`${year}-${month}-${day}`)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
      // Handle ISO date format or "today"
      if (dateStr === 'today') return 'Today'
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch (error) {
      return dateStr
    }
  }

  const isDataDelayed = (endDateStr: string) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let endDate: Date
      if (endDateStr.length === 8) {
        const year = endDateStr.substring(0, 4)
        const month = endDateStr.substring(4, 6)
        const day = endDateStr.substring(6, 8)
        endDate = new Date(`${year}-${month}-${day}`)
      } else {
        endDate = new Date(endDateStr)
      }
      endDate.setHours(0, 0, 0, 0)

      // If end date is more than 1 day before today, data is delayed
      const daysDiff = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff >= 2
    } catch (error) {
      return false
    }
  }

  const getExpectedDays = (period: TimePeriod): number => {
    return parseInt(TIME_PERIODS[period].days.replace('daysAgo', ''))
  }

  const handlePeriodChange = async (period: TimePeriod) => {
    setSelectedPeriod(period)
    await fetchGA4Data(period)
  }

  const toggleComparison = async () => {
    const newComparisonState = !showComparison
    setShowComparison(newComparisonState)
    if (newComparisonState) {
      // Re-fetch data with comparison enabled
      await fetchGA4Data()
    } else {
      setPreviousPeriodData(null)
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Google Analytics 4
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchGA4Data()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Google Analytics 4
          </CardTitle>
          <CardDescription>
            {propertyName || 'No data available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-neutral-600 mb-4">Click to fetch analytics data</p>
            <Button onClick={() => fetchGA4Data()} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Fetch GA4 Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const expectedDays = getExpectedDays(selectedPeriod)
  const actualDays = data.dailyMetrics?.length || 0
  const isPartialData = actualDays < expectedDays
  const isDelayed = isDataDelayed(data.dateRange.endDate)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Google Analytics 4
            </CardTitle>
            <CardDescription>
              {propertyName || 'Analytics Data'}
              <span className="ml-2">
                {formatDateRange(data.dateRange.startDate)} to {formatDateRange(data.dateRange.endDate)}
                {data.dailyMetrics && ` (${data.dailyMetrics.length} ${data.dailyMetrics.length === 1 ? 'day' : 'days'})`}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Comparison Toggle */}
            <Button
              onClick={toggleComparison}
              disabled={loading}
              variant={showComparison ? 'default' : 'outline'}
              size="sm"
            >
              {showComparison ? 'Hide' : 'Show'} Comparison
            </Button>
            {/* Time Period Selector */}
            <div className="flex border border-neutral-200 rounded-md overflow-hidden">
              {(Object.keys(TIME_PERIODS) as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  disabled={loading}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-neutral-700 hover:bg-neutral-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {TIME_PERIODS[period].label}
                </button>
              ))}
            </div>
            {/* Refresh Button */}
            <Button onClick={() => fetchGA4Data()} disabled={loading} variant="outline" size="sm">
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Status Info Banner */}
        {(isPartialData || isDelayed) && (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  {isPartialData ? `Showing ${actualDays} of ${expectedDays} days requested` : 'Latest available data'}
                </h4>
                <p className="text-sm text-blue-800">
                  Google Analytics 4 processes data with a <strong>24-72 hour delay</strong>.
                  {isDelayed && ` The most recent data available is from ${formatDateRange(data.dateRange.endDate)}.`}
                  {isPartialData && ` You requested ${TIME_PERIODS[selectedPeriod].label} but only ${actualDays} ${actualDays === 1 ? 'day' : 'days'} of processed data ${actualDays === 1 ? 'is' : 'are'} currently available.`}
                  {' '}This is normal behavior for all GA4 properties, regardless of age.
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  💡 Tip: Check back in 24-48 hours for more complete data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Users className="w-4 h-4" />
              Users
            </div>
            <div className="text-2xl font-semibold">{formatNumber(data.metrics.totalUsers)}</div>
            <div className="text-xs text-neutral-500">
              {formatNumber(data.metrics.newUsers)} new
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <MousePointer className="w-4 h-4" />
              Sessions
            </div>
            <div className="text-2xl font-semibold">{formatNumber(data.metrics.sessions)}</div>
            <div className="text-xs text-neutral-500">
              {formatNumber(data.metrics.pageviews)} views
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <TrendingUp className="w-4 h-4" />
              Bounce Rate
            </div>
            <div className="text-2xl font-semibold">{formatPercent(data.metrics.bounceRate)}</div>
            <div className="text-xs text-neutral-500">
              {data.metrics.bounceRate < 0.5 ? 'Good' : 'Needs work'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Clock className="w-4 h-4" />
              Avg Duration
            </div>
            <div className="text-2xl font-semibold">
              {formatDuration(data.metrics.avgSessionDuration)}
            </div>
            <div className="text-xs text-neutral-500">per session</div>
          </div>
        </div>

        {/* Trend Chart */}
        {data.dailyMetrics && data.dailyMetrics.length > 0 && (
          <GA4TrendChart
            data={data.dailyMetrics}
            title="Traffic Trends"
            description={
              showComparison && previousPeriodData && previousPeriodData.length > 0
                ? `Current: ${formatDateRange(data.dateRange.startDate)} to ${formatDateRange(data.dateRange.endDate)} (${data.dailyMetrics.length} days) • Previous: ${formatDateRange(previousPeriodData[0].date)} to ${formatDateRange(previousPeriodData[previousPeriodData.length - 1].date)} (${previousPeriodData.length} days)`
                : `${formatDateRange(data.dateRange.startDate)} to ${formatDateRange(data.dateRange.endDate)} • ${data.dailyMetrics.length} ${data.dailyMetrics.length === 1 ? 'day' : 'days'} of data`
            }
            showComparison={showComparison}
            previousPeriodData={previousPeriodData || undefined}
          />
        )}

        {/* Top Pages */}
        {data.topPages && data.topPages.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3">Top Pages</h4>
            <div className="space-y-2">
              {data.topPages.slice(0, 5).map((page, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {page.pageTitle || page.pagePath}
                    </div>
                    <div className="text-xs text-neutral-500 truncate">{page.pagePath}</div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatNumber(page.screenPageViews)}
                      </div>
                      <div className="text-xs text-neutral-500">views</div>
                    </div>
                    <Badge variant={page.bounceRate < 0.5 ? 'default' : 'secondary'}>
                      {formatPercent(page.bounceRate)} bounce
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Sources */}
        {data.topSources && data.topSources.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3">Top Traffic Sources</h4>
            <div className="space-y-2">
              {data.topSources.slice(0, 5).map((source, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {source.source} / {source.medium}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatNumber(source.users)}</div>
                      <div className="text-xs text-neutral-500">users</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatNumber(source.sessions)}</div>
                      <div className="text-xs text-neutral-500">sessions</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
