/**
 * Connections Overview Card
 *
 * Central hub for managing all API integrations
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BarChart3,
  Search,
  MapPin,
  Globe,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react'

interface ConnectionsCardProps {
  clientId: string
  googleConnected?: boolean
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
  selectedGA4PropertyId?: string
  selectedGSCSiteUrl?: string
  selectedGBPLocationId?: string
  bingConnected?: boolean
  bingConnectedAt?: string
  bingSiteUrl?: string
  clarityConnected?: boolean
  clarityConnectedAt?: string
  clarityProjectId?: string
  clarityDailyRequests?: number
  clarityLastRequestDate?: string
}

export function ConnectionsCard({
  clientId,
  googleConnected = false,
  connectedAt,
  ga4Properties = [],
  gscSites = [],
  gbpLocations = [],
  selectedGA4PropertyId,
  selectedGSCSiteUrl,
  selectedGBPLocationId,
  bingConnected = false,
  bingConnectedAt,
  bingSiteUrl,
  clarityConnected = false,
  clarityConnectedAt,
  clarityProjectId,
  clarityDailyRequests = 0,
  clarityLastRequestDate,
}: ConnectionsCardProps) {
  const [expandedConnection, setExpandedConnection] = useState<string | null>(null)
  const [expandedGoogleService, setExpandedGoogleService] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Bing form state
  const [bingApiKey, setBingApiKey] = useState('')
  const [bingSiteUrlInput, setBingSiteUrlInput] = useState('')
  const [savingBing, setSavingBing] = useState(false)
  const [disconnectingBing, setDisconnectingBing] = useState(false)

  // Clarity form state
  const [clarityApiToken, setClarityApiToken] = useState('')
  const [clarityProjectIdInput, setClarityProjectIdInput] = useState('')
  const [savingClarity, setSavingClarity] = useState(false)
  const [disconnectingClarity, setDisconnectingClarity] = useState(false)

  // Selection state
  const [selectedGA4, setSelectedGA4] = useState<string>(
    selectedGA4PropertyId || ga4Properties?.[0]?.property_id || ''
  )
  const [selectedGSC, setSelectedGSC] = useState<string>(
    selectedGSCSiteUrl || gscSites?.[0]?.site_url || ''
  )
  const [selectedGBP, setSelectedGBP] = useState<string>(
    selectedGBPLocationId || gbpLocations?.[0]?.location_id || ''
  )

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')

    if (success === 'google_connected') {
      window.history.replaceState({}, '', window.location.pathname)
      window.location.reload()
    }

    if (error) {
      alert(`Connection failed: ${error}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleConnect = () => {
    setLoading(true)
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

  const handleBingConnect = async () => {
    if (!bingApiKey || !bingSiteUrlInput) {
      alert('Please enter both API Key and Site URL')
      return
    }

    setSavingBing(true)

    try {
      const response = await fetch('/api/auth/bing/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          apiKey: bingApiKey,
          siteUrl: bingSiteUrlInput,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Bing')
      }

      alert('Bing Webmaster Tools connected successfully!')
      window.location.reload()
    } catch (error: any) {
      alert(error.message || 'Failed to connect Bing. Please try again.')
      setSavingBing(false)
    }
  }

  const handleBingDisconnect = async () => {
    if (!confirm('Disconnect Bing Webmaster Tools? You will need to reconnect to access Bing data.')) {
      return
    }

    setDisconnectingBing(true)

    try {
      const response = await fetch('/api/auth/bing/disconnect', {
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
      setDisconnectingBing(false)
    }
  }

  const handleClarityConnect = async () => {
    if (!clarityApiToken) {
      alert('Please enter API Token')
      return
    }

    setSavingClarity(true)

    try {
      const response = await fetch('/api/auth/clarity/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          apiToken: clarityApiToken,
          projectId: clarityProjectIdInput || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Clarity')
      }

      alert(data.message + '\n\n' + data.warning)
      window.location.reload()
    } catch (error: any) {
      alert(error.message || 'Failed to connect Clarity. Please try again.')
      setSavingClarity(false)
    }
  }

  const handleClarityDisconnect = async () => {
    if (!confirm('Disconnect Microsoft Clarity? You will need to reconnect to access Clarity data.')) {
      return
    }

    setDisconnectingClarity(true)

    try {
      const response = await fetch('/api/auth/clarity/disconnect', {
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
      setDisconnectingClarity(false)
    }
  }

  const toggleConnection = (connectionId: string) => {
    setExpandedConnection(expandedConnection === connectionId ? null : connectionId)
  }

  // Connection definitions
  const connections = [
    {
      id: 'google',
      name: 'Google Services',
      description: 'Analytics, Search Console, Business Profile',
      icon: BarChart3,
      status: googleConnected ? 'connected' : 'not_connected',
      hasData: ga4Properties.length > 0 || gscSites.length > 0 || gbpLocations.length > 0,
      connectedCount: [
        selectedGA4PropertyId && 'GA4',
        selectedGSCSiteUrl && 'GSC',
        selectedGBPLocationId && 'GBP',
      ].filter(Boolean).length,
      totalCount: 3,
    },
    {
      id: 'bing',
      name: 'Bing Webmaster Tools',
      description: 'Bing search analytics and site health',
      icon: Globe,
      status: bingConnected ? 'connected' : 'not_connected',
      siteUrl: bingSiteUrl,
    },
    {
      id: 'clarity',
      name: 'Microsoft Clarity',
      description: 'User behavior analytics and heatmaps',
      icon: Eye,
      status: clarityConnected ? 'connected' : 'not_connected',
      projectId: clarityProjectId,
      requestsUsed: clarityDailyRequests,
      requestsRemaining: 10 - clarityDailyRequests,
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      description: 'Content publishing and management',
      icon: FileText,
      status: 'coming_soon',
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'not_connected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'coming_soon':
        return <Clock className="w-4 h-4 text-amber-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-600">
            Connected
          </Badge>
        )
      case 'not_connected':
        return <Badge variant="destructive">Not Connected</Badge>
      case 'coming_soon':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Coming Soon
          </Badge>
        )
    }
  }

  const connectedCount = connections.filter((c) => c.status === 'connected').length
  const totalAvailable = connections.filter((c) => c.status !== 'coming_soon').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Connections</CardTitle>
            <CardDescription>
              {connectedCount} of {totalAvailable} integrations connected
            </CardDescription>
          </div>
          {connectedCount < totalAvailable && (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {connections.map((connection) => {
            const Icon = connection.icon
            const isExpanded = expandedConnection === connection.id

            return (
              <div
                key={connection.id}
                className="rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden"
              >
                {/* Connection Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={() => connection.status !== 'coming_soon' && toggleConnection(connection.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-neutral-200">
                      <Icon className="w-5 h-5 text-neutral-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{connection.name}</h4>
                        {getStatusIcon(connection.status)}
                      </div>
                      <p className="text-xs text-neutral-600">{connection.description}</p>
                      {connection.connectedCount !== undefined && connection.status === 'connected' && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {connection.connectedCount} of {connection.totalCount} services configured
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {getStatusBadge(connection.status)}
                    {connection.status !== 'coming_soon' && (
                      isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-neutral-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-500" />
                      )
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && connection.id === 'google' && (
                  <div className="border-t border-neutral-200 bg-white p-4 space-y-4">
                    {!googleConnected ? (
                      /* Not Connected - Show Connect Button */
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          <p className="mb-2">Connecting Google will allow CAIT to:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Read Google Analytics 4 data</li>
                            <li>Read Search Console performance</li>
                            <li>Access Google Business Profile locations</li>
                            <li>Generate automated monthly reports</li>
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
                    ) : (
                      /* Connected - Show Service List */
                      <div className="space-y-4">
                        {/* Service List */}
                        <div className="space-y-2">{[
                          {
                            id: 'analytics',
                            name: 'Analytics',
                            icon: BarChart3,
                            isSelected: !!selectedGA4,
                            hasProperties: ga4Properties.length > 0,
                            selectedName: ga4Properties.find(p => p.property_id === selectedGA4)?.display_name,
                          },
                          {
                            id: 'search-console',
                            name: 'Search Console',
                            icon: Search,
                            isSelected: !!selectedGSC,
                            hasProperties: gscSites.length > 0,
                            selectedName: selectedGSC,
                          },
                          {
                            id: 'business-profile',
                            name: 'Business Profile',
                            icon: MapPin,
                            isSelected: !!selectedGBP,
                            hasProperties: gbpLocations.length > 0,
                            selectedName: gbpLocations.find(l => l.location_id === selectedGBP)?.title,
                          },
                        ].map((service) => {
                          const ServiceIcon = service.icon
                          const isServiceExpanded = expandedGoogleService === service.id

                          return (
                            <div
                              key={service.id}
                              className="rounded-md border border-neutral-200 overflow-hidden"
                            >
                              {/* Service Header */}
                              <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                                onClick={() => setExpandedGoogleService(isServiceExpanded ? null : service.id)}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <ServiceIcon className="w-4 h-4 text-neutral-600" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{service.name}</div>
                                    {service.isSelected && service.selectedName && (
                                      <div className="text-xs text-neutral-500 truncate">
                                        {service.selectedName}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {service.isSelected ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Not Set</Badge>
                                  )}
                                  {isServiceExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-neutral-500" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                                  )}
                                </div>
                              </div>

                              {/* Service Property Selection */}
                              {isServiceExpanded && (
                                <div className="border-t border-neutral-200 bg-neutral-50 p-3">
                                  {service.id === 'analytics' && ga4Properties.length > 0 && (
                                    <div className="space-y-2">{ga4Properties.map((prop) => (
                                        <label
                                          key={prop.property_id}
                                          className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                                            selectedGA4 === prop.property_id
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
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
                                                ID: {prop.property_id}
                                              </div>
                                            </div>
                                          </div>
                                          {selectedGA4 === prop.property_id && (
                                            <Badge variant="default" className="text-xs">Selected</Badge>
                                          )}
                                        </label>
                                      ))}
                                    </div>
                                  )}

                                  {service.id === 'search-console' && gscSites.length > 0 && (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {gscSites.map((site) => (
                                        <label
                                          key={site.site_url}
                                          className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                                            selectedGSC === site.site_url
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
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
                                            <Badge variant="default" className="text-xs">Selected</Badge>
                                          )}
                                        </label>
                                      ))}
                                    </div>
                                  )}

                                  {service.id === 'business-profile' && gbpLocations.length > 0 && (
                                    <div className="space-y-2">
                                      {gbpLocations.map((location) => (
                                        <label
                                          key={location.location_id}
                                          className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                                            selectedGBP === location.location_id
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
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
                                            </div>
                                          </div>
                                          {selectedGBP === location.location_id && (
                                            <Badge variant="default" className="text-xs">Selected</Badge>
                                          )}
                                        </label>
                                      ))}
                                    </div>
                                  )}

                                  {!service.hasProperties && (
                                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                                      <div className="text-xs text-yellow-800">
                                        No {service.name.toLowerCase()} properties found
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        </div>

                        {/* Action Buttons */}
                        <div className="border-t border-neutral-200 pt-3 flex gap-3">
                          <Button
                            onClick={handleSaveSelection}
                            disabled={saving}
                            className="flex-1"
                          >
                            {saving ? 'Saving...' : 'Save Selected Properties'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                          >
                            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </div>

                        {connectedAt && (
                          <p className="text-xs text-muted-foreground text-center">
                            Connected {new Date(connectedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bing Expanded Content */}
                {isExpanded && connection.id === 'bing' && (
                  <div className="border-t border-neutral-200 bg-white p-4 space-y-4">
                    {!bingConnected ? (
                      /* Not Connected - Show Connection Form */
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          <p className="mb-2">Connecting Bing Webmaster Tools will allow CAIT to:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Track search queries and rankings on Bing</li>
                            <li>Monitor clicks and impressions</li>
                            <li>Analyze search performance trends</li>
                            <li>View site health and crawl stats</li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="bing-api-key" className="text-sm font-medium">
                              API Key
                            </Label>
                            <Input
                              id="bing-api-key"
                              type="text"
                              placeholder="Enter your Bing Webmaster Tools API Key"
                              value={bingApiKey}
                              onChange={(e) => setBingApiKey(e.target.value)}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="bing-site-url" className="text-sm font-medium">
                              Site URL
                            </Label>
                            <Input
                              id="bing-site-url"
                              type="url"
                              placeholder="https://example.com"
                              value={bingSiteUrlInput}
                              onChange={(e) => setBingSiteUrlInput(e.target.value)}
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Must be a verified site in your Bing Webmaster Tools account
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <div className="text-xs text-blue-800">
                            <a
                              href="https://www.bing.com/webmasters/about"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline font-medium inline-flex items-center gap-1"
                            >
                              Get your API Key from Bing Webmaster Tools
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        <Button
                          onClick={handleBingConnect}
                          disabled={savingBing}
                          className="w-full"
                          size="lg"
                        >
                          {savingBing ? 'Connecting...' : 'Connect Bing Webmaster Tools'}
                        </Button>
                      </div>
                    ) : (
                      /* Connected - Show Status */
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-900">Connected</p>
                            <p className="text-xs text-green-700">
                              Monitoring: {bingSiteUrl}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-neutral-200 pt-3 flex gap-3">
                          <Button
                            variant="outline"
                            onClick={handleBingDisconnect}
                            disabled={disconnectingBing}
                            className="w-full"
                          >
                            {disconnectingBing ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </div>

                        {bingConnectedAt && (
                          <p className="text-xs text-muted-foreground text-center">
                            Connected {new Date(bingConnectedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Clarity Expanded Content */}
                {isExpanded && connection.id === 'clarity' && (
                  <div className="border-t border-neutral-200 bg-white p-4 space-y-4">
                    {!clarityConnected ? (
                      /* Not Connected - Show Connection Form */
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          <p className="mb-2">Connecting Microsoft Clarity will allow CAIT to:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>View session recordings and heatmaps</li>
                            <li>Track user behavior metrics</li>
                            <li>Identify rage clicks and dead clicks</li>
                            <li>Monitor JavaScript errors</li>
                          </ul>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <div className="text-xs text-amber-800">
                            <strong>Rate Limit:</strong> Clarity API allows only <strong>10 requests per day</strong>. Use sparingly!
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="clarity-token" className="text-sm font-medium">
                              API Token <span className="text-red-600">*</span>
                            </Label>
                            <Input
                              id="clarity-token"
                              type="text"
                              placeholder="Enter your Microsoft Clarity API Token"
                              value={clarityApiToken}
                              onChange={(e) => setClarityApiToken(e.target.value)}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="clarity-project" className="text-sm font-medium">
                              Project ID (optional)
                            </Label>
                            <Input
                              id="clarity-project"
                              type="text"
                              placeholder="my-project-name"
                              value={clarityProjectIdInput}
                              onChange={(e) => setClarityProjectIdInput(e.target.value)}
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              4-32 characters: alphanumeric, hyphens, underscores, or periods
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <div className="text-xs text-blue-800">
                            <a
                              href="https://clarity.microsoft.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline font-medium inline-flex items-center gap-1"
                            >
                              Get your API Token from Microsoft Clarity
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        <Button
                          onClick={handleClarityConnect}
                          disabled={savingClarity}
                          className="w-full"
                          size="lg"
                        >
                          {savingClarity ? 'Connecting...' : 'Connect Microsoft Clarity'}
                        </Button>
                      </div>
                    ) : (
                      /* Connected - Show Status with Rate Limit Info */
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">Connected</p>
                            {clarityProjectId && (
                              <p className="text-xs text-green-700">
                                Project: {clarityProjectId}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Rate Limit Display */}
                        <div className={`p-3 rounded-md border ${
                          (clarityDailyRequests || 0) >= 8
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-neutral-50 border-neutral-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">Daily API Usage</span>
                            <span className={`text-xs font-semibold ${
                              (clarityDailyRequests || 0) >= 8 ? 'text-amber-700' : 'text-neutral-700'
                            }`}>
                              {clarityDailyRequests || 0} / 10 requests
                            </span>
                          </div>
                          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                (clarityDailyRequests || 0) >= 8
                                  ? 'bg-amber-600'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${((clarityDailyRequests || 0) / 10) * 100}%` }}
                            />
                          </div>
                          {(clarityDailyRequests || 0) >= 8 && (
                            <p className="text-xs text-amber-700 mt-2">
                              ⚠️ Only {10 - (clarityDailyRequests || 0)} requests remaining today!
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Resets daily at midnight UTC
                          </p>
                        </div>

                        <div className="border-t border-neutral-200 pt-3 flex gap-3">
                          <Button
                            variant="outline"
                            onClick={handleClarityDisconnect}
                            disabled={disconnectingClarity}
                            className="w-full"
                          >
                            {disconnectingClarity ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </div>

                        {clarityConnectedAt && (
                          <p className="text-xs text-muted-foreground text-center">
                            Connected {new Date(clarityConnectedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Coming Soon Content */}
                {isExpanded && connection.status === 'coming_soon' && (
                  <div className="border-t border-neutral-200 bg-white p-4">
                    <div className="text-center py-4">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                      <p className="text-sm text-neutral-600 font-medium mb-1">Coming Soon</p>
                      <p className="text-xs text-neutral-500">
                        This integration is currently in development
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-neutral-600">Integration Progress</span>
            <span className="font-medium">
              {Math.round((connectedCount / totalAvailable) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${(connectedCount / totalAvailable) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
