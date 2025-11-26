import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Link as LinkIcon, FileText, Zap } from 'lucide-react';
import { ActionLogger } from '@/components/attribution/action-logger';
import { AttributionTimeline } from '@/components/attribution/attribution-timeline';
import { PageAttributionView } from '@/components/attribution/page-attribution-view';
import { getClientActions, getActionStats } from '@/lib/attribution/action-logger';

export default async function AttributionPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();

  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Get recent actions
  const recentActions = await getClientActions(clientId, { limit: 20 });

  // Get action statistics
  const actionStats = await getActionStats(clientId);

  // Get recent rankings (top pages with movement)
  const { data: recentRankings } = await supabase
    .from('keyword_rankings')
    .select('*')
    .eq('client_id', clientId)
    .not('position_change', 'is', null)
    .order('measured_at', { ascending: false })
    .limit(10);

  // Get tracked keywords count
  const { count: trackedKeywordsCount } = await supabase
    .from('tracked_keywords')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('is_active', true);

  // Get backlinks count
  const { count: backlinksCount } = await supabase
    .from('backlink_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('is_live', true);

  // Get indexed backlinks count
  const { count: indexedBacklinksCount } = await supabase
    .from('backlink_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('is_indexed', true)
    .eq('is_live', true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
            <Link href={`/dashboard/${clientId}`} className="hover:text-neutral-900">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-neutral-900">Attribution Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">SEO Attribution & Analytics</h1>
          <p className="text-neutral-600 mt-1">
            Track all SEO activities and see which actions drive results
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/${clientId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionStats.total}</div>
            <p className="text-xs text-neutral-600 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Tracked Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackedKeywordsCount || 0}</div>
            <p className="text-xs text-neutral-600 mt-1">Active monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Live Backlinks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backlinksCount || 0}</div>
            <p className="text-xs text-neutral-600 mt-1">
              {indexedBacklinksCount || 0} indexed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Rankings Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">
                {recentRankings?.filter(r => (r.position_change || 0) > 0).length || 0}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              {recentRankings?.filter(r => (r.position_change || 0) < 0).length || 0} decreased
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Categories Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Actions by Category</CardTitle>
          <CardDescription>SEO activities performed this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Content</span>
                <Badge variant="secondary">{actionStats.by_category.content || 0}</Badge>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${actionStats.total > 0 ? ((actionStats.by_category.content || 0) / actionStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">On-Page</span>
                <Badge variant="secondary">{actionStats.by_category.on_page || 0}</Badge>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${actionStats.total > 0 ? ((actionStats.by_category.on_page || 0) / actionStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Off-Page</span>
                <Badge variant="secondary">{actionStats.by_category.off_page || 0}</Badge>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{
                    width: `${actionStats.total > 0 ? ((actionStats.by_category.off_page || 0) / actionStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Technical</span>
                <Badge variant="secondary">{actionStats.by_category.technical || 0}</Badge>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-orange-500"
                  style={{
                    width: `${actionStats.total > 0 ? ((actionStats.by_category.technical || 0) / actionStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Logger */}
      <ActionLogger
        clientId={clientId}
        clientWebsite={client.website}
      />

      {/* Attribution Timeline */}
      <AttributionTimeline
        clientId={clientId}
        actions={recentActions}
        rankings={recentRankings || []}
      />

      {/* Page-Specific Attribution (if we have data) */}
      {recentRankings && recentRankings.length > 0 && recentRankings[0].target_url && (
        <PageAttributionView
          clientId={clientId}
          targetUrl={recentRankings[0].target_url}
        />
      )}
    </div>
  );
}
