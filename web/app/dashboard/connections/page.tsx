'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface ClientConnection {
  client_id: string
  client_name: string
  domain: string
  gsc_connected: boolean
  ga4_connected: boolean
  bing_connected: boolean
  clarity_connected: boolean
  total_connected: number
  last_sync?: string
}

export default function ConnectionsPage() {
  const [clientConnections, setClientConnections] = useState<ClientConnection[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch all clients and their integration status
  useEffect(() => {
    async function fetchClientConnections() {
      // Fetch all clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, domain')
        .order('name', { ascending: true })

      if (!clients) {
        setLoading(false)
        return
      }

      // Fetch integrations for all clients
      const connectionsData: ClientConnection[] = []

      for (const client of clients) {
        const { data: integration } = await supabase
          .from('bing_clarity_integrations')
          .select('*')
          .eq('client_id', client.id)
          .maybeSingle()

        const gsc_connected = !!integration?.gsc_property_url
        const ga4_connected = !!integration?.ga4_property_id
        const bing_connected = !!integration?.bing_site_url
        const clarity_connected = !!integration?.clarity_project_id

        connectionsData.push({
          client_id: client.id,
          client_name: client.name,
          domain: client.domain,
          gsc_connected,
          ga4_connected,
          bing_connected,
          clarity_connected,
          total_connected: [gsc_connected, ga4_connected, bing_connected, clarity_connected].filter(Boolean).length,
          last_sync: integration?.gsc_last_sync || integration?.ga4_last_sync
        })
      }

      setClientConnections(connectionsData)
      setLoading(false)
    }
    fetchClientConnections()
  }, [supabase])

  // Calculate overall stats
  const totalClients = clientConnections.length
  const fullyConnectedClients = clientConnections.filter(c => c.total_connected === 4).length
  const partiallyConnectedClients = clientConnections.filter(c => c.total_connected > 0 && c.total_connected < 4).length
  const notConnectedClients = clientConnections.filter(c => c.total_connected === 0).length

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading connections...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text">All Client Connections</h2>
        <p className="text-gray-600 mt-1">
          Overview of platform connections across all clients
        </p>
      </div>

      {/* Connection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Total Clients</div>
          <div className="text-3xl font-bold text-gray-900">{totalClients}</div>
        </div>
        <div className="p-4 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Fully Connected</div>
          <div className="text-3xl font-bold text-green-700">{fullyConnectedClients}</div>
        </div>
        <div className="p-4 rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Partially Connected</div>
          <div className="text-3xl font-bold text-yellow-700">{partiallyConnectedClients}</div>
        </div>
        <div className="p-4 rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Not Connected</div>
          <div className="text-3xl font-bold text-red-700">{notConnectedClients}</div>
        </div>
      </div>

      {/* Client Connection Cards */}
      <div className="space-y-4">
        {clientConnections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No clients found. Add your first client to get started.
            </CardContent>
          </Card>
        ) : (
          clientConnections.map((client) => (
            <Link key={client.client_id} href={`/dashboard/clients/${client.client_id}/connections`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{client.client_name}</CardTitle>
                        <p className="text-sm text-gray-500">{client.domain}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{client.total_connected}/4</div>
                      <div className="text-xs text-gray-500">Connected</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                      {client.gsc_connected ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-gray-700">Google SC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.ga4_connected ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-gray-700">GA4</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.bing_connected ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-gray-700">Bing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.clarity_connected ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-gray-700">Clarity</span>
                    </div>
                  </div>
                  {client.last_sync && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Last sync: {new Date(client.last_sync).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
