'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PlatformCard } from '@/components/connections/PlatformCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIGuideModal } from '@/components/ai/ai-guide-modal'
import { getGuide } from '@/lib/ai/guides/guide-library'
import { WordPressConnectionModal } from '@/components/connections/WordPressConnectionModal'
import { HostingConnectionModal } from '@/components/connections/HostingConnectionModal'
import { BingConnectionModal } from '@/components/connections/BingConnectionModal'
import { ClarityConnectionModal } from '@/components/connections/ClarityConnectionModal'
import {
  Search,
  TrendingUp,
  MousePointer,
  Sparkles,
  Brain,
  Plus,
  BarChart3,
  Globe,
  Server,
  MapPin
} from 'lucide-react'

interface Platform {
  name: string
  description: string
  icon: any
  status: 'connected' | 'pending' | 'disconnected'
  lastSync?: string
  guideId?: string  // Links to AI guide
  oauthType?: 'google' | 'clarity'  // For OAuth-based connections
  connectionType?: 'wordpress' | 'hosting' | 'bing' | 'clarity'  // For site deployment connections
}

export default function ClientConnectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [integrations, setIntegrations] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [isWordPressModalOpen, setIsWordPressModalOpen] = useState(false)
  const [isHostingModalOpen, setIsHostingModalOpen] = useState(false)
  const [isBingModalOpen, setIsBingModalOpen] = useState(false)
  const [isClarityModalOpen, setIsClarityModalOpen] = useState(false)
  const [wordpressConnection, setWordpressConnection] = useState<any>(null)
  const [hostingConnection, setHostingConnection] = useState<any>(null)
  const supabase = createClient()

  const selectedGuide = selectedGuideId ? getGuide(selectedGuideId) : null

  const handleOpenGuide = (guideId: string) => {
    setSelectedGuideId(guideId)
    setIsGuideOpen(true)
  }

  const handleCloseGuide = () => {
    setIsGuideOpen(false)
    setSelectedGuideId(null)
  }

  // Fetch all connections
  const fetchConnections = useCallback(async () => {
    // Fetch client
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    setClient(clientData)

    // Fetch bing/clarity integrations
    const { data } = await supabase
      .from('bing_clarity_integrations')
      .select('*')
      .eq('client_id', id)
      .maybeSingle()
    setIntegrations(data)

    // Fetch WordPress connection
    try {
      const wpResponse = await fetch(`/api/connections/wordpress?clientId=${id}`)
      const wpData = await wpResponse.json()
      setWordpressConnection(wpData.connection)
    } catch (e) {
      console.log('WordPress connection fetch error:', e)
    }

    // Fetch hosting connection
    try {
      const hostingResponse = await fetch(`/api/connections/hosting?clientId=${id}`)
      const hostingData = await hostingResponse.json()
      setHostingConnection(hostingData.connection)
    } catch (e) {
      console.log('Hosting connection fetch error:', e)
    }
  }, [id, supabase])

  // Fetch client and integration status from database
  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  // Handle OAuth connection
  const handleOAuthConnect = (oauthType: string) => {
    // Redirect to OAuth authorization endpoint
    window.location.href = `/api/auth/google/authorize?clientId=${id}`
  }

  // Handle WordPress connection
  const handleWordPressConnect = async (data: { siteUrl: string; username: string; appPassword: string }) => {
    const response = await fetch('/api/connections/wordpress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: id,
        ...data,
      }),
    })
    const result = await response.json()
    if (result.success) {
      fetchConnections() // Refresh connections
    }
    return result
  }

  // Handle Hosting connection
  const handleHostingConnect = async (data: {
    connectionType: string;
    host: string;
    port: number;
    username: string;
    password: string;
    rootPath: string;
  }) => {
    const response = await fetch('/api/connections/hosting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: id,
        ...data,
      }),
    })
    const result = await response.json()
    if (result.success) {
      fetchConnections() // Refresh connections
    }
    return result
  }

  // Handle Bing connection
  const handleBingConnect = async (data: {
    apiKey: string;
    siteUrl: string;
  }) => {
    const response = await fetch('/api/auth/bing/save-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: id,
        ...data,
      }),
    })
    const result = await response.json()
    if (result.success) {
      fetchConnections() // Refresh connections
    }
    return result
  }

  // Handle Clarity connection
  const handleClarityConnect = async (data: {
    apiToken: string;
    projectId: string;
  }) => {
    const response = await fetch('/api/auth/clarity/save-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: id,
        ...data,
      }),
    })
    const result = await response.json()
    if (result.success) {
      fetchConnections() // Refresh connections
    }
    return result
  }

  // Define platform configurations with AI guides
  const platforms: Platform[] = [
    {
      name: 'Google Search Console',
      description: 'Monitor search performance, rankings, and indexing status for your website.',
      icon: Search,
      status: client?.selected_gsc_site_url ? 'connected' : (client?.google_connected_at ? 'pending' : 'disconnected'),
      lastSync: client?.gsc_last_sync,
      guideId: 'connect-gsc',
      oauthType: 'google'
    },
    {
      name: 'Google Analytics 4',
      description: 'Track website traffic, user behavior, and conversion metrics.',
      icon: BarChart3,
      status: client?.selected_ga4_property_id ? 'connected' : (client?.google_connected_at ? 'pending' : 'disconnected'),
      lastSync: client?.ga4_last_sync,
      guideId: 'connect-ga4',
      oauthType: 'google'
    },
    {
      name: 'Google Business Profile',
      description: 'Manage reviews, posts, and local SEO for your business listing.',
      icon: MapPin,
      // Show 'pending' if Google is connected (even if no locations found yet - user can refresh)
      status: client?.selected_gbp_location_id ? 'connected' : (client?.google_connected_at ? 'pending' : 'disconnected'),
      lastSync: client?.gbp_last_sync,
      oauthType: 'google'
    },
    {
      name: 'WordPress Site',
      description: 'Enable AI to deploy robots.txt, sitemaps, and SEO files directly to your WordPress site.',
      icon: Globe,
      status: wordpressConnection?.status === 'connected' ? 'connected' : 'disconnected',
      lastSync: wordpressConnection?.last_verified_at,
      connectionType: 'wordpress'
    },
    {
      name: 'Hosting (FTP/SFTP)',
      description: 'Connect via FTP or SFTP for direct file deployment to any hosting provider.',
      icon: Server,
      status: hostingConnection?.status === 'connected' ? 'connected' : (hostingConnection ? 'pending' : 'disconnected'),
      lastSync: hostingConnection?.last_verified_at,
      connectionType: 'hosting'
    },
    {
      name: 'Bing Webmaster Tools',
      description: 'Optimize your site for Bing search and access valuable SEO insights.',
      icon: TrendingUp,
      status: (client?.bing_api_key && client?.bing_site_url) ? 'connected' : 'disconnected',
      lastSync: client?.bing_last_sync,
      connectionType: 'bing'
    },
    {
      name: 'Microsoft Clarity',
      description: 'Understand user behavior with heatmaps, session recordings, and insights.',
      icon: MousePointer,
      status: (client?.clarity_api_token && client?.clarity_project_id) ? 'connected' : 'disconnected',
      lastSync: client?.clarity_connected_at,
      connectionType: 'clarity'
    },
    {
      name: 'Anthropic API',
      description: 'Power AI features with Claude for content generation and SEO recommendations.',
      icon: Sparkles,
      status: 'disconnected',
      guideId: 'add-anthropic-key'
    },
    {
      name: 'Perplexity API',
      description: 'Research competitors, analyze trends, and discover content opportunities.',
      icon: Brain,
      status: 'disconnected'
    }
  ]

  // Calculate connection stats
  const connectedCount = platforms.filter(p => p.status === 'connected').length
  const pendingCount = platforms.filter(p => p.status === 'pending').length
  const disconnectedCount = platforms.filter(p => p.status === 'disconnected').length
  const totalCount = platforms.length

  if (!client) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text">Platform Connections</h2>
        <p className="text-gray-600 mt-1">
          Connect SEO tools and analytics platforms for {client.name}
        </p>
      </div>

      {/* Connection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Total Platforms</div>
          <div className="text-3xl font-bold text-gray-900">{totalCount}</div>
        </div>
        <div className="p-4 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Connected</div>
          <div className="text-3xl font-bold text-green-700">{connectedCount}</div>
        </div>
        <div className="p-4 rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-700">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Disconnected</div>
          <div className="text-3xl font-bold text-red-700">{disconnectedCount}</div>
        </div>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform, index) => (
          <PlatformCard
            key={index}
            name={platform.name}
            description={platform.description}
            icon={platform.icon}
            status={platform.status}
            lastSync={platform.lastSync}
            onConnect={() => {
              // If platform has OAuth, use OAuth flow
              if (platform.oauthType === 'google') {
                handleOAuthConnect('google')
              } else if (platform.connectionType === 'wordpress') {
                setIsWordPressModalOpen(true)
              } else if (platform.connectionType === 'hosting') {
                setIsHostingModalOpen(true)
              } else if (platform.connectionType === 'bing') {
                setIsBingModalOpen(true)
              } else if (platform.connectionType === 'clarity') {
                setIsClarityModalOpen(true)
              } else if (platform.guideId) {
                // For non-OAuth platforms, show guide
                handleOpenGuide(platform.guideId)
              } else {
                console.log(`Connect ${platform.name} for client ${id}`)
              }
            }}
            onConfigure={() => {
              // Open config modal for connected platforms
              if (platform.connectionType === 'wordpress') {
                setIsWordPressModalOpen(true)
              } else if (platform.connectionType === 'hosting') {
                setIsHostingModalOpen(true)
              } else if (platform.connectionType === 'bing') {
                setIsBingModalOpen(true)
              } else if (platform.connectionType === 'clarity') {
                setIsClarityModalOpen(true)
              } else if (platform.oauthType === 'google') {
                // For Google services (GA4, GSC, GBP), navigate to select-properties page
                router.push(`/dashboard/clients/${id}/connections/select-properties`)
              } else {
                console.log(`Configure ${platform.name} for client ${id}`)
              }
            }}
          />
        ))}

        {/* Add More Card */}
        <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <CardTitle className="text-lg mb-2">Add More Platforms</CardTitle>
            <CardDescription className="mb-4">
              Discover and connect additional SEO tools
            </CardDescription>
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 hover:opacity-90 transition-opacity">
              Explore Integrations
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Need Help Connecting?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            Our AI-powered guides walk you through each step. Click &quot;Connect&quot; on any platform to get started!
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => handleOAuthConnect('google')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Connect Google Account
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenGuide('connect-ga4')}
            >
              View Setup Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Guide Modal */}
      {selectedGuide && (
        <AIGuideModal
          guide={selectedGuide}
          isOpen={isGuideOpen}
          onClose={handleCloseGuide}
          onComplete={handleCloseGuide}
        />
      )}

      {/* WordPress Connection Modal */}
      <WordPressConnectionModal
        isOpen={isWordPressModalOpen}
        onClose={() => setIsWordPressModalOpen(false)}
        onConnect={handleWordPressConnect}
        clientDomain={client?.domain}
      />

      {/* Hosting Connection Modal */}
      <HostingConnectionModal
        isOpen={isHostingModalOpen}
        onClose={() => setIsHostingModalOpen(false)}
        onConnect={handleHostingConnect}
        clientDomain={client?.domain}
      />

      {/* Bing Webmaster Tools Connection Modal */}
      <BingConnectionModal
        isOpen={isBingModalOpen}
        onClose={() => setIsBingModalOpen(false)}
        onConnect={handleBingConnect}
        clientDomain={client?.domain}
      />

      {/* Microsoft Clarity Connection Modal */}
      <ClarityConnectionModal
        isOpen={isClarityModalOpen}
        onClose={() => setIsClarityModalOpen(false)}
        onConnect={handleClarityConnect}
        clientDomain={client?.domain}
      />
    </div>
  )
}
