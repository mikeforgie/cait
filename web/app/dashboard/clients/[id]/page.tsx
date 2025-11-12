import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, BarChart, CheckCircle2, Circle, Clock, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { getTaskProgress } from '@/lib/automation/tasks'
import { getLatestAudit } from '@/lib/automation/technical-audit'
import { InitializeTasksButton } from '@/components/InitializeTasksButton'
import { RunAutomationButton } from '@/components/RunAutomationButton'
import { GA4DataCard } from '@/components/GA4DataCard'
import { GBPDataCard } from '@/components/GBPDataCard'
import { BingDataCard } from '@/components/BingDataCard'
import { ClarityDataCard } from '@/components/ClarityDataCard'
import { ClientChartsSection } from '@/components/ClientChartsSection'
import { ConnectionsCard } from '@/components/ConnectionsCard'

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
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', id)
    .order('month', { ascending: true })
    .order('created_at', { ascending: true })

  // Fetch latest metrics
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics')
    .select('*')
    .eq('client_id', id)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch keyword count
  const { count: keywordCount } = await supabase
    .from('keywords')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', id)

  // Fetch top keywords
  const { data: topKeywords } = await supabase
    .from('keywords')
    .select('*')
    .eq('client_id', id)
    .order('search_volume', { ascending: false })
    .limit(20)

  // Fetch backlink count
  const { count: backlinkCount } = await supabase
    .from('backlinks')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', id)

  // Fetch latest technical audit
  const latestAudit = await getLatestAudit(id)

  // Get task progress
  const progress = await getTaskProgress(id)

  // Fetch latest GA4 report
  const { data: latestGA4Report } = await supabase
    .from('ga4_reports')
    .select('*')
    .eq('client_id', id)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get selected GA4 property name
  const selectedGA4Property = client.ga4_properties?.find(
    (p: any) => p.property_id === client.selected_ga4_property_id
  )

  // Group tasks by month
  const tasksByMonth = (tasks || []).reduce((acc, task) => {
    if (!acc[task.month]) {
      acc[task.month] = []
    }
    acc[task.month].push(task)
    return acc
  }, {} as Record<number, typeof tasks>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-neutral-600">{client.domain}</p>
        </div>
        <Badge
          variant={
            client.status === 'active'
              ? 'default'
              : client.status === 'paused'
              ? 'secondary'
              : 'outline'
          }
        >
          {client.status}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Task Progress</CardDescription>
            <CardTitle className="text-3xl">
              {progress.percentage}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-600">
              {progress.completed} of {progress.total} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Keywords Tracked</CardDescription>
            <CardTitle className="text-3xl">{keywordCount || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-600">
              {metrics?.top_10_keywords || 0} in top 10
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Backlinks</CardDescription>
            <CardTitle className="text-3xl">{backlinkCount || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-600">
              {metrics?.referring_domains || 0} referring domains
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monthly Traffic</CardDescription>
            <CardTitle className="text-3xl">
              {metrics?.traffic?.toLocaleString() || '0'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-600">
              {metrics?.sessions?.toLocaleString() || '0'} sessions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.focus_service && (
              <div>
                <div className="text-sm font-medium text-neutral-600">
                  Focus Service
                </div>
                <div className="text-lg">{client.focus_service}</div>
              </div>
            )}
            {client.primary_location && (
              <div>
                <div className="text-sm font-medium text-neutral-600">
                  Primary Location
                </div>
                <div className="text-lg">{client.primary_location}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-neutral-600">
                Onboarding Status
              </div>
              <div className="text-lg">
                <Badge variant={client.onboarding_completed ? 'default' : 'outline'}>
                  {client.onboarding_completed ? 'Complete' : 'In Progress'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Connections Overview */}
      <ConnectionsCard
        clientId={client.id}
        googleConnected={!!client.google_connected_at}
        connectedAt={client.google_connected_at}
        ga4Properties={client.ga4_properties}
        gscSites={client.gsc_sites}
        gbpLocations={client.gbp_locations}
        selectedGA4PropertyId={client.selected_ga4_property_id}
        selectedGSCSiteUrl={client.selected_gsc_site_url}
        selectedGBPLocationId={client.selected_gbp_location_id}
        bingConnected={!!client.bing_connected_at}
        bingConnectedAt={client.bing_connected_at}
        bingSiteUrl={client.bing_site_url}
        clarityConnected={!!client.clarity_connected_at}
        clarityConnectedAt={client.clarity_connected_at}
        clarityProjectId={client.clarity_project_id}
        clarityDailyRequests={client.clarity_daily_requests}
        clarityLastRequestDate={client.clarity_last_request_date}
      />

      {/* Google Analytics 4 Data */}
      {client.google_connected_at && client.selected_ga4_property_id && (
        <GA4DataCard
          clientId={client.id}
          initialData={latestGA4Report ? {
            dateRange: {
              startDate: latestGA4Report.start_date,
              endDate: latestGA4Report.end_date,
            },
            metrics: {
              totalUsers: latestGA4Report.total_users,
              newUsers: latestGA4Report.new_users,
              sessions: latestGA4Report.sessions,
              bounceRate: latestGA4Report.bounce_rate,
              avgSessionDuration: latestGA4Report.avg_session_duration,
              pageviews: latestGA4Report.pageviews,
              eventsCount: latestGA4Report.events_count,
            },
            topPages: latestGA4Report.top_pages,
            topSources: latestGA4Report.top_sources,
            dailyMetrics: latestGA4Report.daily_metrics,
          } : null}
          propertyName={selectedGA4Property?.display_name}
        />
      )}

      {/* Google Business Profile Data */}
      {client.google_connected_at && client.gbp_locations && (
        <GBPDataCard
          clientId={client.id}
          locationCount={client.gbp_locations?.length || 0}
        />
      )}

      {/* Bing Webmaster Tools Data */}
      {client.bing_connected_at && client.bing_site_url && (
        <BingDataCard
          clientId={client.id}
          siteUrl={client.bing_site_url}
        />
      )}

      {/* Microsoft Clarity Data */}
      {client.clarity_connected_at && (
        <ClarityDataCard
          clientId={client.id}
          projectId={client.clarity_project_id}
        />
      )}

      {/* Performance Charts */}
      <ClientChartsSection
        clientId={client.id}
        trafficData={latestGA4Report?.daily_metrics}
        seoScore={latestAudit ? {
          current: latestAudit.overall_score,
          previous: latestAudit.overall_score - 5
        } : undefined}
      />

      {/* Keywords Section */}
      {topKeywords && topKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Keywords</CardTitle>
            <CardDescription>
              Top 20 keywords by search volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-neutral-600">
                    <th className="pb-3 font-medium">Keyword</th>
                    <th className="pb-3 font-medium text-right">Volume</th>
                    <th className="pb-3 font-medium text-right">Difficulty</th>
                    <th className="pb-3 font-medium text-right">CPC</th>
                    <th className="pb-3 font-medium">Intent</th>
                    <th className="pb-3 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {topKeywords.map((keyword: any) => (
                    <tr key={keyword.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{keyword.keyword}</td>
                      <td className="py-3 text-right">{keyword.search_volume.toLocaleString()}</td>
                      <td className="py-3 text-right">{keyword.difficulty}</td>
                      <td className="py-3 text-right">${keyword.cpc?.toFixed(2) || '0.00'}</td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs">
                          {keyword.intent}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            keyword.priority === 'high'
                              ? 'default'
                              : keyword.priority === 'medium'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {keyword.priority}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {keywordCount && keywordCount > 20 && (
              <div className="mt-4 text-sm text-neutral-600 text-center">
                Showing 20 of {keywordCount} keywords
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Technical Audit Section */}
      {latestAudit && (
        <Card>
          <CardHeader>
            <CardTitle>Technical SEO Audit</CardTitle>
            <CardDescription>
              Latest audit from {new Date(latestAudit.audit_date).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score and Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="text-sm text-neutral-600">Overall Score</div>
                <div className="text-3xl font-bold text-green-600">
                  {latestAudit.overall_score}/100
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-neutral-600">Pages Crawled</div>
                <div className="text-2xl font-semibold">
                  {latestAudit.pages_crawled?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-neutral-600">Critical Issues</div>
                <div className="text-2xl font-semibold text-red-600">
                  {latestAudit.critical_issues || 0}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-neutral-600">Warnings</div>
                <div className="text-2xl font-semibold text-yellow-600">
                  {latestAudit.warnings || 0}
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h4 className="font-medium mb-3">Key Metrics</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(latestAudit.issues?.broken_links || 0) > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-900">Broken Links</div>
                      <div className="text-sm text-red-700">{latestAudit.issues?.broken_links || 0} pages</div>
                    </div>
                  </div>
                )}
                {(latestAudit.issues?.missing_titles || 0) > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-900">Missing Titles</div>
                      <div className="text-sm text-red-700">{latestAudit.issues?.missing_titles || 0} pages</div>
                    </div>
                  </div>
                )}
                {(latestAudit.issues?.duplicate_titles || 0) > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-900">Duplicate Titles</div>
                      <div className="text-sm text-yellow-700">{latestAudit.issues?.duplicate_titles || 0} pages</div>
                    </div>
                  </div>
                )}
                {(latestAudit.performance?.slow_pages || 0) > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-900">Slow Pages</div>
                      <div className="text-sm text-yellow-700">{latestAudit.performance?.slow_pages || 0} pages</div>
                    </div>
                  </div>
                )}
                {(latestAudit.mobile?.non_mobile_friendly || 0) > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-900">Not Mobile-Friendly</div>
                      <div className="text-sm text-yellow-700">{latestAudit.mobile?.non_mobile_friendly || 0} pages</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">Avg Response Time</div>
                    <div className="text-sm text-blue-700">{((latestAudit.performance?.avg_response_time || 0) / 1000).toFixed(2)}s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Recommendations */}
            {latestAudit.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Top Recommendations</h4>
                <div className="space-y-2">
                  {latestAudit.recommendations.slice(0, 5).map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-neutral-50"
                    >
                      <div className="mt-0.5">
                        {rec.priority === 'high' ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : rec.priority === 'medium' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Info className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium">{rec.issue}</div>
                          <Badge
                            variant={
                              rec.priority === 'high'
                                ? 'default'
                                : rec.priority === 'medium'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-xs"
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600">{rec.fix}</p>
                        <p className="text-xs text-neutral-500">{rec.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {latestAudit.recommendations.length > 5 && (
                  <div className="mt-3 text-sm text-neutral-600 text-center">
                    Showing 5 of {latestAudit.recommendations.length} recommendations
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tasks by Month */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks & Automation</CardTitle>
          <CardDescription>
            Month-by-month task roadmap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(tasksByMonth)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(month => {
              const monthTasks = tasksByMonth[parseInt(month)]
              const completed = monthTasks.filter((t: any) => t.status === 'completed').length
              const total = monthTasks.length

              return (
                <div key={month} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      Month {month}
                      {month === '0' && ' - Onboarding'}
                      {month === '1' && ' - Foundation'}
                    </h3>
                    <div className="text-sm text-neutral-600">
                      {completed}/{total} completed
                    </div>
                  </div>
                  <div className="space-y-2">
                    {monthTasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-neutral-50"
                      >
                        <div className="mt-0.5">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : task.status === 'in_progress' ? (
                            <Clock className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-neutral-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium">{task.name}</div>
                            <div className="flex gap-2">
                              {task.automated && (
                                <Badge variant="outline" className="text-xs">
                                  Automated
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  task.category === 'keyword_research'
                                    ? 'default'
                                    : task.category === 'content'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className="text-xs"
                              >
                                {task.category.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-sm text-neutral-600">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

          {Object.keys(tasksByMonth).length === 0 && (
            <InitializeTasksButton
              clientId={id}
              hasTasks={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 flex-wrap">
          <Button disabled>
            <BarChart className="mr-2 h-4 w-4" />
            View Full Report
          </Button>
          <Button variant="outline" disabled>Generate Report</Button>
        </div>

        {/* Automation Button - only show if there are tasks */}
        {tasks && tasks.length > 0 && (
          <RunAutomationButton
            clientId={id}
            tasks={tasks}
            disabled={!tasks.some(t => t.automated && t.status !== 'completed')}
          />
        )}
      </div>
    </div>
  )
}
