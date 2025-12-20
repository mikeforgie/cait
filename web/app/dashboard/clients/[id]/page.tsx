import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Heart, ListTodo, TrendingUp, CheckCircle, AlertTriangle, XCircle, Sparkles, FileText, Mail } from 'lucide-react'
import { ConnectionsSummaryCard } from '@/components/dashboard/ConnectionsSummaryCard'

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

  // Fetch active tasks for this client
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, name, status, category, month')
    .eq('client_id', id)
    .in('status', ['pending', 'in_progress'])
    .order('month', { ascending: true })
    .limit(5)

  const taskStats = {
    pending: tasks?.filter(t => t.status === 'pending').length || 0,
    inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
  }

  // Fetch total completed count
  const { count: completedCount } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', id)
    .eq('status', 'completed')

  // Connections with AI guide support - derive status from actual client data
  const connections: Array<{
    id: string
    name: string
    status: 'success' | 'warning' | 'danger'
    guideId: string
  }> = [
    {
      id: 'gsc',
      name: 'Google Search Console',
      status: client.selected_gsc_site_url ? 'success' : 'danger',
      guideId: 'connect-gsc'
    },
    {
      id: 'ga4',
      name: 'Google Analytics 4',
      status: client.selected_ga4_property_id ? 'success' : 'danger',
      guideId: 'connect-ga4'
    },
    {
      id: 'anthropic',
      name: 'Anthropic API',
      status: 'danger',
      guideId: 'add-anthropic-key'
    },
  ]

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

        {/* Connections Card with AI Guide */}
        <ConnectionsSummaryCard clientId={id} platforms={connections} />

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
          <CardContent className="space-y-3">
            {/* Task Stats Summary */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="text-gray-600">{taskStats.inProgress} in progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span className="text-gray-600">{taskStats.pending} pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-gray-600">{completedCount || 0} completed</span>
              </div>
            </div>

            {/* Task List */}
            {tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></span>
                      <span className="text-sm font-medium text-gray-700">{task.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Month {task.month}
                      </Badge>
                      <Badge
                        className={`text-xs ${
                          task.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No active tasks. All caught up! 🎉
              </p>
            )}
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

      {/* AI Content Studio Card - Full Width */}
      <Card className="shadow-sm border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg font-semibold">AI Content Studio</CardTitle>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">NEW</Badge>
            </div>
            <Link href={`/dashboard/clients/${id}/content`}>
              <span className="text-sm font-medium text-purple-600 hover:text-purple-700 cursor-pointer">
                Open Studio →
              </span>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Generate SEO-optimized content powered by AI. Create blog posts, outreach emails, and more.
          </p>
          <div className="flex gap-3">
            <Link href={`/dashboard/clients/${id}/content`}>
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Create Blog Post
              </button>
            </Link>
            <Link href={`/dashboard/clients/${id}/content`}>
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 transition-all flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Write Outreach Email
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
