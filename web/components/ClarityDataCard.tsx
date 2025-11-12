/**
 * Microsoft Clarity Data Display Component
 *
 * Shows user behavior analytics from Microsoft Clarity
 * CRITICAL: Respects 10 requests/day rate limit!
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Eye,
  Users,
  Clock,
  MousePointer,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Monitor,
  Globe as GlobeIcon,
  AlertCircle,
} from 'lucide-react'

interface PopularPage {
  url: string
  views: number
}

interface DeviceBreakdown {
  device: string
  sessions: number
}

interface BrowserBreakdown {
  browser: string
  sessions: number
}

interface CountryBreakdown {
  country: string
  sessions: number
}

interface ClarityData {
  sessions: number
  pageviews: number
  avg_session_duration: number
  bounce_rate: number
  rage_clicks: number
  dead_clicks: number
  js_errors: number
  popular_pages: PopularPage[]
  device_breakdown: DeviceBreakdown[]
  browser_breakdown: BrowserBreakdown[]
  country_breakdown: CountryBreakdown[]
}

interface ClarityMeta {
  numOfDays: number
  requestsUsed: number
  requestsRemaining: number
  warning?: string
}

interface ClarityDataCardProps {
  clientId: string
  initialData?: ClarityData | null
  initialMeta?: ClarityMeta | null
  projectId?: string
}

export function ClarityDataCard({
  clientId,
  initialData,
  initialMeta,
  projectId
}: ClarityDataCardProps) {
  const [data, setData] = useState<ClarityData | null>(initialData || null)
  const [meta, setMeta] = useState<ClarityMeta | null>(initialMeta || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [numOfDays, setNumOfDays] = useState<1 | 2 | 3>(3)

  const fetchClarityData = async (days?: 1 | 2 | 3) => {
    setLoading(true)
    setError(null)

    const daysToUse = days || numOfDays

    try {
      const response = await fetch('/api/analytics/clarity/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          numOfDays: daysToUse,
        }),
      })

      if (response.status === 429) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Daily rate limit exceeded')
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch Clarity data')
      }

      const result = await response.json()
      setData(result.data)
      setMeta(result.meta)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching Clarity data:', err)
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

  const getRateLimitColor = (remaining: number) => {
    if (remaining <= 2) return 'bg-red-50 border-red-200'
    if (remaining <= 5) return 'bg-amber-50 border-amber-200'
    return 'bg-neutral-50 border-neutral-200'
  }

  const getRateLimitBarColor = (remaining: number) => {
    if (remaining <= 2) return 'bg-red-600'
    if (remaining <= 5) return 'bg-amber-600'
    return 'bg-blue-600'
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Microsoft Clarity</CardTitle>
              <CardDescription>User behavior analytics</CardDescription>
            </div>
            <Eye className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-600 mb-2">⚠️ Error loading Clarity data</div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            {meta && meta.requestsRemaining > 0 && (
              <Button onClick={() => fetchClarityData()} disabled={loading}>
                Try Again
              </Button>
            )}
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
              <CardTitle>Microsoft Clarity</CardTitle>
              <CardDescription>User behavior analytics</CardDescription>
            </div>
            <Eye className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Rate Limit Warning */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <div className="text-xs text-amber-800">
                <strong>Rate Limit:</strong> Only 10 requests per day. Use carefully!
              </div>
            </div>

            {/* Data Range Selection */}
            <div>
              <p className="text-sm font-medium mb-2">Select Data Range</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((days) => (
                  <Button
                    key={days}
                    variant={numOfDays === days ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNumOfDays(days as 1 | 2 | 3)}
                  >
                    {days} Day{days > 1 ? 's' : ''}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <p className="text-sm text-muted-foreground mb-4">No data available yet</p>
              <Button onClick={() => fetchClarityData()} disabled={loading}>
                Load Clarity Data
              </Button>
            </div>
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
            <CardTitle>Microsoft Clarity</CardTitle>
            <CardDescription>
              {projectId && <span className="block">Project: {projectId}</span>}
              <span className="text-xs">Last {meta?.numOfDays || 3} day(s)</span>
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClarityData()}
            disabled={loading || (meta?.requestsRemaining === 0)}
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
            {/* Rate Limit Display */}
            {meta && (
              <div className={`p-3 rounded-md border ${getRateLimitColor(meta.requestsRemaining)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Daily API Usage</span>
                  <span className={`text-xs font-semibold ${
                    meta.requestsRemaining <= 2 ? 'text-red-700' :
                    meta.requestsRemaining <= 5 ? 'text-amber-700' : 'text-neutral-700'
                  }`}>
                    {meta.requestsUsed} / 10 requests
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getRateLimitBarColor(meta.requestsRemaining)}`}
                    style={{ width: `${(meta.requestsUsed / 10) * 100}%` }}
                  />
                </div>
                {meta.warning && (
                  <p className="text-xs text-amber-700 mt-2">
                    ⚠️ {meta.warning}
                  </p>
                )}
                {meta.requestsRemaining === 0 && (
                  <p className="text-xs text-red-700 mt-2">
                    🚫 No requests remaining today. Resets at midnight UTC.
                  </p>
                )}
              </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sessions */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-blue-100">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Sessions</div>
                </div>
                <div className="text-2xl font-bold">{formatNumber(data.sessions)}</div>
              </div>

              {/* Pageviews */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-purple-100">
                    <Eye className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Pageviews</div>
                </div>
                <div className="text-2xl font-bold">{formatNumber(data.pageviews)}</div>
              </div>

              {/* Avg Session Duration */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-green-100">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Avg Duration</div>
                </div>
                <div className="text-2xl font-bold">{formatDuration(data.avg_session_duration)}</div>
              </div>

              {/* Bounce Rate */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-md bg-amber-100">
                    <XCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">Bounce Rate</div>
                </div>
                <div className="text-2xl font-bold">{(data.bounce_rate * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* User Experience Issues */}
            <div>
              <h4 className="text-sm font-semibold mb-3">User Experience Issues</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Rage Clicks */}
                <div className="p-3 rounded-md border border-red-200 bg-red-50">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointer className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-red-900">Rage Clicks</span>
                  </div>
                  <div className="text-xl font-bold text-red-700">{formatNumber(data.rage_clicks)}</div>
                  <p className="text-xs text-red-600 mt-1">Frustrated users</p>
                </div>

                {/* Dead Clicks */}
                <div className="p-3 rounded-md border border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-900">Dead Clicks</span>
                  </div>
                  <div className="text-xl font-bold text-amber-700">{formatNumber(data.dead_clicks)}</div>
                  <p className="text-xs text-amber-600 mt-1">Unresponsive elements</p>
                </div>

                {/* JS Errors */}
                <div className="p-3 rounded-md border border-purple-200 bg-purple-50">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-900">JS Errors</span>
                  </div>
                  <div className="text-xl font-bold text-purple-700">{formatNumber(data.js_errors)}</div>
                  <p className="text-xs text-purple-600 mt-1">Technical issues</p>
                </div>
              </div>
            </div>

            {/* Popular Pages */}
            {data.popular_pages && data.popular_pages.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Popular Pages</h4>
                <div className="space-y-2">
                  {data.popular_pages.slice(0, 5).map((page, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-md border border-neutral-200 bg-white"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium text-sm truncate">{page.url}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-blue-600">{formatNumber(page.views)}</div>
                        <div className="text-xs text-muted-foreground">views</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device & Browser Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Devices */}
              {data.device_breakdown && data.device_breakdown.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Devices</h4>
                  <div className="space-y-2">
                    {data.device_breakdown.map((device, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-md border border-neutral-100 bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{device.device}</span>
                        </div>
                        <span className="text-sm text-blue-600 font-medium">
                          {formatNumber(device.sessions)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Browsers */}
              {data.browser_breakdown && data.browser_breakdown.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Browsers</h4>
                  <div className="space-y-2">
                    {data.browser_breakdown.slice(0, 5).map((browser, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-md border border-neutral-100 bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <GlobeIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{browser.browser}</span>
                        </div>
                        <span className="text-sm text-purple-600 font-medium">
                          {formatNumber(browser.sessions)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
