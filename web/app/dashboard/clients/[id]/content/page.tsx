import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BlogPostGenerator } from '@/components/content/blog-post-generator';
import { EmailOutreachGenerator } from '@/components/content/email-outreach-generator';
import { ContentTypeSelector } from '@/components/content/content-type-selector';

export default async function ContentGenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch client data
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Fetch top keywords for suggestions
  const { data: keywords } = await supabase
    .from('keywords')
    .select('keyword, search_volume, difficulty')
    .eq('client_id', id)
    .order('search_volume', { ascending: false })
    .limit(10);

  const suggestedKeywords = keywords?.map((k) => k.keyword) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">AI Content Studio</h1>
          <p className="text-neutral-600">{client.name}</p>
        </div>
        <Badge variant="default">AI Powered</Badge>
      </div>

      {/* Content Type Tabs/Selector */}
      <ContentTypeSelector />

      {/* Blog Post Generator */}
      <div id="blog-generator">
        <BlogPostGenerator
          clientId={id}
          clientName={client.name}
          service={client.focus_service || 'their business'}
          location={client.primary_location || 'their area'}
          suggestedKeywords={suggestedKeywords}
        />
      </div>

      {/* Email Outreach Generator */}
      <div id="email-generator" className="pt-12">
        <EmailOutreachGenerator
          clientId={id}
          clientName={client.name}
          clientWebsite={client.domain}
          service={client.focus_service || 'their business'}
          userName="Your Name" // TODO: Get from user profile
        />
      </div>

      {/* Usage Stats (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>AI Usage This Month</CardTitle>
          <CardDescription>Track your AI-powered content generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-neutral-600">Blog Posts</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Emails</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Meta Descriptions</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total AI Actions</p>
              <p className="text-2xl font-bold">0 / 500</p>
              <p className="text-xs text-neutral-600">Professional Plan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
