'use client'

import { use, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PlatformCard } from '@/components/connections/PlatformCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  TrendingUp,
  MousePointer,
  Sparkles,
  Brain,
  Plus,
  BarChart3
} from 'lucide-react'

interface Platform {
  name: string
  description: string
  icon: any
  status: 'connected' | 'pending' | 'disconnected'
  lastSync?: string
}

export default function ClientConnectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [integrations, setIntegrations] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const supabase = createClient()

  // Fetch client and integration status from database
  useEffect(() => {
    async function fetchData() {
      // Fetch client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      setClient(clientData)

      // Fetch integrations for this client
      const { data } = await supabase
        .from('bing_clarity_integrations')
        .select('*')
        .eq('client_id', id)
        .maybeSingle()
      setIntegrations(data)
    }
    fetchData()
  }, [id, supabase])

  // Define platform configurations
  const platforms: Platform[] = [
    {
      name: 'Google Search Console',
      description: 'Monitor search performance, rankings, and indexing status for your website.',
      icon: Search,
      status: integrations?.gsc_property_url ? 'connected' : 'disconnected',
      lastSync: integrations?.gsc_last_sync
    },
    {
      name: 'Google Analytics 4',
      description: 'Track website traffic, user behavior, and conversion metrics.',
      icon: BarChart3,
      status: integrations?.ga4_property_id ? 'connected' : 'disconnected',
      lastSync: integrations?.ga4_last_sync
    },
    {
      name: 'Bing Webmaster Tools',
      description: 'Optimize your site for Bing search and access valuable SEO insights.',
      icon: TrendingUp,
      status: integrations?.bing_site_url ? 'connected' : 'disconnected',
      lastSync: integrations?.bing_last_sync
    },
    {
      name: 'Microsoft Clarity',
      description: 'Understand user behavior with heatmaps, session recordings, and insights.',
      icon: MousePointer,
      status: integrations?.clarity_project_id ? 'connected' : 'disconnected',
      lastSync: integrations?.clarity_last_sync
    },
    {
      name: 'OpenAI API',
      description: 'Generate AI-powered content, meta descriptions, and SEO recommendations.',
      icon: Sparkles,
      status: 'disconnected' // TODO: Add to database when implemented
    },
    {
      name: 'Perplexity API',
      description: 'Research competitors, analyze trends, and discover content opportunities.',
      icon: Brain,
      status: 'disconnected' // TODO: Add to database when implemented
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
              // TODO: Implement connection flow
              console.log(`Connect ${platform.name} for client ${params.id}`)
            }}
            onConfigure={() => {
              // TODO: Implement configuration
              console.log(`Configure ${platform.name} for client ${params.id}`)
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
          <CardTitle className="text-lg">Need Help Connecting?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            Check out our integration guides for step-by-step instructions on connecting each platform.
          </p>
          <button className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all">
            View Integration Guides
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
