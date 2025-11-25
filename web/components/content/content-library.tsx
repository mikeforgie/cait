'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Trash2, FileText, Mail, Tag, Calendar } from 'lucide-react';
import type { GeneratedContent } from '@/lib/ai/content-storage';

interface ContentLibraryProps {
  initialContent: GeneratedContent[];
  clientId: string;
}

export function ContentLibrary({ initialContent, clientId }: ContentLibraryProps) {
  const [content, setContent] = useState(initialContent);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);

  const filteredContent = selectedType === 'all'
    ? content
    : content.filter(c => c.content_type === selectedType);

  const contentTypeCounts = {
    all: content.length,
    blog_post: content.filter(c => c.content_type === 'blog_post').length,
    outreach_email: content.filter(c => c.content_type === 'outreach_email').length,
    meta_description: content.filter(c => c.content_type === 'meta_description').length,
  };

  const handleCopy = (item: GeneratedContent) => {
    navigator.clipboard.writeText(item.content);
    // TODO: Show toast
  };

  const handleDownload = (item: GeneratedContent) => {
    const blob = new Blob([item.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title || 'content'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await fetch(`/api/ai/content/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setContent(content.filter(c => c.id !== itemId));
        if (selectedContent?.id === itemId) {
          setSelectedContent(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'blog_post':
        return <FileText className="h-4 w-4" />;
      case 'outreach_email':
        return <Mail className="h-4 w-4" />;
      case 'meta_description':
        return <Tag className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatContentType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Content List */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Content Library</CardTitle>
          <CardDescription>
            All your AI-generated content in one place
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
            >
              All ({contentTypeCounts.all})
            </Button>
            <Button
              variant={selectedType === 'blog_post' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('blog_post')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Blog Posts ({contentTypeCounts.blog_post})
            </Button>
            <Button
              variant={selectedType === 'outreach_email' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('outreach_email')}
            >
              <Mail className="mr-2 h-4 w-4" />
              Emails ({contentTypeCounts.outreach_email})
            </Button>
            <Button
              variant={selectedType === 'meta_description' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('meta_description')}
              disabled={contentTypeCounts.meta_description === 0}
            >
              <Tag className="mr-2 h-4 w-4" />
              Meta ({contentTypeCounts.meta_description})
            </Button>
          </div>

          {/* Content List */}
          <div className="flex-1 space-y-2 overflow-auto max-h-[600px]">
            {filteredContent.length === 0 ? (
              <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg p-8 text-center">
                <div className="space-y-2">
                  <p className="text-neutral-600">
                    {selectedType === 'all'
                      ? 'No content generated yet'
                      : `No ${formatContentType(selectedType).toLowerCase()} found`}
                  </p>
                  <p className="text-sm text-neutral-500">
                    Generate content above to see it here
                  </p>
                </div>
              </div>
            ) : (
              filteredContent.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedContent(item)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedContent?.id === item.id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getContentIcon(item.content_type)}
                        <p className="font-medium text-sm truncate">
                          {item.title || 'Untitled'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                        {item.metadata?.keyword && (
                          <>
                            <span>•</span>
                            <span className="truncate">{item.metadata.keyword}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {item.used && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Used
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>
            {selectedContent ? 'Preview' : 'Select Content'}
          </CardTitle>
          <CardDescription>
            {selectedContent
              ? formatContentType(selectedContent.content_type)
              : 'Click on an item to view its content'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {selectedContent ? (
            <div className="flex-1 space-y-4">
              {/* Metadata */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Calendar className="h-4 w-4" />
                  Created: {new Date(selectedContent.created_at).toLocaleString()}
                </div>
                {selectedContent.metadata && Object.keys(selectedContent.metadata).length > 0 && (
                  <div className="rounded-lg border bg-neutral-50 p-3 text-sm">
                    <p className="font-medium mb-2">Details:</p>
                    <div className="space-y-1 text-neutral-600">
                      {selectedContent.metadata.keyword && (
                        <p>Keyword: {selectedContent.metadata.keyword}</p>
                      )}
                      {selectedContent.metadata.tone && (
                        <p>Tone: {selectedContent.metadata.tone}</p>
                      )}
                      {selectedContent.metadata.wordCount && (
                        <p>Target Words: {selectedContent.metadata.wordCount}</p>
                      )}
                      {selectedContent.metadata.recipientWebsite && (
                        <p>Recipient: {selectedContent.metadata.recipientWebsite}</p>
                      )}
                      {selectedContent.metadata.approach && (
                        <p>Approach: {formatContentType(selectedContent.metadata.approach)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 rounded-lg border bg-white p-4 overflow-auto max-h-[400px]">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-sm">
                  {selectedContent.content}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleCopy(selectedContent)}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    onClick={() => handleDownload(selectedContent)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                <Button
                  onClick={() => handleDelete(selectedContent.id)}
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <p className="text-neutral-600">
                Select content from the library to view and manage it
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
