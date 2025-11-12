/**
 * Google Connect Button Component
 *
 * Shows "Connect Google" button or connection status
 * Handles OAuth flow and displays discovered properties
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

interface GoogleConnectButtonProps {
  clientId: string
  isConnected?: boolean
  connectedAt?: string
  ga4Properties?: Array<{
    property_id: string
    display_name: string
    account_id: string
  }>
  gscSites?: Array<{
    site_url: string
    permission_level: string
  }>
  gbpLocations?: Array<{
    location_id: string
    title: string
    address: string
    phone: string
    website: string
  }>
  // Saved selections from database
  selectedGA4PropertyId?: string
  selectedGSCSiteUrl?: string
  selectedGBPLocationId?: string
}

export function GoogleConnectButton({
  clientId,
  isConnected = false,
  connectedAt,
  ga4Properties = [],
  gscSites = [],
  gbpLocations = [],
  selectedGA4PropertyId,
  selectedGSCSiteUrl,
  selectedGBPLocationId,
}: GoogleConnectButtonProps) {
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Selection state - use saved values if available, otherwise default to first item
  const [selectedGA4, setSelectedGA4] = useState<string>(
    selectedGA4PropertyId || ga4Properties?.[0]?.property_id || ''
  )
  const [selectedGSC, setSelectedGSC] = useState<string>(
    selectedGSCSiteUrl || gscSites?.[0]?.site_url || ''
  )
  const [selectedGBP, setSelectedGBP] = useState<string>(
    selectedGBPLocationId || gbpLocations?.[0]?.location_id || ''
  )

  // Collapse/expand state - smart default:
  // Stay expanded if there are available properties not yet selected
  const hasUnselectedGBP = gbpLocations.length > 0 && !selectedGBP
  const hasUnselectedGA4 = ga4Properties.length > 0 && !selectedGA4
  const hasUnselectedGSC = gscSites.length > 0 && !selectedGSC
  const shouldAutoExpand = hasUnselectedGBP || hasUnselectedGA4 || hasUnselectedGSC
  const [isExpanded, setIsExpanded] = useState<boolean>(shouldAutoExpand)

  // Handle success/error from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')

    if (success === 'google_connected') {
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname)
      // Reload page to show new data
      window.location.reload()
    }

    if (error) {
      alert(`Connection failed: ${error}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleConnect = () => {
    setLoading(true)
    // Redirect to OAuth authorization
    window.location.href = `/api/auth/google/authorize?clientId=${clientId}`
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google account? You will need to reconnect to access Analytics and Search Console data.')) {
      return
    }

    setDisconnecting(true)

    try {
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      if (!response.ok) {
        throw new Error('Disconnect failed')
      }

      window.location.reload()
    } catch (error) {
      alert('Failed to disconnect. Please try again.')
      setDisconnecting(false)
    }
  }

  const handleSaveSelection = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/auth/google/select-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          selectedGA4,
          selectedGSC,
          selectedGBP,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save selection')
      }

      alert('Properties selected successfully!')
      window.location.reload()
    } catch (error) {
      alert('Failed to save selection. Please try again.')
      setSaving(false)
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Connect Google
          </CardTitle>
          <CardDescription>
            Connect Google Analytics and Search Console to enable automated reporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">This will allow CAIT to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Read Google Analytics 4 data</li>
                <li>Read Search Console performance</li>
                <li>Access Google Business Profile locations</li>
                <li>Generate automated monthly reports</li>
                <li>Track keyword rankings</li>
              </ul>
            </div>

            <Button
              onClick={handleConnect}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Redirecting...' : 'Connect Google Account'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You'll be redirected to Google to authorize access
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Connected state
  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-neutral-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Google Connected
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-500" />
          )}
        </CardTitle>
        <CardDescription>
          Connected {connectedAt ? new Date(connectedAt).toLocaleDateString() : 'recently'}
        </CardDescription>
      </CardHeader>

      {/* Collapsed Summary View */}
      {!isExpanded && (
        <CardContent>
          <div className="space-y-2 text-sm">
            {selectedGA4 && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-600">GA4:</span>
                <span className="text-neutral-900">
                  {ga4Properties?.find(p => p.property_id === selectedGA4)?.display_name || selectedGA4}
                </span>
              </div>
            )}
            {selectedGSC && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-600">Search Console:</span>
                <span className="text-neutral-900">{selectedGSC}</span>
              </div>
            )}
            {selectedGBP && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-600">Business Profile:</span>
                <span className="text-neutral-900">
                  {gbpLocations?.find(l => l.location_id === selectedGBP)?.title || selectedGBP}
                </span>
              </div>
            )}
            {!selectedGA4 && !selectedGSC && !selectedGBP && (
              <div className="text-neutral-500 italic">No accounts selected yet</div>
            )}
          </div>
        </CardContent>
      )}

      {/* Full Property Selection View */}
      {isExpanded && (
        <CardContent className="space-y-4">
        {/* GA4 Properties */}
        {ga4Properties && ga4Properties.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Select Google Analytics 4 Property</h4>
              {!selectedGA4 && (
                <Badge variant="destructive" className="text-xs">
                  Selection Required
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {ga4Properties.map((prop) => (
                <label
                  key={prop.property_id}
                  className={`flex items-center justify-between p-3 rounded-md border-2 cursor-pointer transition-colors ${
                    selectedGA4 === prop.property_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="ga4Property"
                      value={prop.property_id}
                      checked={selectedGA4 === prop.property_id}
                      onChange={(e) => setSelectedGA4(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-sm">{prop.display_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Property ID: {prop.property_id}
                      </div>
                    </div>
                  </div>
                  {selectedGA4 === prop.property_id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* GSC Sites */}
        {gscSites && gscSites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Select Search Console Site</h4>
              {!selectedGSC && (
                <Badge variant="destructive" className="text-xs">
                  Selection Required
                </Badge>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gscSites.map((site) => (
                <label
                  key={site.site_url}
                  className={`flex items-center justify-between p-3 rounded-md border-2 cursor-pointer transition-colors ${
                    selectedGSC === site.site_url
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="gscSite"
                      value={site.site_url}
                      checked={selectedGSC === site.site_url}
                      onChange={(e) => setSelectedGSC(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-sm">{site.site_url}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {site.permission_level}
                      </div>
                    </div>
                  </div>
                  {selectedGSC === site.site_url && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* GBP Locations */}
        {gbpLocations && gbpLocations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Select Google Business Profile Location</h4>
              {!selectedGBP && (
                <Badge variant="destructive" className="text-xs">
                  Selection Required
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {gbpLocations.map((location) => (
                <label
                  key={location.location_id}
                  className={`flex items-center justify-between p-3 rounded-md border-2 cursor-pointer transition-colors ${
                    selectedGBP === location.location_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="gbpLocation"
                      value={location.location_id}
                      checked={selectedGBP === location.location_id}
                      onChange={(e) => setSelectedGBP(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-sm">{location.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {location.address}
                      </div>
                      {location.phone && (
                        <div className="text-xs text-muted-foreground">
                          {location.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedGBP === location.location_id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* No properties found */}
        {(!ga4Properties || ga4Properties.length === 0) &&
          (!gscSites || gscSites.length === 0) &&
          (!gbpLocations || gbpLocations.length === 0) && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                No properties found. Try disconnecting and reconnecting to refresh.
              </div>
            </div>
          )}

        {/* Save Selection Button */}
        {((ga4Properties && ga4Properties.length > 0) ||
          (gscSites && gscSites.length > 0) ||
          (gbpLocations && gbpLocations.length > 0)) && (
          <Button
            onClick={handleSaveSelection}
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? 'Saving...' : 'Save Selected Properties'}
          </Button>
        )}

        {/* Disconnect button */}
        <Button
          variant="outline"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="w-full"
          size="sm"
        >
          {disconnecting ? 'Disconnecting...' : 'Disconnect & Reconnect'}
        </Button>
        </CardContent>
      )}
    </Card>
  )
}
