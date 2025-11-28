'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { SuggestionsReview } from './suggestions-review';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AITodoAssistantProps {
  todoId: string;
  todoType: string;
  clientId: string;
  issueUrls: string[]; // URLs that need fixing
}

interface GenerationProgress {
  stage: 'fetching' | 'generating' | 'storing' | 'completed' | 'error';
  message: string;
  progress: number;
  current?: number;
  total?: number;
  details?: {
    jobId: string;
    suggestions_generated: number;
    credits_used: number;
  };
  error?: string;
}

export function AITodoAssistant({
  todoId,
  todoType,
  clientId,
  issueUrls,
}: AITodoAssistantProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Map todo types to generation types
  const getGenerationType = () => {
    if (todoType === 'add_meta_descriptions') return 'meta_descriptions';
    if (todoType === 'add_alt_text') return 'alt_text';
    if (todoType === 'add_h1_tags') return 'h1_tags';
    return null;
  };

  const generationType = getGenerationType();

  // Don't show assistant for non-supported todo types
  if (!generationType) {
    return null;
  }

  const handleGenerateAll = async () => {
    setShowDialog(true);
    setGenerating(true);
    setError(null);
    setProgress({
      stage: 'fetching',
      message: 'Starting AI generation...',
      progress: 0,
    });

    try {
      const response = await fetch('/api/ai-assistants/generate-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          todoId,
          type: generationType,
          urls: issueUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate suggestions');
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

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const progressUpdate: GenerationProgress = JSON.parse(line);
            setProgress(progressUpdate);

            if (progressUpdate.stage === 'completed') {
              setGenerating(false);
              // Fetch suggestions
              await fetchSuggestions();
            } else if (progressUpdate.stage === 'error') {
              setError(progressUpdate.error || 'Generation failed');
              setGenerating(false);
            }
          } catch (e) {
            console.error('Error parsing progress:', e);
          }
        }
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message);
      setGenerating(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/ai-assistants/generate-bulk?todoId=${todoId}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleApprove = async (suggestionIds: string[]) => {
    await fetch('/api/ai-assistants/apply-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionIds, action: 'approve' }),
    });
    await fetchSuggestions();
  };

  const handleReject = async (suggestionIds: string[]) => {
    await fetch('/api/ai-assistants/apply-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionIds, action: 'reject' }),
    });
    await fetchSuggestions();
  };

  const handleApply = async (suggestionIds: string[]) => {
    await fetch('/api/ai-assistants/apply-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionIds, action: 'apply' }),
    });
    await fetchSuggestions();
    router.refresh(); // Refresh to update todo progress
  };

  const handleEdit = async (suggestionId: string, newContent: string) => {
    await fetch('/api/ai-assistants/apply-suggestions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionId, suggestedContent: newContent }),
    });
    await fetchSuggestions();
  };

  const getButtonText = () => {
    if (generationType === 'meta_descriptions') return 'Generate All Meta Descriptions';
    if (generationType === 'alt_text') return 'Generate All Alt Text';
    if (generationType === 'h1_tags') return 'Generate All H1 Tags';
    return 'Generate All';
  };

  return (
    <>
      <Button
        onClick={handleGenerateAll}
        size="sm"
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
      >
        <Sparkles className="h-4 w-4" />
        {getButtonText()}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Assistant: {getButtonText()}
            </DialogTitle>
            <DialogDescription>
              AI will analyze your pages and generate suggestions. Review and approve before applying.
            </DialogDescription>
          </DialogHeader>

          {/* Generation Progress */}
          {generating && progress && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{progress.message}</span>
                  <span className="text-neutral-600 font-medium">
                    {Math.round(progress.progress)}%
                  </span>
                </div>
                <Progress value={progress.progress} className="h-2" />
              </div>

              {progress.current && progress.total && (
                <div className="text-sm text-neutral-600 text-center">
                  Processing {progress.current} of {progress.total}...
                </div>
              )}

              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            </div>
          )}

          {/* Completion Summary */}
          {!generating && progress?.stage === 'completed' && progress.details && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-4">
              <div className="flex items-center gap-2 text-green-900 font-medium mb-2">
                <Sparkles className="h-4 w-4" />
                <span>Generation Complete!</span>
              </div>
              <div className="text-sm text-green-800 space-y-1">
                <div>✓ Generated {progress.details.suggestions_generated} suggestions</div>
                <div>✓ Used {progress.details.credits_used} credits</div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
              <div className="flex items-center gap-2 text-red-900 font-medium">
                <AlertCircle className="h-4 w-4" />
                <span>Generation Failed</span>
              </div>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          )}

          {/* Suggestions Review */}
          {!generating && suggestions.length > 0 && (
            <SuggestionsReview
              suggestions={suggestions}
              onApprove={handleApprove}
              onReject={handleReject}
              onApply={handleApply}
              onEdit={handleEdit}
              onRefresh={fetchSuggestions}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
