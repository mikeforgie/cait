import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Heart, Plug, ListTodo, TrendingUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  // Mock SEO health data (replace with real data later)
  const seoHealth = {
    overall: 85,
    onPage: 90,
    technical: 75,
    backlinks: 60
  }

  // Mock connections data
  const connections = [
    { name: 'Google Search Console', status: 'connected' },
    { name: 'OpenAI API', status: 'connected' },
    { name: 'Bing Webmaster', status: 'pending' },
    { name: 'Perplexity', status: 'disconnected' },
  ]

  const connectedCount = connections.filter(c => c.status === 'connected').length

  return (
    <div className="p-8 space-y-6">
      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Health Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg font-semibold">SEO Health</CardTitle>
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-semibold">
                HEALTHY
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className="text-6xl font-bold text-yellow-500 mb-2">
                {seoHealth.overall}%
              </div>
              {/* Gradient progress bar */}
              <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${seoHealth.overall}%`,
                    background: 'linear-gradient(90deg, #EF4444 0%, #F97316 25%, #FACC15 50%, #84CC16 75%, #22C55E 100%)'
                  }}
                />
              </div>
              <p className="text-sm text-gray-600">Overall SEO Score</p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">On-Page: {seoHealth.onPage}%</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-700">Technical: {seoHealth.technical}%</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-700">Backlinks: {seoHealth.backlinks}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connections Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plug className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg font-semibold">Connections</CardTitle>
              </div>
              <Link href={`/dashboard/clients/${id}/connections`}>
                <span className="text-sm font-medium text-red-500 hover:text-red-600 cursor-pointer">
                  Manage →
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connections list */}
            <div className="space-y-3">
              {connections.map((connection, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    connection.status === 'connected' ? 'bg-green-500' :
                    connection.status === 'pending' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-700">{connection.name}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                {connectedCount} of {connections.length} platforms connected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Tasks Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg font-semibold">Active Tasks</CardTitle>
              </div>
              <Link href={`/dashboard/clients/${id}/tasks`}>
                <span className="text-sm font-medium text-red-500 hover:text-red-600 cursor-pointer">
                  View All →
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">No active tasks</p>
          </CardContent>
        </Card>

        {/* Key Metrics Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <CardTitle className="text-lg font-semibold">Key Metrics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Metrics loading...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
