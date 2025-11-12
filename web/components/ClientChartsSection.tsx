/**
 * Client Charts Section Component
 *
 * Displays performance charts for a client (traffic, keywords, backlinks)
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, KeywordRankingsChart, BacklinkGrowthChart, GaugeChart } from '@/components/charts'
import type { KeywordInfo, BacklinkDataPoint } from '@/components/charts'
import { CHART_COLORS } from '@/lib/charts'
import { format } from 'date-fns'
import { TrendingUp, BarChart as BarChartIcon, Activity } from 'lucide-react'

interface ClientChartsSectionProps {
  clientId: string
  trafficData?: Array<{
    date: string
    users: number
    sessions: number
    pageviews: number
  }>
  keywordRankingData?: Array<{
    date: string
    [keyword: string]: string | number
  }>
  keywordInfo?: KeywordInfo[]
  backlinkData?: BacklinkDataPoint[]
  seoScore?: {
    current: number
    previous?: number
  }
}

export function ClientChartsSection({
  clientId,
  trafficData,
  keywordRankingData,
  keywordInfo,
  backlinkData,
  seoScore,
}: ClientChartsSectionProps) {
  const [trafficPeriod, setTrafficPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  // Format date for charts
  const formatDate = (dateStr: string) => {
    try {
      // Handle YYYYMMDD format from GA4
      if (dateStr.length === 8) {
        const year = dateStr.substring(0, 4)
        const month = dateStr.substring(4, 6)
        const day = dateStr.substring(6, 8)
        return format(new Date(`${year}-${month}-${day}`), 'MMM d')
      }
      return format(new Date(dateStr), 'MMM d')
    } catch {
      return dateStr
    }
  }

  // Filter traffic data based on period
  const filteredTrafficData = trafficData?.slice(
    trafficPeriod === '7d' ? -7 : trafficPeriod === '30d' ? -30 : -90
  )

  const hasAnyData = trafficData || keywordRankingData || backlinkData || seoScore

  if (!hasAnyData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Performance Trends Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Performance Trends
          </h2>
          <p className="text-neutral-600 mt-1">
            Track your SEO metrics over time
          </p>
        </div>
      </div>

      {/* Traffic Trend Chart */}
      {filteredTrafficData && filteredTrafficData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Traffic Trends
                </CardTitle>
                <CardDescription>Website traffic over time from Google Analytics</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={trafficPeriod === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTrafficPeriod('7d')}
                >
                  7 days
                </Button>
                <Button
                  variant={trafficPeriod === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTrafficPeriod('30d')}
                >
                  30 days
                </Button>
                <Button
                  variant={trafficPeriod === '90d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTrafficPeriod('90d')}
                >
                  90 days
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-sm text-neutral-600 mb-1">Total Users</div>
                <div className="text-2xl font-semibold text-blue-600">
                  {filteredTrafficData.reduce((sum, day) => sum + day.users, 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="text-sm text-neutral-600 mb-1">Total Sessions</div>
                <div className="text-2xl font-semibold text-green-600">
                  {filteredTrafficData.reduce((sum, day) => sum + day.sessions, 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="text-sm text-neutral-600 mb-1">Total Pageviews</div>
                <div className="text-2xl font-semibold text-purple-600">
                  {filteredTrafficData.reduce((sum, day) => sum + day.pageviews, 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Chart */}
            <LineChart
              data={filteredTrafficData}
              lines={[
                { dataKey: 'users', name: 'Users', color: CHART_COLORS.primary },
                { dataKey: 'sessions', name: 'Sessions', color: CHART_COLORS.success },
                { dataKey: 'pageviews', name: 'Pageviews', color: CHART_COLORS.purple },
              ]}
              xAxisKey="date"
              height={350}
              formatXAxis={formatDate}
              formatTooltip={(value, name) => [value.toLocaleString(), name]}
            />
          </CardContent>
        </Card>
      )}

      {/* Keyword Rankings Chart */}
      {keywordRankingData && keywordInfo && keywordInfo.length > 0 && (
        <KeywordRankingsChart
          data={keywordRankingData}
          keywords={keywordInfo}
          height={400}
          title="Keyword Rankings"
        />
      )}

      {/* Backlink Growth Chart */}
      {backlinkData && backlinkData.length > 0 && (
        <BacklinkGrowthChart
          data={backlinkData}
          height={400}
          showDomainAuthority={true}
          title="Backlink Growth"
        />
      )}

      {/* SEO Score Gauge */}
      {seoScore && (
        <Card>
          <CardHeader>
            <CardTitle>Overall SEO Score</CardTitle>
            <CardDescription>Current health of your website's SEO</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <GaugeChart
              value={seoScore.current}
              previousValue={seoScore.previous}
              label="SEO Score"
              size={240}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
