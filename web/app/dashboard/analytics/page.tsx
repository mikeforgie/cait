'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, TrendingUp, TrendingDown, Users, Eye, MousePointerClick } from 'lucide-react'
import Link from 'next/link'

interface ClientAnalytics {
  client_id: string
  client_name: string
  domain: string
  users: number
  sessions: number
  pageviews: number
  bounce_rate: number
  avg_session_duration: number
  conversions: number
  trend: 'up' | 'down' | 'stable'
  change_percentage: number
}

export default function AnalyticsPage() {
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch analytics for all clients
  useEffect(() => {
    async function fetchAnalytics() {
      // Fetch all clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, domain')
        .order('name', { ascending: true })

      if (!clients) {
        setLoading(false)
        return
      }

      // Fetch analytics data for all clients
      const analyticsData: ClientAnalytics[] = []

      for (const client of clients) {
        // TODO: Replace with actual analytics data from GA4/GSC
        // For now, using mock data
        const mockData = {
          client_id: client.id,
          client_name: client.name,
          domain: client.domain,
          users: Math.floor(Math.random() * 10000) + 1000,
          sessions: Math.floor(Math.random() * 15000) + 1500,
          pageviews: Math.floor(Math.random() * 25000) + 3000,
          bounce_rate: Math.floor(Math.random() * 60) + 20,
          avg_session_duration: Math.floor(Math.random() * 300) + 60,
          conversions: Math.floor(Math.random() * 100) + 10,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
          change_percentage: Math.floor(Math.random() * 40) - 20
        }

        analyticsData.push(mockData)
      }

      setClientAnalytics(analyticsData)
      setLoading(false)
    }
    fetchAnalytics()
  }, [supabase])

  // Calculate overall stats
  const totalUsers = clientAnalytics.reduce((sum, client) => sum + client.users, 0)
  const totalSessions = clientAnalytics.reduce((sum, client) => sum + client.sessions, 0)
  const totalPageviews = clientAnalytics.reduce((sum, client) => sum + client.pageviews, 0)
  const totalConversions = clientAnalytics.reduce((sum, client) => sum + client.conversions, 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text">All Client Analytics</h2>
        <p className="text-gray-600 mt-1">Performance overview across all clients</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <div className="text-sm text-gray-600 font-medium">Total Users</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatNumber(totalUsers)}</div>
        </div>
        <div className="p-4 rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-2 mb-1">
            <MousePointerClick className="w-4 h-4 text-purple-600" />
            <div className="text-sm text-gray-600 font-medium">Total Sessions</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatNumber(totalSessions)}</div>
        </div>
        <div className="p-4 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-green-600" />
            <div className="text-sm text-gray-600 font-medium">Total Pageviews</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatNumber(totalPageviews)}</div>
        </div>
        <div className="p-4 rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <div className="text-sm text-gray-600 font-medium">Total Conversions</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatNumber(totalConversions)}</div>
        </div>
      </div>

      {/* Client Analytics Cards */}
      <div className="space-y-4">
        {clientAnalytics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No analytics data found. Connect Google Analytics to get started.
            </CardContent>
          </Card>
        ) : (
          clientAnalytics.map((client) => (
            <Link key={client.client_id} href={`/dashboard/clients/${client.client_id}/analytics`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
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
                    <div className="flex items-center gap-2">
                      {client.trend === 'up' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-medium">+{client.change_percentage}%</span>
                        </div>
                      )}
                      {client.trend === 'down' && (
                        <div className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="w-4 h-4" />
                          <span className="text-sm font-medium">{client.change_percentage}%</span>
                        </div>
                      )}
                      {client.trend === 'stable' && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="text-sm font-medium">Stable</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Users</div>
                      <div className="text-lg font-bold text-gray-900">{formatNumber(client.users)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Sessions</div>
                      <div className="text-lg font-bold text-gray-900">{formatNumber(client.sessions)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Pageviews</div>
                      <div className="text-lg font-bold text-gray-900">{formatNumber(client.pageviews)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Bounce Rate</div>
                      <div className="text-lg font-bold text-gray-900">{client.bounce_rate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Avg Session</div>
                      <div className="text-lg font-bold text-gray-900">{formatDuration(client.avg_session_duration)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Conversions</div>
                      <div className="text-lg font-bold text-green-700">{formatNumber(client.conversions)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Analytics data shown is for the last 30 days. Click on any client to view detailed analytics and historical trends.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
