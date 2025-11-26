'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, Globe, Brain, Save, AlertCircle } from 'lucide-react';

interface ScanProgress {
  stage: 'crawling' | 'analyzing' | 'saving' | 'completed' | 'error';
  message: string;
  progress: number;
  details?: {
    pagesFound?: number;
    pagesCrawled?: number;
    currentPage?: string;
    analysisStage?: string;
    itemsFound?: number;
    pagesAnalyzed?: number;
    knowledgeItemsExtracted?: number;
    durationSeconds?: number;
    knowledge?: {
      has_brand_voice: boolean;
      products_count: number;
      case_studies_count: number;
      audience_segments: number;
    };
  };
  error?: string;
}

interface WebsiteScanProgressProps {
  clientId: string;
  websiteUrl: string;
  onComplete?: (success: boolean) => void;
  autoStart?: boolean;
}

export function WebsiteScanProgress({
  clientId,
  websiteUrl,
  onComplete,
  autoStart = false,
}: WebsiteScanProgressProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
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
      stage: 'crawling',
      message: 'Initializing website scan...',
      progress: 0,
    });

    try {
      const response = await fetch('/api/intelligence/scan-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          websiteUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start website scan');
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
            const progressUpdate: ScanProgress = JSON.parse(line);
            setProgress(progressUpdate);

            if (progressUpdate.stage === 'completed') {
              setCompleted(true);
              setScanning(false);
              onComplete?.(true);
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

  const getStageIcon = (stage: ScanProgress['stage']) => {
    switch (stage) {
      case 'crawling':
        return <Globe className="h-5 w-5 text-blue-600" />;
      case 'analyzing':
        return <Brain className="h-5 w-5 text-purple-600" />;
      case 'saving':
        return <Save className="h-5 w-5 text-green-600" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStageLabel = (stage: ScanProgress['stage']) => {
    switch (stage) {
      case 'crawling':
        return 'Crawling Website';
      case 'analyzing':
        return 'Analyzing Content';
      case 'saving':
        return 'Saving Knowledge';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
    }
  };

  const getStageColor = (stage: ScanProgress['stage']) => {
    switch (stage) {
      case 'crawling':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'analyzing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'saving':
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
          <CardTitle className="text-lg">Business Intelligence Scan</CardTitle>
          <CardDescription>
            Let CAIT analyze your website to learn your brand voice, products, and case studies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={startScan}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Website Scan
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
            Learning About Your Business
          </CardTitle>
          {progress && (
            <Badge variant="outline" className={getStageColor(progress.stage)}>
              {getStageLabel(progress.stage)}
            </Badge>
          )}
        </div>
        <CardDescription>
          Analyzing {websiteUrl} to extract business knowledge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">{progress.message}</span>
              <span className="text-neutral-600 font-medium">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
          </div>
        )}

        {/* Current Details */}
        {progress?.details && (
          <div className="space-y-2">
            {/* Crawling Details */}
            {progress.stage === 'crawling' && progress.details.pagesFound !== undefined && (
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Pages Found:</span>
                  <span className="font-medium">{progress.details.pagesFound}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Pages Crawled:</span>
                  <span className="font-medium">{progress.details.pagesCrawled}</span>
                </div>
                {progress.details.currentPage && (
                  <div className="text-xs text-neutral-500 mt-1 truncate">
                    {progress.details.currentPage}
                  </div>
                )}
              </div>
            )}

            {/* Analysis Details */}
            {progress.stage === 'analyzing' && progress.details.analysisStage && (
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Analyzing:</span>
                  <span className="font-medium capitalize">
                    {progress.details.analysisStage.replace('_', ' ')}
                  </span>
                </div>
                {progress.details.itemsFound !== undefined && (
                  <div className="text-xs text-neutral-500">
                    Found {progress.details.itemsFound} item(s)
                  </div>
                )}
              </div>
            )}

            {/* Completion Details */}
            {progress.stage === 'completed' && progress.details.knowledge && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-900 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Successfully learned about your business!</span>
                </div>
                <div className="text-sm space-y-1 text-green-800">
                  <div className="flex items-center justify-between">
                    <span>Pages Analyzed:</span>
                    <span className="font-medium">{progress.details.pagesAnalyzed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Knowledge Items Extracted:</span>
                    <span className="font-medium">
                      {progress.details.knowledgeItemsExtracted}
                    </span>
                  </div>
                  {progress.details.knowledge.has_brand_voice && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Brand voice identified</span>
                    </div>
                  )}
                  {progress.details.knowledge.products_count > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{progress.details.knowledge.products_count} products/services</span>
                    </div>
                  )}
                  {progress.details.knowledge.case_studies_count > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{progress.details.knowledge.case_studies_count} case studies</span>
                    </div>
                  )}
                  {progress.details.knowledge.audience_segments > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{progress.details.knowledge.audience_segments} audience segments</span>
                    </div>
                  )}
                </div>
                {progress.details.durationSeconds && (
                  <div className="text-xs text-green-700 mt-2">
                    Completed in {progress.details.durationSeconds} seconds
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
