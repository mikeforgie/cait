/**
 * SEO Action Logger
 * Track every SEO action taken to attribute results later
 */

import { createClient } from '@/lib/supabase/server';

export type SEOActionType =
  // On-Page Actions
  | 'meta_title_updated'
  | 'meta_description_updated'
  | 'heading_updated'
  | 'content_updated'
  | 'image_optimized'
  | 'schema_markup_added'
  | 'internal_link_added'
  | 'page_speed_improved'
  // Content Actions
  | 'blog_post_published'
  | 'blog_post_updated'
  | 'content_removed'
  | 'content_rewritten'
  // Off-Page Actions
  | 'backlink_acquired'
  | 'backlink_lost'
  | 'guest_post_published'
  | 'press_release_published'
  // Technical Actions
  | 'technical_issue_fixed'
  | 'site_speed_improved'
  | 'mobile_optimization'
  | 'https_implemented'
  | 'redirect_added'
  | 'canonical_added'
  // Other
  | 'keyword_targeted';

export type SEOActionCategory =
  | 'on_page'
  | 'content'
  | 'technical'
  | 'off_page';

export interface LogActionParams {
  clientId: string;
  actionType: SEOActionType;
  actionCategory: SEOActionCategory;

  // What was affected
  targetType: 'page' | 'keyword' | 'site' | 'image';
  targetId?: string;
  targetUrl?: string;

  // Action details (flexible JSONB field)
  actionDetails: {
    // For meta updates
    field?: string;
    oldValue?: string;
    newValue?: string;
    keywordTargeted?: string;

    // For content
    contentType?: string;
    wordCount?: number;
    keywordsTargeted?: string[];
    internalLinks?: string[];
    publishedUrl?: string;

    // For backlinks
    backlinkUrl?: string;
    anchorText?: string;
    linkType?: string;
    domainAuthority?: number;
    targetPage?: string;

    // For technical
    issueType?: string;
    improvement?: string;
    before?: any;
    after?: any;

    // Any other custom data
    [key: string]: any;
  };

  // Effort tracking
  timeInvestedMinutes?: number;
  costDollars?: number;
  automated?: boolean;
  performedBy?: 'ai' | 'user' | 'automation';
}

/**
 * Log an SEO action
 */
export async function logSEOAction(params: LogActionParams) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('seo_actions')
      .insert({
        client_id: params.clientId,
        action_type: params.actionType,
        action_category: params.actionCategory,
        target_type: params.targetType,
        target_id: params.targetId,
        target_url: params.targetUrl,
        action_details: params.actionDetails,
        time_invested_minutes: params.timeInvestedMinutes || 0,
        cost_dollars: params.costDollars || 0,
        automated: params.automated || false,
        performed_by: params.performedBy || 'user',
        executed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging SEO action:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to log SEO action:', error);
    return null;
  }
}

/**
 * Get actions for a client
 */
export async function getClientActions(
  clientId: string,
  options?: {
    targetUrl?: string;
    targetType?: string;
    actionCategory?: string;
    limit?: number;
    since?: Date;
  }
) {
  const supabase = await createClient();

  let query = supabase
    .from('seo_actions')
    .select('*')
    .eq('client_id', clientId)
    .order('executed_at', { ascending: false });

  if (options?.targetUrl) {
    query = query.eq('target_url', options.targetUrl);
  }

  if (options?.targetType) {
    query = query.eq('target_type', options.targetType);
  }

  if (options?.actionCategory) {
    query = query.eq('action_category', options.actionCategory);
  }

  if (options?.since) {
    query = query.gte('executed_at', options.since.toISOString());
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching client actions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get action statistics
 */
export async function getActionStats(clientId: string, since?: Date) {
  const supabase = await createClient();

  const startDate = since || new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const { data, error } = await supabase
    .from('seo_actions')
    .select('action_type, action_category, executed_at')
    .eq('client_id', clientId)
    .gte('executed_at', startDate.toISOString());

  if (error) {
    console.error('Error fetching action stats:', error);
    return {
      total: 0,
      by_category: {},
      by_type: {},
      by_date: {},
    };
  }

  const stats = {
    total: data.length,
    by_category: {} as Record<string, number>,
    by_type: {} as Record<string, number>,
    by_date: {} as Record<string, number>,
  };

  data.forEach(action => {
    // Count by category
    stats.by_category[action.action_category] =
      (stats.by_category[action.action_category] || 0) + 1;

    // Count by type
    stats.by_type[action.action_type] =
      (stats.by_type[action.action_type] || 0) + 1;

    // Count by date
    const date = action.executed_at.split('T')[0];
    stats.by_date[date] = (stats.by_date[date] || 0) + 1;
  });

  return stats;
}
