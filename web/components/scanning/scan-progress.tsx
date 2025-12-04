'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Loader2,
  Search,
  Save,
  AlertCircle,
  Shield,
  FileText,
  Bot,
  CheckCheck,
} from 'lucide-react';

interface ScanProgressData {
  stage: 'scanning' | 'storing' | 'autocomplete' | 'completed' | 'error';
  message: string;
  progress: number;
  currentUrl?: string;
  details?: {
    scanId: string;
    pages_scanned: number;
    issues_found: number;
    critical_issues: number;
    warnings: number;
    recommendations: number;
    todos_completed: number;
    todos_created: number;
    has_ssl: boolean;
    has_sitemap: boolean;
    has_robots_txt: boolean;
  };
  error?: string;
}

interface ScanProgressProps {
  clientId: string;
  websiteUrl: string;
  onComplete?: (success: boolean, scanId?: string) => void;
  autoStart?: boolean;
}

export function ScanProgress({
  clientId,
  websiteUrl,
  onComplete,
  autoStart = false,
}: ScanProgressProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgressData | null>(null);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoStart && !scanning && !completed) {
      startScan();
    }
  }, [autoStart]);

  const startScan = async () => {
    setScanning(true);
    setError(null);
    setProgress({
      stage: 'scanning',
      message: 'Initializing SEO scan...',
      progress: 0,
    });

    try {
      const response = await fetch('/api/scanning/run-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          websiteUrl,
          triggeredBy: autoStart ? 'onboarding' : 'manual',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to start scan (${response.status})`);
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk and parse JSON lines
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const progressUpdate: ScanProgressData = JSON.parse(line);
            setProgress(progressUpdate);

            if (progressUpdate.stage === 'completed') {
              setCompleted(true);
              setScanning(false);
              onComplete?.(true, progressUpdate.details?.scanId);
            } else if (progressUpdate.stage === 'error') {
              setError(progressUpdate.error || 'Scan failed');
              setScanning(false);
              onComplete?.(false);
            }
          } catch (e) {
            console.error('Error parsing progress update:', e);
          }
        }
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message);
      setScanning(false);
      onComplete?.(false);
    }
  };

  const getStageIcon = (stage: ScanProgressData['stage']) => {
    switch (stage) {
      case 'scanning':
        return <Search className="h-5 w-5 text-blue-600" />;
      case 'storing':
        return <Save className="h-5 w-5 text-purple-600" />;
      case 'autocomplete':
        return <CheckCheck className="h-5 w-5 text-green-600" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStageLabel = (stage: ScanProgressData['stage']) => {
    switch (stage) {
      case 'scanning':
        return 'Scanning Website';
      case 'storing':
        return 'Storing Results';
      case 'autocomplete':
        return 'Auto-Completing Tasks';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
    }
  };

  const getStageColor = (stage: ScanProgressData['stage']) => {
    switch (stage) {
      case 'scanning':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'storing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'autocomplete':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  if (!autoStart && !scanning && !completed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Technical SEO Scan</CardTitle>
          <CardDescription>
            Scan your website for common SEO issues and automatically update your todo list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={startScan}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start SEO Scan
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {progress && getStageIcon(progress.stage)}
            Scanning Your Website
          </CardTitle>
          {progress && (
            <Badge variant="outline" className={getStageColor(progress.stage)}>
              {getStageLabel(progress.stage)}
            </Badge>
          )}
        </div>
        <CardDescription>Analyzing {websiteUrl} for SEO issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">{progress.message}</span>
              <span className="text-neutral-600 font-medium">{Math.round(progress.progress)}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
          </div>
        )}

        {/* Current URL */}
        {progress?.currentUrl && (
          <div className="text-xs text-neutral-500 truncate">
            Scanning: {progress.currentUrl}
          </div>
        )}

        {/* Completion Details */}
        {progress?.stage === 'completed' && progress.details && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-900 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Scan completed successfully!</span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-800">Pages Scanned:</span>
                <span className="font-medium text-green-900">
                  {progress.details.pages_scanned}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-800">Issues Found:</span>
                <span className="font-medium text-green-900">
                  {progress.details.issues_found}
                </span>
              </div>
            </div>

            {/* Issue Breakdown */}
            {progress.details.issues_found > 0 && (
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between text-green-800">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-600" />
                    Critical:
                  </span>
                  <span className="font-medium">{progress.details.critical_issues}</span>
                </div>
                <div className="flex items-center justify-between text-green-800">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-yellow-600" />
                    Warnings:
                  </span>
                  <span className="font-medium">{progress.details.warnings}</span>
                </div>
                <div className="flex items-center justify-between text-green-800">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-blue-600" />
                    Recommendations:
                  </span>
                  <span className="font-medium">{progress.details.recommendations}</span>
                </div>
              </div>
            )}

            {/* Technical Checks */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-green-800">
                {progress.details.has_ssl ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>SSL/HTTPS enabled</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-red-600" />
                    <span>SSL/HTTPS missing</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-green-800">
                {progress.details.has_sitemap ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>XML Sitemap found</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-yellow-600" />
                    <span>XML Sitemap missing</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-green-800">
                {progress.details.has_robots_txt ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>robots.txt found</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-blue-600" />
                    <span>robots.txt missing</span>
                  </>
                )}
              </div>
            </div>

            {/* Auto-Complete Summary */}
            {(progress.details.todos_completed > 0 || progress.details.todos_created > 0) && (
              <div className="border-t border-green-300 pt-2 space-y-1 text-sm">
                {progress.details.todos_completed > 0 && (
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCheck className="h-3 w-3" />
                    <span>
                      {progress.details.todos_completed} todo{progress.details.todos_completed !== 1 ? 's' : ''} automatically completed
                    </span>
                  </div>
                )}
                {progress.details.todos_created > 0 && (
                  <div className="flex items-center gap-2 text-green-800">
                    <Bot className="h-3 w-3" />
                    <span>
                      {progress.details.todos_created} new todo{progress.details.todos_created !== 1 ? 's' : ''} created
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-900 font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Scan Failed</span>
            </div>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {scanning && !completed && !error && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
