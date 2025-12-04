'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Search, MapPin, Check, Loader2, ArrowRight } from 'lucide-react'

interface GA4Property {
  property_id: string
  display_name: string
  account_id?: string
}

interface GSCSite {
  site_url: string
  permission_level?: string
}

interface GBPLocation {
  location_id: string
  title?: string
  address?: string
  phone?: string
  website?: string
  account_name?: string
}

export default function SelectPropertiesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [client, setClient] = useState<any>(null)

  const [ga4Properties, setGa4Properties] = useState<GA4Property[]>([])
  const [gscSites, setGscSites] = useState<GSCSite[]>([])
  const [gbpLocations, setGbpLocations] = useState<GBPLocation[]>([])

  const [selectedGA4, setSelectedGA4] = useState<string | null>(null)
  const [selectedGSC, setSelectedGSC] = useState<string | null>(null)
  const [selectedGBP, setSelectedGBP] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClient() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (data) {
        setClient(data)
        setGa4Properties(data.ga4_properties || [])
        setGscSites(data.gsc_sites || [])
        setGbpLocations(data.gbp_locations || [])

        // Pre-select if already chosen
        if (data.selected_ga4_property_id) setSelectedGA4(data.selected_ga4_property_id)
        if (data.selected_gsc_site_url) setSelectedGSC(data.selected_gsc_site_url)
        if (data.selected_gbp_location_id) setSelectedGBP(data.selected_gbp_location_id)
      }
      setLoading(false)
    }
    fetchClient()
  }, [clientId, supabase])

  const handleSave = async () => {
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

      if (response.ok) {
        router.push(`/dashboard/clients/${clientId}/connections?success=properties_selected`)
      } else {
        alert('Failed to save selection')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save selection')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!client?.google_connected_at) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Google account not connected.</p>
            <Button
              className="mt-4"
              onClick={() => router.push(`/dashboard/clients/${clientId}/connections`)}
            >
              Go to Connections
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select Google Properties</h2>
        <p className="text-gray-600 mt-1">
          Choose which Google Analytics property and Search Console site to track for {client?.name}
        </p>
      </div>

      {/* GA4 Properties */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <CardTitle>Google Analytics 4 Properties</CardTitle>
          </div>
          <CardDescription>
            Select the GA4 property to track website traffic and conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ga4Properties.length === 0 ? (
            <p className="text-gray-500 text-sm">No GA4 properties found in your account.</p>
          ) : (
            <div className="space-y-2">
              {ga4Properties.map((prop) => (
                <button
                  key={prop.property_id}
                  onClick={() => setSelectedGA4(prop.property_id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedGA4 === prop.property_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{prop.display_name || 'Unnamed Property'}</p>
                      <p className="text-sm text-gray-500">Property ID: {prop.property_id}</p>
                    </div>
                    {selectedGA4 === prop.property_id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GSC Sites */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-green-600" />
            <CardTitle>Google Search Console Sites</CardTitle>
          </div>
          <CardDescription>
            Select the site to track search performance and rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gscSites.length === 0 ? (
            <p className="text-gray-500 text-sm">No Search Console sites found in your account.</p>
          ) : (
            <div className="space-y-2">
              {gscSites.map((site) => (
                <button
                  key={site.site_url}
                  onClick={() => setSelectedGSC(site.site_url)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedGSC === site.site_url
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{site.site_url}</p>
                      {site.permission_level && (
                        <Badge variant="secondary" className="mt-1">
                          {site.permission_level}
                        </Badge>
                      )}
                    </div>
                    {selectedGSC === site.site_url && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GBP Locations (if any) */}
      {gbpLocations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <CardTitle>Google Business Profile Locations</CardTitle>
            </div>
            <CardDescription>
              Select the business location for local SEO tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gbpLocations.map((location) => (
                <button
                  key={location.location_id}
                  onClick={() => setSelectedGBP(location.location_id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedGBP === location.location_id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{location.title || 'Unnamed Location'}</p>
                      {location.address && (
                        <p className="text-sm text-gray-500">{location.address}</p>
                      )}
                    </div>
                    {selectedGBP === location.location_id && (
                      <Check className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/clients/${clientId}/connections`)}
        >
          Skip for Now
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || (!selectedGA4 && !selectedGSC)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save Selection
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
