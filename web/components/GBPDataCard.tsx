/**
 * Google Business Profile Data Display Component
 *
 * Shows GBP metrics: views, actions, calls, direction requests
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Eye, MousePointer, Phone, Navigation, RefreshCw, ExternalLink } from 'lucide-react'

interface GBPLocation {
  location_id: string
  location_name: string
  views: {
    total: number
    search_views: number
    maps_views: number
  }
  actions: {
    total: number
    website_clicks: number
    phone_calls: number
    direction_requests: number
  }
}

interface GBPData {
  locations: GBPLocation[]
  aggregated: {
    total_views: number
    total_actions: number
    total_calls: number
    total_directions: number
    total_website_clicks: number
  }
  date_range: {
    start_date: string
    end_date: string
  }
}

interface GBPDataCardProps {
  clientId: string
  initialData?: GBPData | null
  locationCount?: number
}

type TimePeriod = '7days' | '30days' | '90days'

const TIME_PERIODS: Record<TimePeriod, { label: string; days: number }> = {
  '7days': { label: '7 Days', days: 7 },
  '30days': { label: '30 Days', days: 30 },
  '90days': { label: '90 Days', days: 90 },
}

export function GBPDataCard({ clientId, initialData, locationCount = 0 }: GBPDataCardProps) {
  const [data, setData] = useState<GBPData | null>(initialData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days')

  const fetchGBPData = async (period?: TimePeriod) => {
    setLoading(true)
    setError(null)

    const periodToUse = period || selectedPeriod
    const daysAgo = TIME_PERIODS[periodToUse].days

    // Calculate dates
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    try {
      const response = await fetch('/api/analytics/gbp/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch GBP data')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching GBP data:', err)
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
    } catch (error) {
      return dateStr
    }
  }

  const handlePeriodChange = async (period: TimePeriod) => {
    setSelectedPeriod(period)
    await fetchGBPData(period)
  }

  if (locationCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Google Business Profile
          </CardTitle>
          <CardDescription>No locations found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
            <p className="text-neutral-600 mb-2 font-medium">No GBP locations connected</p>
            <p className="text-sm text-neutral-500 mb-6">
              Click "Google Services" in the Connections section below to connect your account
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Google Business Profile
          </CardTitle>
          <CardDescription>{locationCount} {locationCount === 1 ? 'location' : 'locations'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-neutral-600 mb-4">
              {error.includes('permission') &&
                'You may need to grant Business Profile Performance API access.'}
            </p>
            <Button onClick={() => fetchGBPData()} variant="outline">
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
            <MapPin className="w-5 h-5" />
            Google Business Profile
          </CardTitle>
          <CardDescription>
            {locationCount} {locationCount === 1 ? 'location' : 'locations'} connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-neutral-600 mb-4">Click to fetch Business Profile insights</p>
            <Button onClick={() => fetchGBPData()} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Fetch GBP Insights
                </>
              )}
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
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Google Business Profile
            </CardTitle>
            <CardDescription>
              {data.locations.length} {data.locations.length === 1 ? 'location' : 'locations'}
              <span className="ml-2">
                {formatDate(data.date_range.start_date)} to {formatDate(data.date_range.end_date)}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
            <Button onClick={() => fetchGBPData()} disabled={loading} variant="outline" size="sm">
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
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Eye className="w-4 h-4" />
              Profile Views
            </div>
            <div className="text-2xl font-semibold">{formatNumber(data.aggregated.total_views)}</div>
            <div className="text-xs text-neutral-500">
              total impressions
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <MousePointer className="w-4 h-4" />
              Actions
            </div>
            <div className="text-2xl font-semibold">{formatNumber(data.aggregated.total_actions)}</div>
            <div className="text-xs text-neutral-500">
              total interactions
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Phone className="w-4 h-4" />
              Phone Calls
            </div>
            <div className="text-2xl font-semibold">{formatNumber(data.aggregated.total_calls)}</div>
            <div className="text-xs text-neutral-500">
              {data.aggregated.total_actions > 0
                ? `${Math.round((data.aggregated.total_calls / data.aggregated.total_actions) * 100)}% of actions`
                : 'N/A'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Navigation className="w-4 h-4" />
              Directions
            </div>
            <div className="text-2xl font-semibold">
              {formatNumber(data.aggregated.total_directions)}
            </div>
            <div className="text-xs text-neutral-500">
              {data.aggregated.total_actions > 0
                ? `${Math.round((data.aggregated.total_directions / data.aggregated.total_actions) * 100)}% of actions`
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Individual Locations */}
        {data.locations.length > 1 && (
          <div>
            <h4 className="font-medium text-sm mb-3">Performance by Location</h4>
            <div className="space-y-2">
              {data.locations.map((location, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{location.location_name}</div>
                    <div className="text-xs text-neutral-500">
                      Location ID: {location.location_id}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatNumber(location.views.total)}</div>
                      <div className="text-xs text-neutral-500">views</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatNumber(location.actions.total)}</div>
                      <div className="text-xs text-neutral-500">actions</div>
                    </div>
                    <Badge variant="secondary">
                      {location.actions.phone_calls} calls
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Breakdown */}
        <div>
          <h4 className="font-medium text-sm mb-3">Action Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Website Clicks</span>
                </div>
                <span className="text-lg font-semibold text-blue-900">
                  {formatNumber(data.aggregated.total_website_clicks)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Phone Calls</span>
                </div>
                <span className="text-lg font-semibold text-green-900">
                  {formatNumber(data.aggregated.total_calls)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Directions</span>
                </div>
                <span className="text-lg font-semibold text-purple-900">
                  {formatNumber(data.aggregated.total_directions)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
