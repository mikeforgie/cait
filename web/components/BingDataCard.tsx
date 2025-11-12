/**
 * Bing Webmaster Tools Data Display Component
 *
 * Shows Bing search analytics for a client
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, MousePointer, Eye, TrendingUp, Search, RefreshCw } from 'lucide-react'

interface TopQuery {
  query: string
  clicks: number
  impressions: number
  ctr: string
  position: string
}

interface TrafficTrend {
  date: string
  clicks: number
  impressions: number
  ctr: string
}

interface BingData {
  aggregated: {
    total_clicks: number
    total_impressions: number
    avg_ctr: number
    avg_position: number
  }
  top_queries: TopQuery[]
  traffic_trends: TrafficTrend[]
  date_range: {
    start_date: string | null
    end_date: string | null
  }
}

interface BingDataCardProps {
  clientId: string
  initialData?: BingData | null
  siteUrl?: string
}

export function BingDataCard({ clientId, initialData, siteUrl }: BingDataCardProps) {
  const [data, setData] = useState<BingData | null>(initialData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBingData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/bing/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch Bing data')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching Bing data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bing Webmaster Tools</CardTitle>
              <CardDescription>Search performance on Bing</CardDescription>
            </div>
            <Globe className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-600 mb-2">⚠️ Error loading Bing data</div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchBingData} disabled={loading}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data && !loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bing Webmaster Tools</CardTitle>
              <CardDescription>Search performance on Bing</CardDescription>
            </div>
            <Globe className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground mb-4">No data available yet</p>
            <Button onClick={fetchBingData} disabled={loading}>
              Load Bing Data
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bing Webmaster Tools</CardTitle>
            <CardDescription>
              {siteUrl && <span className="block">{siteUrl}</span>}
              {data?.date_range.start_date && data?.date_range.end_date && (
                <span className="text-xs">
                  {formatDate(data.date_range.start_date)} - {formatDate(data.date_range.end_date)}
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBingData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Clicks */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-blue-100">
                    <MousePointer className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Total Clicks</div>
                </div>
                <div className="text-2xl font-bold">{formatNumber(data.aggregated.total_clicks)}</div>
              </div>

              {/* Total Impressions */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-purple-100">
                    <Eye className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Impressions</div>
                </div>
                <div className="text-2xl font-bold">{formatNumber(data.aggregated.total_impressions)}</div>
              </div>

              {/* Average CTR */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-green-100">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Avg CTR</div>
                </div>
                <div className="text-2xl font-bold">{data.aggregated.avg_ctr.toFixed(2)}%</div>
              </div>

              {/* Average Position */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-amber-100">
                    <Search className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Avg Position</div>
                </div>
                <div className="text-2xl font-bold">{data.aggregated.avg_position.toFixed(1)}</div>
              </div>
            </div>

            {/* Top Queries */}
            {data.top_queries && data.top_queries.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Top Queries</h4>
                <div className="space-y-2">
                  {data.top_queries.slice(0, 10).map((query, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium text-sm truncate">{query.query}</p>
                        <p className="text-xs text-muted-foreground">
                          Position: {query.position}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <div className="font-medium text-blue-600">{formatNumber(query.clicks)}</div>
                          <div className="text-muted-foreground">clicks</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-purple-600">{formatNumber(query.impressions)}</div>
                          <div className="text-muted-foreground">impressions</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">{query.ctr}%</div>
                          <div className="text-muted-foreground">CTR</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Traffic Trends (Last 30 Days) */}
            {data.traffic_trends && data.traffic_trends.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Traffic Trends (Last 30 Days)</h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {data.traffic_trends.map((trend, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md border border-neutral-100 bg-white text-xs"
                    >
                      <div className="font-medium text-muted-foreground w-20">
                        {formatDate(trend.date)}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-medium text-blue-600">{formatNumber(trend.clicks)}</span>
                          <span className="text-muted-foreground ml-1">clicks</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-purple-600">{formatNumber(trend.impressions)}</span>
                          <span className="text-muted-foreground ml-1">impr.</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-green-600">{trend.ctr}%</span>
                          <span className="text-muted-foreground ml-1">CTR</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
