'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanProgress } from './scan-progress';
import { TodoList } from './todo-list';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Shield,
  FileText,
  Bot,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ScanDashboardProps {
  client: any;
  latestScan?: any;
  issues: any[];
  todos: any[];
}

export function ScanDashboard({ client, latestScan, issues, todos }: ScanDashboardProps) {
  const [scanning, setScanning] = useState(false);
  const router = useRouter();

  const handleScanComplete = (success: boolean) => {
    setScanning(false);
    if (success) {
      // Refresh the page to show new results
      router.refresh();
    }
  };

  const issueStats = {
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    recommendation: issues.filter(i => i.severity === 'recommendation').length,
  };

  const todoStats = {
    pending: todos.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    completed: todos.filter(t => t.status === 'completed').length,
    auto_completed: todos.filter(t => t.auto_completed).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">SEO Scanning & Auto-Tasks</h1>
          <p className="text-neutral-600 mt-1">
            Automatically detect and complete SEO tasks for {client.domain}
          </p>
        </div>
        <Button
          onClick={() => setScanning(true)}
          disabled={scanning}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Run New Scan'}
        </Button>
      </div>

      {/* Scan Progress (when scanning) */}
      {scanning && (
        <ScanProgress
          clientId={client.id}
          websiteUrl={client.domain?.startsWith('http') ? client.domain : `https://${client.domain}`}
          onComplete={handleScanComplete}
          autoStart={true}
        />
      )}

      {/* Latest Scan Summary */}
      {latestScan && !scanning && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Latest Scan Results</CardTitle>
                <CardDescription>
                  {latestScan.scan_status === 'completed' && (
                    <>
                      Scanned on{' '}
                      {new Date(latestScan.completed_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </>
                  )}
                  {latestScan.scan_status === 'running' && <>Scan in progress...</>}
                  {latestScan.scan_status === 'failed' && <>Scan failed</>}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={
                  latestScan.scan_status === 'completed'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : latestScan.scan_status === 'running'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                }
              >
                {latestScan.scan_status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Pages Scanned */}
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">
                  {latestScan.pages_scanned}
                </div>
                <div className="text-sm text-neutral-600">Pages Scanned</div>
              </div>

              {/* Critical Issues */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div className="text-2xl font-bold text-red-900">
                    {latestScan.critical_issues || 0}
                  </div>
                </div>
                <div className="text-sm text-neutral-600">Critical</div>
              </div>

              {/* Warnings */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-900">
                    {latestScan.warnings || 0}
                  </div>
                </div>
                <div className="text-sm text-neutral-600">Warnings</div>
              </div>

              {/* Recommendations */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Info className="h-5 w-5 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-900">
                    {latestScan.recommendations || 0}
                  </div>
                </div>
                <div className="text-sm text-neutral-600">Recommendations</div>
              </div>
            </div>

            {/* Technical Checks */}
            {latestScan.scan_results && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <h4 className="font-medium text-neutral-900 mb-2">Technical Checks</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      latestScan.scan_results.has_ssl
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {latestScan.scan_results.has_ssl ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span>SSL/HTTPS</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      latestScan.scan_results.has_sitemap
                        ? 'text-green-700'
                        : 'text-orange-700'
                    }`}
                  >
                    {latestScan.scan_results.has_sitemap ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <span>XML Sitemap</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      latestScan.scan_results.has_robots_txt
                        ? 'text-green-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {latestScan.scan_results.has_robots_txt ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                    <span>robots.txt</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scan Duration */}
            {latestScan.duration_seconds && (
              <div className="mt-4 text-xs text-neutral-500">
                Scan completed in {latestScan.duration_seconds} seconds
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Scan Message */}
      {!latestScan && !scanning && (
        <Card>
          <CardHeader>
            <CardTitle>No Scans Yet</CardTitle>
            <CardDescription>
              Run your first SEO scan to discover issues and automatically create todos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Bot className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
              <p className="text-neutral-600 mb-4">
                Our smart scanner will analyze your website and automatically detect completed tasks
              </p>
              <Button onClick={() => setScanning(true)} size="lg">
                Run First Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todo List */}
      <TodoList todos={todos} clientId={client.id} onRefresh={() => router.refresh()} />

      {/* Issues List */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open Issues</CardTitle>
            <CardDescription>
              {issueStats.critical} critical • {issueStats.warning} warnings •{' '}
              {issueStats.recommendation} recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {issues.slice(0, 10).map(issue => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-neutral-200 p-3 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Severity Icon */}
                    <div className="mt-0.5">
                      {issue.severity === 'critical' && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      {issue.severity === 'warning' && (
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      )}
                      {issue.severity === 'recommendation' && (
                        <Info className="h-5 w-5 text-blue-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-900">{issue.title}</h4>
                          <p className="text-sm text-neutral-600 mt-1">{issue.description}</p>

                          {/* Affected URL */}
                          {issue.affected_url && (
                            <div className="text-xs text-neutral-500 mt-1 truncate">
                              {issue.affected_url}
                            </div>
                          )}

                          {/* Fix Suggestion */}
                          <div className="mt-2 text-sm text-blue-700 bg-blue-50 rounded px-2 py-1">
                            <span className="font-medium">Fix:</span> {issue.fix_suggestion}
                          </div>
                        </div>

                        {/* Complexity Badge */}
                        <Badge
                          variant="outline"
                          className={
                            issue.fix_complexity === 'easy'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : issue.fix_complexity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                          }
                        >
                          {issue.fix_complexity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {issues.length > 10 && (
                <div className="text-center text-sm text-neutral-500">
                  Showing 10 of {issues.length} issues
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-Complete Stats */}
      {todoStats.auto_completed > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-900">
              <Bot className="h-5 w-5" />
              Auto-Completion Active
            </CardTitle>
            <CardDescription className="text-green-700">
              {todoStats.auto_completed} task{todoStats.auto_completed !== 1 ? 's' : ''} automatically
              completed by scan detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800">
              Our smart scanner automatically detects when SEO tasks are completed on your website.
              Run scans regularly to keep your todo list up to date!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
