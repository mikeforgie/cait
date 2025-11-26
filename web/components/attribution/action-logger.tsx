'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, CheckCircle2 } from 'lucide-react';

interface ActionLoggerProps {
  clientId: string;
  clientWebsite: string;
}

export function ActionLogger({ clientId, clientWebsite }: ActionLoggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [actionCategory, setActionCategory] = useState<string>('off_page');
  const [actionType, setActionType] = useState<string>('backlink_acquired');
  const [targetUrl, setTargetUrl] = useState('');
  const [description, setDescription] = useState('');

  // Backlink-specific fields
  const [backlinkUrl, setBacklinkUrl] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [domainAuthority, setDomainAuthority] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const actionDetails: any = {
        description,
      };

      // Add category-specific details
      if (actionCategory === 'off_page' && actionType === 'backlink_acquired') {
        actionDetails.backlinkUrl = backlinkUrl;
        actionDetails.anchorText = anchorText;
        actionDetails.domainAuthority = domainAuthority ? parseInt(domainAuthority) : undefined;
      }

      const response = await fetch('/api/attribution/log-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          actionCategory,
          actionType,
          targetUrl,
          actionDetails,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log action');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Failed to log action:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTargetUrl('');
    setDescription('');
    setBacklinkUrl('');
    setAnchorText('');
    setDomainAuthority('');
  };

  if (!isOpen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Log SEO Action</CardTitle>
          <CardDescription>
            Manually track backlinks, content updates, technical fixes, and other SEO activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsOpen(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Log New Action
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log SEO Action</CardTitle>
        <CardDescription>Track any SEO activity for attribution analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={actionCategory} onValueChange={setActionCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off_page">Off-Page (Backlinks)</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="on_page">On-Page</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Action Type</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionCategory === 'off_page' && (
                    <>
                      <SelectItem value="backlink_acquired">Backlink Acquired</SelectItem>
                      <SelectItem value="guest_post_published">Guest Post Published</SelectItem>
                      <SelectItem value="press_release_published">Press Release</SelectItem>
                    </>
                  )}
                  {actionCategory === 'content' && (
                    <>
                      <SelectItem value="blog_post_published">Blog Post Published</SelectItem>
                      <SelectItem value="content_updated">Content Updated</SelectItem>
                    </>
                  )}
                  {actionCategory === 'on_page' && (
                    <>
                      <SelectItem value="meta_title_updated">Meta Title Updated</SelectItem>
                      <SelectItem value="meta_description_updated">Meta Description Updated</SelectItem>
                      <SelectItem value="internal_link_added">Internal Link Added</SelectItem>
                    </>
                  )}
                  {actionCategory === 'technical' && (
                    <>
                      <SelectItem value="technical_issue_fixed">Technical Issue Fixed</SelectItem>
                      <SelectItem value="site_speed_improved">Site Speed Improved</SelectItem>
                      <SelectItem value="https_implemented">HTTPS Implemented</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUrl">Target Page URL</Label>
            <Input
              id="targetUrl"
              type="url"
              placeholder={`${clientWebsite}/page-url`}
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
            />
            <p className="text-xs text-neutral-600">The page this action affects</p>
          </div>

          {actionType === 'backlink_acquired' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="backlinkUrl">Backlink Source URL</Label>
                <Input
                  id="backlinkUrl"
                  type="url"
                  placeholder="https://example.com/article"
                  value={backlinkUrl}
                  onChange={(e) => setBacklinkUrl(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="anchorText">Anchor Text</Label>
                  <Input
                    id="anchorText"
                    placeholder="best seo tools"
                    value={anchorText}
                    onChange={(e) => setAnchorText(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domainAuthority">Domain Authority (Optional)</Label>
                  <Input
                    id="domainAuthority"
                    type="number"
                    placeholder="45"
                    value={domainAuthority}
                    onChange={(e) => setDomainAuthority(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional notes about this action..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || success} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Logged!
                </>
              ) : (
                'Log Action'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
