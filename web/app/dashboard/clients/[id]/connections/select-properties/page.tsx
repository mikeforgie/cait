'use client'

import { use, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarChart3, Search, MapPin, Check, Loader2, ArrowRight, ChevronDown, X, RefreshCw } from 'lucide-react'

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

// Searchable Select Component
function SearchableSelect<T>({
  items,
  selectedValue,
  onSelect,
  getItemValue,
  getItemLabel,
  getItemDescription,
  placeholder,
  emptyMessage,
  colorClass,
}: {
  items: T[]
  selectedValue: string | null
  onSelect: (value: string | null) => void
  getItemValue: (item: T) => string
  getItemLabel: (item: T) => string
  getItemDescription?: (item: T) => string | null
  placeholder: string
  emptyMessage: string
  colorClass: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    if (!search) return items
    const lowerSearch = search.toLowerCase()
    return items.filter(item =>
      getItemLabel(item).toLowerCase().includes(lowerSearch) ||
      (getItemDescription?.(item)?.toLowerCase().includes(lowerSearch))
    )
  }, [items, search, getItemLabel, getItemDescription])

  const selectedItem = items.find(item => getItemValue(item) === selectedValue)

  return (
    <div className="relative">
      {/* Selected Value / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
          selectedValue
            ? `border-${colorClass}-500 bg-${colorClass}-50`
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex-1 min-w-0">
          {selectedItem ? (
            <div>
              <p className="font-medium text-gray-900 truncate">{getItemLabel(selectedItem)}</p>
              {getItemDescription?.(selectedItem) && (
                <p className="text-sm text-gray-500 truncate">{getItemDescription(selectedItem)}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">{placeholder}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          {selectedValue && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(null)
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <Input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-60">
            {filteredItems.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">{emptyMessage}</p>
            ) : (
              filteredItems.map((item) => {
                const value = getItemValue(item)
                const isSelected = value === selectedValue
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      onSelect(value)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={`w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between ${
                      isSelected ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{getItemLabel(item)}</p>
                      {getItemDescription?.(item) && (
                        <p className="text-sm text-gray-500 truncate">{getItemDescription(item)}</p>
                      )}
                    </div>
                    {isSelected && <Check className={`w-5 h-5 text-${colorClass}-600 ml-2 flex-shrink-0`} />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false)
            setSearch('')
          }}
        />
      )}
    </div>
  )
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
  const [refreshingGBP, setRefreshingGBP] = useState(false)
  const [gbpRefreshError, setGbpRefreshError] = useState<string | null>(null)

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

  const handleRefreshGBP = async () => {
    setRefreshingGBP(true)
    setGbpRefreshError(null)
    try {
      const response = await fetch('/api/auth/google/refresh-gbp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      const result = await response.json()

      if (result.success) {
        setGbpLocations(result.locations || [])
        if (result.count === 0) {
          setGbpRefreshError('No Business Profiles found. Make sure the Business Profile API is enabled in Google Cloud Console.')
        } else {
          setGbpRefreshError(null) // Clear any previous errors on success
        }
      } else {
        // Check for quota exceeded specifically
        if (result.quotaExceeded) {
          setGbpRefreshError('⏳ Google API quota exceeded. Please wait 2-3 minutes and try again. The Business Profile API has strict rate limits.')
        } else {
          setGbpRefreshError(result.error || 'Failed to refresh GBP locations')
        }
      }
    } catch (error) {
      console.error('Error refreshing GBP:', error)
      setGbpRefreshError('Failed to refresh. Please try again.')
    } finally {
      setRefreshingGBP(false)
    }
  }

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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select Google Properties</h2>
        <p className="text-gray-600 mt-1">
          Choose which properties to track for {client?.name}
        </p>
      </div>

      {/* GA4 Properties */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Google Analytics 4</CardTitle>
          </div>
          <CardDescription>
            Track website traffic and conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchableSelect
            items={ga4Properties}
            selectedValue={selectedGA4}
            onSelect={setSelectedGA4}
            getItemValue={(p) => p.property_id}
            getItemLabel={(p) => p.display_name || 'Unnamed Property'}
            getItemDescription={(p) => `Property ID: ${p.property_id}`}
            placeholder="Select a GA4 property..."
            emptyMessage="No GA4 properties found"
            colorClass="blue"
          />
          {ga4Properties.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              No GA4 properties found in your Google account.
            </p>
          )}
        </CardContent>
      </Card>

      {/* GSC Sites */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">Google Search Console</CardTitle>
          </div>
          <CardDescription>
            Track search performance and rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchableSelect
            items={gscSites}
            selectedValue={selectedGSC}
            onSelect={setSelectedGSC}
            getItemValue={(s) => s.site_url}
            getItemLabel={(s) => s.site_url}
            getItemDescription={(s) => s.permission_level ? `Permission: ${s.permission_level}` : null}
            placeholder="Select a Search Console site..."
            emptyMessage="No Search Console sites found"
            colorClass="green"
          />
          {gscSites.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              No Search Console sites found in your Google account.
            </p>
          )}
        </CardContent>
      </Card>

      {/* GBP Locations - Always show this section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <CardTitle className="text-lg">Google Business Profile</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshGBP}
              disabled={refreshingGBP}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {refreshingGBP ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Manage reviews, posts, and local SEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gbpLocations.length > 0 ? (
            <SearchableSelect
              items={gbpLocations}
              selectedValue={selectedGBP}
              onSelect={setSelectedGBP}
              getItemValue={(l) => l.location_id}
              getItemLabel={(l) => l.title || 'Unnamed Location'}
              getItemDescription={(l) => l.address || null}
              placeholder="Select a business location..."
              emptyMessage="No matching locations found"
              colorClass="red"
            />
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>No Business Profiles found.</strong> This could mean:
              </p>
              <ul className="text-sm text-amber-700 mt-2 list-disc list-inside space-y-1">
                <li>The Google account doesn&apos;t have any Business Profiles</li>
                <li>You need Owner or Manager access to the Business Profile</li>
                <li>The Business Profile API may need to be enabled in Google Cloud Console</li>
              </ul>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Google has strict rate limits on the Business Profile API.
                  If you just connected, <strong>wait 1-2 minutes</strong> before clicking Refresh.
                  The refresh may take 20-60 seconds while it waits for Google&apos;s quota to reset.
                </p>
              </div>
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
                <p className="text-sm text-purple-800">
                  <strong>🔧 API Access Required:</strong> Google Business Profile API has a default quota of 0 until your project is approved.
                  <a href="https://support.google.com/business/contact/api_default" target="_blank" rel="noopener noreferrer" className="underline font-medium ml-1">Request API access here</a> (select &quot;Application for Basic API Access&quot;).
                </p>
              </div>
            </div>
          )}
          {gbpRefreshError && (
            <p className="text-sm text-red-600 mt-2">{gbpRefreshError}</p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/clients/${clientId}/connections`)}
        >
          Skip for Now
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
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
