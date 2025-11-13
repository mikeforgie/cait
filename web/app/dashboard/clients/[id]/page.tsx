import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GradientButton } from '@/components/ui/gradient-button'
import { StatusDot } from '@/components/ui/status-dot'
import {
  Heart,
  Link as LinkIcon,
  ListTodo,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  FileText,
  Link2Off,
  ImageIcon,
  Sparkles,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

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

  // Fetch tasks for this client
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', id)

  // Fetch integrations
  const { data: integrations } = await supabase
    .from('bing_clarity_integrations')
    .select('*')
    .eq('client_id', id)
    .maybeSingle()

  // Calculate task counts
  const todoTasks = tasks?.filter(t => t.status === 'todo') || []
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || []
  const completedTasks = tasks?.filter(t => t.status === 'completed') || []

  // Platform connections
  const platforms = [
    { name: 'Google Search Console', status: integrations?.gsc_property_url ? 'connected' : 'disconnected' },
    { name: 'OpenAI API', status: 'connected' },
    { name: 'Bing Webmaster', status: integrations?.bing_site_url ? 'connected' : 'disconnected' },
    { name: 'Perplexity', status: 'disconnected' },
    { name: 'Google Analytics 4', status: integrations?.ga4_property_id ? 'connected' : 'disconnected' },
    { name: 'Microsoft Clarity', status: integrations?.clarity_project_id ? 'connected' : 'disconnected' },
  ]

  const connectedCount = platforms.filter(p => p.status === 'connected').length

  // Mock SEO health data (to be replaced with real calculations)
  const seoHealth = {
    overall: 85,
    onPage: 90,
    technical: 75,
    backlinks: 60
  }

  // Mock recommended actions
  const recommendedActions = [
    {
      icon: FileText,
      title: 'Write meta descriptions',
      description: '5 pages need descriptions',
      actions: [
        { label: 'Generate with AI', variant: 'gradient' as const },
        { label: 'Schedule', variant: 'outline' as const }
      ]
    },
    {
      icon: Link2Off,
      title: 'Fix broken links',
      description: '3 broken links found',
      actions: [
        { label: 'Auto-fix', variant: 'gradient' as const },
        { label: 'Review', variant: 'outline' as const }
      ]
    },
    {
      icon: ImageIcon,
      title: 'Optimize images',
      description: '8 images can be optimized',
      actions: [
        { label: 'Generate with AI', variant: 'gradient' as const },
        { label: 'Schedule', variant: 'outline' as const }
      ]
    }
  ]

  return (
    <div className="w-full space-y-3">
      {/* Main Grid - 2x2 layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* SEO Health Card */}
        <Card className="bg-white shadow-lg border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#ff3333]" />
                <CardTitle className="text-lg font-semibold">SEO Health</CardTitle>
              </div>
              <Badge className="bg-[#1eff00] text-gray-900 font-semibold">HEALTHY</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-6xl font-bold mb-2" style={{ color: '#ffcc00' }}>
                {seoHealth.overall}%
              </div>
              {/* Gradient progress bar */}
              <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${seoHealth.overall}%`,
                    background: 'linear-gradient(90deg, #ff3333 0%, #ff8833 25%, #ffcc00 50%, #88ff00 75%, #1eff00 100%)'
                  }}
                />
              </div>
              <p className="text-sm text-gray-600">Overall SEO Score</p>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status="success" size="sm" />
                  <span className="text-sm text-gray-700">On-Page: {seoHealth.onPage}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status="warning" size="sm" />
                  <span className="text-sm text-gray-700">Technical: {seoHealth.technical}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status="danger" size="sm" />
                  <span className="text-sm text-gray-700">Backlinks: {seoHealth.backlinks}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connections Card */}
        <Card className="bg-white shadow-lg border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#ff3333]" />
                <CardTitle className="text-lg font-semibold">Connections</CardTitle>
              </div>
              <Link href={`/dashboard/clients/${id}/connections`}>
                <Button variant="ghost" size="sm" className="text-[#ff3333] hover:text-[#ff3333] hover:bg-red-50">
                  Manage →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {platforms.slice(0, 4).map((platform, index) => (
                <div key={index} className="flex items-center gap-3">
                  <StatusDot
                    status={
                      platform.status === 'connected' ? 'success' :
                      platform.status === 'pending' ? 'warning' :
                      'danger'
                    }
                    size="sm"
                  />
                  <span className="text-sm text-gray-700">{platform.name}</span>
                </div>
              ))}
            </div>

            <div className="text-center pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {connectedCount} of {platforms.length} platforms connected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Tasks Card */}
        <Card className="bg-white shadow-lg border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-[#ff3333]" />
                <CardTitle className="text-lg font-semibold">Active Tasks</CardTitle>
              </div>
              <Link href={`/dashboard/clients/${id}/tasks`}>
                <Button variant="ghost" size="sm" className="text-[#ff3333] hover:text-[#ff3333] hover:bg-red-50">
                  View All →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {/* Task counts */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#ffcc00' }}>
                  {todoTasks.length}
                </div>
                <div className="text-xs text-gray-600 uppercase mt-1">To Do</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#ffcc00' }}>
                  {inProgressTasks.length}
                </div>
                <div className="text-xs text-gray-600 uppercase mt-1">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#ffcc00' }}>
                  {completedTasks.length}
                </div>
                <div className="text-xs text-gray-600 uppercase mt-1">Completed</div>
              </div>
            </div>

            {/* Recent tasks */}
            <div className="space-y-3">
              {tasks?.slice(0, 2).map((task, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#ff3333]" />
                  </div>
                  <span className="text-sm text-gray-700">{task.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Card */}
        <Card className="bg-white shadow-lg border border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#ff3333]" />
              <CardTitle className="text-lg font-semibold">Key Metrics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Traffic */}
              <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-white">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ArrowUp className="w-4 h-4 text-[#1eff00]" />
                  <span className="text-2xl font-bold text-[#1eff00]">23%</span>
                </div>
                <div className="text-xs text-gray-600 uppercase">Traffic</div>
              </div>

              {/* Rankings */}
              <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-white">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ArrowUp className="w-4 h-4 text-[#1eff00]" />
                  <span className="text-2xl font-bold text-[#1eff00]">8</span>
                </div>
                <div className="text-xs text-gray-600 uppercase">Rankings</div>
              </div>

              {/* Bounce Rate */}
              <div className="text-center p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-white">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ArrowDown className="w-4 h-4 text-[#ffcc00]" />
                  <span className="text-2xl font-bold" style={{ color: '#ffcc00' }}>12%</span>
                </div>
                <div className="text-xs text-gray-600 uppercase">Bounce Rate</div>
              </div>

              {/* Avg Time */}
              <div className="text-center p-3 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                <div className="text-2xl font-bold text-gray-700 mb-1">2.45m</div>
                <div className="text-xs text-gray-600 uppercase">Avg Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Actions - Full Width */}
      <Card className="bg-white shadow-lg border-l-4 border-l-[#ff3333]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ff3333]" />
            <CardTitle className="text-lg font-semibold">Recommended Actions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendedActions.map((action, index) => {
              const Icon = action.icon
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border-l-4 border-l-[#ff3333]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#ff3333]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{action.title}</h4>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {action.actions.map((btn, btnIndex) => (
                      btn.variant === 'gradient' ? (
                        <GradientButton key={btnIndex} size="sm">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {btn.label}
                        </GradientButton>
                      ) : (
                        <Button key={btnIndex} variant="outline" size="sm">
                          <Calendar className="w-3 h-3 mr-1" />
                          {btn.label}
                        </Button>
                      )
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
