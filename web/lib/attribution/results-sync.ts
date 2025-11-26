/**
 * Results Sync Library
 * Transforms GA4 and ranking data into seo_results for attribution analysis
 */

import { createClient } from '@/lib/supabase/server';
import type { GA4PageData, GA4SourceData } from '@/lib/services/ga4';

/**
 * Detect if traffic source is from AI platforms
 */
export function detectAITrafficSource(source: string, medium: string): string | null {
  const sourceLower = source.toLowerCase();
  const mediumLower = medium.toLowerCase();

  // ChatGPT detection
  if (sourceLower.includes('chat.openai') || sourceLower.includes('chatgpt')) {
    return 'chatgpt';
  }

  // Perplexity detection
  if (sourceLower.includes('perplexity')) {
    return 'perplexity';
  }

  // Claude detection
  if (sourceLower.includes('claude.ai') || sourceLower.includes('anthropic')) {
    return 'claude';
  }

  // Gemini detection
  if (sourceLower.includes('gemini') || sourceLower.includes('bard')) {
    return 'gemini';
  }

  // SearchGPT detection
  if (sourceLower.includes('searchgpt')) {
    return 'searchgpt';
  }

  // You.com detection
  if (sourceLower.includes('you.com')) {
    return 'you_com';
  }

  return null;
}

/**
 * Sync GA4 page traffic data to seo_results
 */
export async function syncGA4TrafficResults(
  clientId: string,
  pages: GA4PageData[],
  dateRange: { startDate: string; endDate: string }
) {
  const supabase = await createClient();

  const results = [];

  for (const page of pages) {
    // Get previous traffic for this page to calculate change
    const { data: previousResult } = await supabase
      .from('seo_results')
      .select('metric_value')
      .eq('client_id', clientId)
      .eq('target_url', page.pagePath)
      .eq('result_type', 'traffic_increase')
      .eq('metric_name', 'pageviews')
      .order('measured_at', { ascending: false })
      .limit(1)
      .single();

    const previousValue = previousResult?.metric_value || 0;
    const currentValue = page.screenPageViews;
    const changeAmount = currentValue - previousValue;
    const changePercent = previousValue > 0 ? ((changeAmount / previousValue) * 100) : 0;

    // Only log if there's a significant change (>10%) or it's the first check
    if (Math.abs(changePercent) > 10 || !previousResult) {
      const { data: result, error } = await supabase
        .from('seo_results')
        .insert({
          client_id: clientId,
          result_type: changeAmount >= 0 ? 'traffic_increase' : 'traffic_decrease',
          target_type: 'page',
          target_url: page.pagePath,
          metric_name: 'pageviews',
          metric_value: currentValue,
          previous_value: previousValue,
          change_amount: changeAmount,
          change_percent: changePercent,
          traffic_source: 'google_organic',
          source_details: {
            pageTitle: page.pageTitle,
            avgTimeOnPage: page.avgTimeOnPage,
            bounceRate: page.bounceRate,
            dateRange,
          },
          measured_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && result) {
        results.push(result);
      }
    }
  }

  return results;
}

/**
 * Sync GA4 AI traffic sources to seo_results
 */
export async function syncAITrafficResults(
  clientId: string,
  sources: GA4SourceData[],
  dateRange: { startDate: string; endDate: string }
) {
  const supabase = await createClient();

  const results = [];

  for (const source of sources) {
    const aiPlatform = detectAITrafficSource(source.source, source.medium);

    if (aiPlatform) {
      // Log AI traffic as a result
      const { data: result, error } = await supabase
        .from('seo_results')
        .insert({
          client_id: clientId,
          result_type: 'traffic_increase',
          target_type: 'site',
          metric_name: 'ai_traffic',
          metric_value: source.users,
          traffic_source: aiPlatform,
          source_details: {
            source: source.source,
            medium: source.medium,
            sessions: source.sessions,
            bounceRate: source.bounceRate,
            dateRange,
          },
          measured_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && result) {
        results.push(result);
      }
    }
  }

  return results;
}

/**
 * Sync ranking check results to seo_results
 */
export async function syncRankingResults(
  clientId: string,
  rankingChecks: Array<{
    keyword: string;
    position: number | null;
    targetUrl: string;
    previousPosition?: number;
  }>
) {
  const supabase = await createClient();

  const results = [];

  for (const check of rankingChecks) {
    const { keyword, position, targetUrl, previousPosition } = check;

    // Skip if not ranking
    if (position === null) continue;

    // Calculate change
    const changeAmount = previousPosition ? (previousPosition - position) : 0; // Positive = improved (lower number is better)
    const changePercent = previousPosition && previousPosition > 0
      ? ((changeAmount / previousPosition) * 100)
      : 0;

    // Only log significant ranking changes (>3 positions) or new rankings
    if (Math.abs(changeAmount) > 3 || !previousPosition) {
      const { data: result, error } = await supabase
        .from('seo_results')
        .insert({
          client_id: clientId,
          result_type: 'ranking_change',
          target_type: 'keyword',
          target_id: keyword,
          target_url: targetUrl,
          metric_name: 'position',
          metric_value: position,
          previous_value: previousPosition || null,
          change_amount: changeAmount,
          change_percent: changePercent,
          traffic_source: 'google_organic',
          source_details: {
            keyword,
            improved: changeAmount > 0,
          },
          measured_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && result) {
        results.push(result);
      }
    }
  }

  return results;
}

/**
 * Get AI traffic summary for a client
 */
export async function getAITrafficSummary(clientId: string, days: number = 30) {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('seo_results')
    .select('traffic_source, metric_value')
    .eq('client_id', clientId)
    .eq('metric_name', 'ai_traffic')
    .gte('measured_at', startDate.toISOString());

  if (error) {
    console.error('Error fetching AI traffic summary:', error);
    return [];
  }

  // Aggregate by AI platform
  const summary: Record<string, number> = {};
  data.forEach((result) => {
    const platform = result.traffic_source || 'unknown';
    summary[platform] = (summary[platform] || 0) + (result.metric_value || 0);
  });

  return Object.entries(summary).map(([platform, users]) => ({
    platform,
    users,
  }));
}
