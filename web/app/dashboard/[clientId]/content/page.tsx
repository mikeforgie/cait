import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, FileText, Mail, Tag } from 'lucide-react';
import { BlogPostGenerator } from '@/components/content/blog-post-generator';
import { EmailOutreachGenerator } from '@/components/content/email-outreach-generator';
import { ContentLibrary } from '@/components/content/content-library';
import { getClientGeneratedContent, getContentStats } from '@/lib/ai/content-storage';
import { getClientUsage } from '@/lib/ai/usage-tracking';

export default async function ContentGenerationPage({
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

  // Fetch top keywords for suggestions
  const { data: keywords } = await supabase
    .from('keywords')
    .select('keyword, search_volume, difficulty')
    .eq('client_id', clientId)
    .order('search_volume', { ascending: false })
    .limit(10);

  const suggestedKeywords = keywords?.map((k) => k.keyword) || [];

  // Fetch generated content history
  const generatedContent = await getClientGeneratedContent(clientId);

  // Get content stats
  const contentStats = await getContentStats(clientId);

  // Get usage information
  const usage = await getClientUsage(clientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${clientId}`}>
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
      <Card>
        <CardHeader>
          <CardTitle>What would you like to create?</CardTitle>
          <CardDescription>
            Choose a content type to get started with AI-powered generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button
              className="p-4 text-left rounded-lg border border-neutral-900 bg-neutral-50 transition-colors hover:bg-neutral-100"
              onClick={() => {
                document.getElementById('blog-generator')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <FileText className="h-8 w-8 mb-2" />
              <p className="font-medium">Blog Post</p>
              <p className="text-sm text-neutral-600 mt-1">
                SEO-optimized long-form content for your target keywords
              </p>
            </button>

            <button
              className="p-4 text-left rounded-lg border border-neutral-200 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
              onClick={() => {
                document.getElementById('email-generator')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Mail className="h-8 w-8 mb-2" />
              <p className="font-medium">Outreach Email</p>
              <p className="text-sm text-neutral-600 mt-1">
                Personalized emails for backlink building and partnerships
              </p>
            </button>

            <button
              className="p-4 text-left rounded-lg border border-neutral-200 transition-colors hover:border-neutral-300 hover:bg-neutral-50 opacity-50 cursor-not-allowed"
              disabled
            >
              <Tag className="h-8 w-8 mb-2" />
              <p className="font-medium">Meta Descriptions</p>
              <p className="text-sm text-neutral-600 mt-1">
                Click-worthy meta tags optimized for CTR (Coming Soon)
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Blog Post Generator */}
      <div id="blog-generator">
        <BlogPostGenerator
          clientId={clientId}
          clientName={client.name}
          service={client.focus_service || 'their business'}
          location={client.primary_location || 'their area'}
          suggestedKeywords={suggestedKeywords}
        />
      </div>

      {/* Email Outreach Generator */}
      <div id="email-generator" className="pt-12">
        <EmailOutreachGenerator
          clientId={clientId}
          clientName={client.name}
          clientWebsite={client.domain}
          service={client.focus_service || 'their business'}
          userName="Your Name" // TODO: Get from user profile
        />
      </div>

      {/* Content Library */}
      {generatedContent.length > 0 && (
        <div className="pt-12">
          <h2 className="text-2xl font-bold mb-6">Content Library</h2>
          <ContentLibrary
            initialContent={generatedContent}
            clientId={clientId}
          />
        </div>
      )}

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>AI Usage This Month</CardTitle>
          <CardDescription>Track your AI credit usage and content generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-neutral-600">Blog Posts</p>
              <p className="text-2xl font-bold">{contentStats.blog_posts}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Emails</p>
              <p className="text-2xl font-bold">{contentStats.emails}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Meta Descriptions</p>
              <p className="text-2xl font-bold">{contentStats.meta_descriptions}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600">Credits Used</p>
              <p className="text-2xl font-bold">
                {usage?.current_month_usage || 0} / {usage?.monthly_limit || 500}
              </p>
              <p className="text-xs text-neutral-600 capitalize">
                {usage?.plan_tier || 'Professional'} Plan
              </p>
              {usage && usage.usage_percentage > 80 && (
                <p className="text-xs text-orange-600 mt-1">
                  {usage.remaining} credits remaining
                </p>
              )}
            </div>
          </div>

          {/* Credit Cost Reference */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-neutral-700 mb-2">Credit Costs:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-neutral-600">
              <div>
                <span className="font-medium">Blog (1500w):</span> 8 credits
              </div>
              <div>
                <span className="font-medium">Email:</span> 2 credits
              </div>
              <div>
                <span className="font-medium">Outline:</span> 1 credit
              </div>
              <div>
                <span className="font-medium">Chat:</span> 1 credit
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              💡 Longer blog posts use more credits. 1 credit ≈ 5,000 AI tokens
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
