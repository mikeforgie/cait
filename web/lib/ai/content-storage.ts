/**
 * AI Content Database Functions
 * Functions for saving, retrieving, and managing AI-generated content
 */

import { createClient } from '@/lib/supabase/server';
import { logSEOAction, type SEOActionType, type SEOActionCategory } from '@/lib/attribution/action-logger';

export interface GeneratedContent {
  id: string;
  client_id: string;
  content_type: 'blog_post' | 'outreach_email' | 'meta_description' | 'social_post';
  title?: string;
  content: string;
  prompt: string;
  model_used: string;
  metadata: any;
  used: boolean;
  used_at?: string;
  usage_location?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveContentParams {
  clientId: string;
  contentType: GeneratedContent['content_type'];
  title?: string;
  content: string;
  prompt: string;
  modelUsed: string;
  metadata?: any;
}

/**
 * Save generated content to database
 */
export async function saveGeneratedContent(params: SaveContentParams): Promise<GeneratedContent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_generated_content')
    .insert({
      client_id: params.clientId,
      content_type: params.contentType,
      title: params.title,
      content: params.content,
      prompt: params.prompt,
      model_used: params.modelUsed,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving generated content:', error);
    return null;
  }

  return data;
}

/**
 * Get generated content by ID
 */
export async function getGeneratedContent(contentId: string): Promise<GeneratedContent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_generated_content')
    .select('*')
    .eq('id', contentId)
    .single();

  if (error) {
    console.error('Error fetching generated content:', error);
    return null;
  }

  return data;
}

/**
 * Get all generated content for a client
 */
export async function getClientGeneratedContent(
  clientId: string,
  contentType?: GeneratedContent['content_type'],
  limit: number = 50
): Promise<GeneratedContent[]> {
  const supabase = await createClient();

  let query = supabase
    .from('ai_generated_content')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching client content:', error);
    return [];
  }

  return data || [];
}

/**
 * Mark content as used
 */
export async function markContentAsUsed(
  contentId: string,
  usageLocation: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ai_generated_content')
    .update({
      used: true,
      used_at: new Date().toISOString(),
      usage_location: usageLocation,
    })
    .eq('id', contentId);

  if (error) {
    console.error('Error marking content as used:', error);
    return false;
  }

  return true;
}

/**
 * Mark content as published and log as SEO action
 */
export async function markContentAsPublished(params: {
  contentId: string;
  clientId: string;
  usageLocation: string;
  publishedUrl?: string;
}): Promise<GeneratedContent | null> {
  const supabase = await createClient();

  try {
    // Get the content first to log proper action
    const { data: content, error: fetchError } = await supabase
      .from('ai_generated_content')
      .select('*')
      .eq('id', params.contentId)
      .single();

    if (fetchError || !content) {
      console.error('Error fetching content for publishing:', fetchError);
      return null;
    }

    // Update content as used
    const { data: updatedContent, error: updateError } = await supabase
      .from('ai_generated_content')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        usage_location: params.usageLocation,
      })
      .eq('id', params.contentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error marking content as published:', updateError);
      return null;
    }

    // Log as SEO action
    await logContentPublishAction(
      content,
      params.clientId,
      params.publishedUrl
    );

    return updatedContent;
  } catch (error) {
    console.error('Failed to mark content as published:', error);
    return null;
  }
}

/**
 * Log content publication as SEO action
 */
async function logContentPublishAction(
  content: GeneratedContent,
  clientId: string,
  publishedUrl?: string
) {
  // Determine action type based on content type
  let actionType: SEOActionType;
  let actionCategory: SEOActionCategory;
  let targetType: 'page' | 'keyword' | 'site' | 'image' = 'page';

  switch (content.content_type) {
    case 'blog_post':
      actionType = 'blog_post_published';
      actionCategory = 'content';
      break;
    case 'outreach_email':
      actionType = 'guest_post_published'; // Outreach for backlinks
      actionCategory = 'off_page';
      targetType = 'site';
      break;
    case 'meta_description':
      actionType = 'meta_description_updated';
      actionCategory = 'on_page';
      break;
    default:
      return; // Don't log unknown types
  }

  const metadata = content.metadata || {};

  await logSEOAction({
    clientId,
    actionType,
    actionCategory,
    targetType,
    targetUrl: publishedUrl || metadata.targetUrl,
    actionDetails: {
      contentType: content.content_type,
      title: content.title,
      wordCount: metadata.wordCount,
      keywordsTargeted: metadata.keyword ? [metadata.keyword] : [],
      publishedUrl,
      automated: true,
      generatedAt: content.created_at,
      publishedAt: new Date().toISOString(),
      aiGenerated: true,
      ...metadata,
    },
    automated: true,
    performedBy: 'ai',
    timeInvestedMinutes: estimateTimeInvested(content.content_type, metadata.wordCount),
  });
}

/**
 * Estimate time that would have been invested manually
 */
function estimateTimeInvested(contentType: string, wordCount?: number): number {
  switch (contentType) {
    case 'blog_post':
      // Estimate 1 hour per 500 words for manual writing
      return Math.ceil((wordCount || 1500) / 500) * 60;
    case 'outreach_email':
      // 15 minutes to research and write personalized email
      return 15;
    case 'meta_description':
      // 5 minutes per meta description
      return 5;
    default:
      return 10;
  }
}

/**
 * Delete generated content
 */
export async function deleteGeneratedContent(contentId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ai_generated_content')
    .delete()
    .eq('id', contentId);

  if (error) {
    console.error('Error deleting generated content:', error);
    return false;
  }

  return true;
}

/**
 * Get content generation stats for a client
 */
export async function getContentStats(clientId: string, month?: string) {
  const supabase = await createClient();

  // If month not specified, use current month
  const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data, error } = await supabase
    .from('ai_generated_content')
    .select('content_type, created_at')
    .eq('client_id', clientId)
    .gte('created_at', `${targetMonth}-01`)
    .lt('created_at', `${targetMonth}-32`); // Covers end of month

  if (error) {
    console.error('Error fetching content stats:', error);
    return {
      total: 0,
      blog_posts: 0,
      emails: 0,
      meta_descriptions: 0,
      social_posts: 0,
    };
  }

  const stats = {
    total: data.length,
    blog_posts: data.filter(d => d.content_type === 'blog_post').length,
    emails: data.filter(d => d.content_type === 'outreach_email').length,
    meta_descriptions: data.filter(d => d.content_type === 'meta_description').length,
    social_posts: data.filter(d => d.content_type === 'social_post').length,
  };

  return stats;
}
