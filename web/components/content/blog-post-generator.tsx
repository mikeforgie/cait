'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Download, Send, Loader2, Coins } from 'lucide-react';
import { calculateBlogPostCredits } from '@/lib/ai/credits';

interface BlogPostGeneratorProps {
  clientId: string;
  clientName: string;
  service: string;
  location: string;
  suggestedKeywords?: string[];
}

export function BlogPostGenerator({
  clientId,
  clientName,
  service,
  location,
  suggestedKeywords = [],
}: BlogPostGeneratorProps) {
  const [keyword, setKeyword] = useState('');
  const [wordCount, setWordCount] = useState(1500);
  const [tone, setTone] = useState<'professional' | 'casual' | 'authoritative' | 'friendly'>('professional');
  const [includeIntro, setIncludeIntro] = useState(true);
  const [includeConclusion, setIncludeConclusion] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [outline, setOutline] = useState('');
  const [showOutline, setShowOutline] = useState(false);
  const [error, setError] = useState('');

  // Calculate credit cost based on word count
  const creditCost = useMemo(() => {
    return calculateBlogPostCredits(wordCount);
  }, [wordCount]);

  const handleGenerateOutline = async () => {
    if (!keyword.trim()) return;

    setShowOutline(true);
    setGenerating(true);

    try {
      // TODO: Call API to generate outline
      const response = await fetch('/api/ai/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          businessContext: `${clientName} - ${service} in ${location}`,
        }),
      });

      const data = await response.json();
      setOutline(data.outline);
    } catch (error) {
      console.error('Failed to generate outline:', error);
      setOutline('Failed to generate outline. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) return;

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          keyword,
          businessName: clientName,
          service,
          location,
          wordCount,
          tone,
          includeIntro,
          includeConclusion,
          includeCTA,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle credit limit errors
        if (data.error === 'Insufficient credits' || data.error === 'Monthly credit limit reached') {
          setError(data.message || data.error);
        } else {
          setError(data.error || 'Failed to generate blog post');
        }
        return;
      }

      setGeneratedContent(data.content);
      setError('');
    } catch (error) {
      console.error('Failed to generate blog post:', error);
      setError('Failed to generate blog post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    // TODO: Show toast notification
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${keyword.replace(/\s+/g, '-').toLowerCase()}-blog-post.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Post Generator</CardTitle>
          <CardDescription>
            Create SEO-optimized blog posts powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Keyword Selection */}
          <div className="space-y-2">
            <Label htmlFor="keyword">Target Keyword *</Label>
            <Input
              id="keyword"
              placeholder="e.g., best coffee shops in austin"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {suggestedKeywords.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-600">Suggested keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedKeywords.slice(0, 5).map((kw) => (
                    <Button
                      key={kw}
                      variant="outline"
                      size="sm"
                      onClick={() => setKeyword(kw)}
                      className="text-xs"
                    >
                      {kw}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Word Count */}
          <div className="space-y-2">
            <Label htmlFor="wordCount">Target Word Count</Label>
            <div className="flex gap-2">
              <Input
                id="wordCount"
                type="number"
                min="500"
                max="5000"
                step="100"
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value))}
              />
              <div className="flex gap-1">
                {[1000, 1500, 2000, 2500].map((count) => (
                  <Button
                    key={count}
                    variant={wordCount === count ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWordCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Tone Selection */}
          <div className="space-y-2">
            <Label>Tone</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['professional', 'casual', 'authoritative', 'friendly'] as const).map((t) => (
                <Button
                  key={t}
                  variant={tone === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTone(t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Include:</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeIntro}
                  onChange={(e) => setIncludeIntro(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Introduction</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeConclusion}
                  onChange={(e) => setIncludeConclusion(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Conclusion</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeCTA}
                  onChange={(e) => setIncludeCTA(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Call-to-Action</span>
              </label>
            </div>
          </div>

          {/* Credit Cost Preview */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Credit Cost</span>
              </div>
              <Badge variant="outline" className="bg-white border-blue-300 text-blue-700">
                {creditCost} {creditCost === 1 ? 'credit' : 'credits'}
              </Badge>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              This {wordCount}-word blog post will use {creditCost} credits
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Generate Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleGenerateOutline}
              disabled={!keyword.trim() || generating}
              variant="outline"
              className="w-full"
            >
              {generating && showOutline ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Outline...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Preview Outline (Free)
                </>
              )}
            </Button>

            <Button
              onClick={handleGenerate}
              disabled={!keyword.trim() || generating}
              className="w-full"
            >
              {generating && !showOutline ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Blog Post...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Full Blog Post ({creditCost} credits)
                </>
              )}
            </Button>
          </div>

          {/* Business Context Info */}
          <div className="rounded-lg border bg-neutral-50 p-3 text-sm">
            <p className="font-medium mb-1">Business Context:</p>
            <p className="text-neutral-600">{clientName}</p>
            <p className="text-neutral-600">{service}</p>
            <p className="text-neutral-600">{location}</p>
          </div>
        </CardContent>
      </Card>

      {/* Preview/Output Panel */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>
            {showOutline && outline ? 'Outline Preview' : generatedContent ? 'Generated Content' : 'Preview'}
          </CardTitle>
          <CardDescription>
            {showOutline && outline
              ? 'Review the outline before generating full content'
              : generatedContent
              ? 'Edit, copy, or export your blog post'
              : 'Your generated content will appear here'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {showOutline && outline ? (
            // Outline Preview
            <div className="flex-1 space-y-4">
              <div className="rounded-lg border bg-white p-4 font-mono text-sm whitespace-pre-wrap flex-1 overflow-auto max-h-[600px]">
                {outline}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowOutline(false)} variant="outline" className="flex-1">
                  Back to Form
                </Button>
                <Button onClick={handleGenerate} className="flex-1">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Full Post
                </Button>
              </div>
            </div>
          ) : generatedContent ? (
            // Generated Content
            <div className="flex-1 space-y-4">
              <div className="rounded-lg border bg-white p-4 prose prose-sm max-w-none flex-1 overflow-auto max-h-[600px]">
                <div dangerouslySetInnerHTML={{ __html: generatedContent.replace(/\n/g, '<br />') }} />
              </div>

              {/* Export Options */}
              <div className="space-y-3">
                <Label>Export Options:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleCopy} variant="outline" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Send className="mr-2 h-4 w-4" />
                    Send to WordPress
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Send className="mr-2 h-4 w-4" />
                    Save to Drive
                  </Button>
                </div>

                <Button onClick={handleGenerate} variant="outline" className="w-full" size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            // Empty State
            <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <div className="space-y-3">
                <Sparkles className="h-12 w-12 mx-auto text-neutral-400" />
                <p className="text-neutral-600">
                  Configure your blog post settings and click "Generate" to create content
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
