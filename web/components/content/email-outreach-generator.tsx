'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Send, Loader2, Mail, Coins } from 'lucide-react';
import { CREDIT_COSTS } from '@/lib/ai/credits';

interface EmailOutreachGeneratorProps {
  clientId: string;
  clientName: string;
  clientWebsite: string;
  service: string;
  userName?: string;
}

export function EmailOutreachGenerator({
  clientId,
  clientName,
  clientWebsite,
  service,
  userName = 'Your Name',
}: EmailOutreachGeneratorProps) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientWebsite, setRecipientWebsite] = useState('');
  const [linkTarget, setLinkTarget] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'friendly'>('professional');
  const [approach, setApproach] = useState<'guest_post' | 'resource_link' | 'broken_link' | 'collaboration'>('guest_post');

  const [generating, setGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!recipientWebsite.trim() || !linkTarget.trim()) return;

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          recipientName: recipientName || undefined,
          recipientWebsite,
          yourName: userName,
          yourWebsite: clientWebsite,
          yourBusiness: `${clientName} - ${service}`,
          linkTarget,
          tone,
          approach,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle credit limit errors
        if (data.error === 'Insufficient credits' || data.error === 'Monthly credit limit reached') {
          setError(data.message || data.error);
        } else {
          setError(data.error || 'Failed to generate email');
        }
        return;
      }

      // Parse subject line from generated content
      const lines = data.content.split('\n');
      const subjectLineMatch = lines[0].match(/Subject:\s*(.+)/i);
      if (subjectLineMatch) {
        setSubjectLine(subjectLineMatch[1]);
        setGeneratedEmail(lines.slice(1).join('\n').trim());
      } else {
        setGeneratedEmail(data.content);
      }
      setError('');
    } catch (error) {
      console.error('Failed to generate email:', error);
      setError('Failed to generate email. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    const fullEmail = subjectLine ? `Subject: ${subjectLine}\n\n${generatedEmail}` : generatedEmail;
    navigator.clipboard.writeText(fullEmail);
    // TODO: Show toast notification
  };

  const handleSendEmail = () => {
    // TODO: Implement email sending via Gmail API or user's email client
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(generatedEmail)}`;
    window.location.href = mailtoLink;
  };

  const approachDescriptions = {
    guest_post: 'Offer to write a guest post for their website',
    resource_link: 'Suggest your content as a resource to add to their page',
    broken_link: 'Notify them of a broken link and offer your content as replacement',
    collaboration: 'Propose a content collaboration or partnership',
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Email Outreach Generator</CardTitle>
          <CardDescription>
            Create personalized outreach emails for link building
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Approach Selection */}
          <div className="space-y-2">
            <Label>Outreach Approach *</Label>
            <div className="grid gap-2">
              {(Object.keys(approachDescriptions) as Array<keyof typeof approachDescriptions>).map((a) => (
                <button
                  key={a}
                  onClick={() => setApproach(a)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    approach === a
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <p className="font-medium text-sm capitalize">
                    {a.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {approachDescriptions[a]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientWebsite">Recipient Website *</Label>
              <Input
                id="recipientWebsite"
                type="url"
                placeholder="https://example.com"
                value={recipientWebsite}
                onChange={(e) => setRecipientWebsite(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
              <Input
                id="recipientName"
                placeholder="e.g., John Smith"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
              <p className="text-xs text-neutral-600">
                Leave blank if you don't know their name - AI will write without it
              </p>
            </div>
          </div>

          {/* Link Target */}
          <div className="space-y-2">
            <Label htmlFor="linkTarget">Your Target Page (for backlink) *</Label>
            <Input
              id="linkTarget"
              type="url"
              placeholder="https://yoursite.com/page-to-link"
              value={linkTarget}
              onChange={(e) => setLinkTarget(e.target.value)}
            />
            <p className="text-xs text-neutral-600">
              The page you want them to link to
            </p>
          </div>

          {/* Tone Selection */}
          <div className="space-y-2">
            <Label>Email Tone</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['professional', 'casual', 'friendly'] as const).map((t) => (
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

          {/* Credit Cost Preview */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Credit Cost</span>
              </div>
              <Badge variant="outline" className="bg-white border-blue-300 text-blue-700">
                {CREDIT_COSTS.outreach_email} credits
              </Badge>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Each outreach email uses {CREDIT_COSTS.outreach_email} credits
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!recipientWebsite.trim() || !linkTarget.trim() || generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Email...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Outreach Email ({CREDIT_COSTS.outreach_email} credits)
              </>
            )}
          </Button>

          {/* Your Details (for reference) */}
          <div className="rounded-lg border bg-neutral-50 p-3 text-sm space-y-1">
            <p className="font-medium">Your Details:</p>
            <p className="text-neutral-600">Name: {userName}</p>
            <p className="text-neutral-600">Website: {clientWebsite}</p>
            <p className="text-neutral-600">Business: {clientName}</p>
          </div>
        </CardContent>
      </Card>

      {/* Preview/Output Panel */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{generatedEmail ? 'Generated Email' : 'Preview'}</CardTitle>
          <CardDescription>
            {generatedEmail
              ? 'Review, edit, and send your outreach email'
              : 'Your generated email will appear here'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {generatedEmail ? (
            <div className="flex-1 space-y-4">
              {/* Subject Line */}
              {subjectLine && (
                <div className="space-y-2">
                  <Label>Subject Line:</Label>
                  <div className="rounded-lg border bg-neutral-50 p-3 font-medium text-sm">
                    {subjectLine}
                  </div>
                </div>
              )}

              {/* Email Body */}
              <div className="space-y-2 flex-1">
                <Label>Email Body:</Label>
                <div className="rounded-lg border bg-white p-4 text-sm whitespace-pre-wrap flex-1 overflow-auto max-h-[400px] font-mono">
                  {generatedEmail}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Label>Actions:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleCopy} variant="outline" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                  <Button onClick={handleSendEmail} variant="outline" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Open in Email
                  </Button>
                  <Button variant="outline" size="sm" disabled className="col-span-2">
                    <Send className="mr-2 h-4 w-4" />
                    Send via Gmail (Coming Soon)
                  </Button>
                </div>
                <Button onClick={handleGenerate} variant="outline" className="w-full" size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate Different Version
                </Button>
              </div>

              {/* Tips */}
              <div className="rounded-lg border bg-blue-50 p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">💡 Tips:</p>
                <ul className="text-blue-800 space-y-1 text-xs list-disc list-inside">
                  <li>Personalize further before sending</li>
                  <li>Verify recipient's email address</li>
                  <li>Follow up if no response in 5-7 days</li>
                  <li>Track responses and success rate</li>
                </ul>
              </div>
            </div>
          ) : (
            // Empty State
            <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <div className="space-y-3">
                <Mail className="h-12 w-12 mx-auto text-neutral-400" />
                <p className="text-neutral-600">
                  Fill in the recipient details and click "Generate" to create a personalized outreach email
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
