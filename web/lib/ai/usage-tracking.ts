/**
 * AI Usage Tracking
 * Track AI usage for billing, limits, and analytics
 */

import { createClient } from '@/lib/supabase/server';
import { estimateTokens, estimateCost } from './anthropic-client';
import type { AIModelType } from './anthropic-client';
import { calculateCredits, creditsFromTokens } from './credits';

export interface UsageRecord {
  id: string;
  client_id: string;
  action_type: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_cents: number;
  context: any;
  created_at: string;
  date: string;
}

export interface ClientUsage {
  monthly_limit: number;
  current_month_usage: number;
  usage_percentage: number;
  remaining: number;
  plan_tier: string;
}

/**
 * Track AI usage
 */
export async function trackAIUsage(params: {
  clientId: string;
  actionType: string;
  modelType: AIModelType;
  inputText: string;
  outputText: string;
  context?: any;
  credits?: number; // Optional: pre-calculated credits
}): Promise<{ credits: number; success: boolean }> {
  const supabase = await createClient();

  // Estimate tokens
  const inputTokens = estimateTokens(params.inputText);
  const outputTokens = estimateTokens(params.outputText);
  const totalTokens = inputTokens + outputTokens;

  // Calculate credits
  // Use pre-calculated credits if provided, otherwise calculate from tokens or context
  let credits = params.credits;
  if (!credits) {
    if (params.context?.wordCount) {
      credits = calculateCredits({
        actionType: params.actionType,
        wordCount: params.context.wordCount,
      });
    } else {
      credits = creditsFromTokens(inputTokens, outputTokens);
    }
  }

  // Estimate cost
  const costDollars = estimateCost(inputTokens, outputTokens, params.modelType);
  const costCents = Math.ceil(costDollars * 100);

  // Get model name
  const modelUsed = params.modelType === 'chat'
    ? 'claude-3-5-haiku-20241022'
    : 'claude-3-5-sonnet-20241022';

  // Save usage record
  const { error } = await supabase
    .from('ai_usage_tracking')
    .insert({
      client_id: params.clientId,
      action_type: params.actionType,
      model_used: modelUsed,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      estimated_cost_cents: costCents,
      context: params.context || {},
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });

  if (error) {
    console.error('Error tracking AI usage:', error);
    return { credits, success: false };
  }

  // Increment client's monthly usage counter by credits used
  await incrementClientUsage(params.clientId, credits);

  return { credits, success: true };
}

/**
 * Increment client's monthly usage counter by credits
 */
async function incrementClientUsage(clientId: string, credits: number): Promise<void> {
  const supabase = await createClient();

  // Get or create client AI settings
  const { data: settings } = await supabase
    .from('client_ai_settings')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (!settings) {
    // Create default settings
    await supabase.from('client_ai_settings').insert({
      client_id: clientId,
      plan_tier: 'professional',
      monthly_limit: 500,
      current_month_usage: credits,
    });
  } else {
    // Increment usage by credits
    await supabase
      .from('client_ai_settings')
      .update({
        current_month_usage: (settings.current_month_usage || 0) + credits,
      })
      .eq('client_id', clientId);
  }
}

/**
 * Get client's current usage and limits
 */
export async function getClientUsage(clientId: string): Promise<ClientUsage | null> {
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from('client_ai_settings')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error || !settings) {
    // Return default if not found
    return {
      monthly_limit: 500,
      current_month_usage: 0,
      usage_percentage: 0,
      remaining: 500,
      plan_tier: 'professional',
    };
  }

  const usage = settings.current_month_usage || 0;
  const limit = settings.monthly_limit || 500;

  return {
    monthly_limit: limit,
    current_month_usage: usage,
    usage_percentage: limit > 0 ? (usage / limit) * 100 : 0,
    remaining: Math.max(0, limit - usage),
    plan_tier: settings.plan_tier || 'professional',
  };
}

/**
 * Check if client has reached usage limit
 */
export async function checkUsageLimit(clientId: string): Promise<{
  allowed: boolean;
  usage: ClientUsage;
}> {
  const usage = await getClientUsage(clientId);

  if (!usage) {
    return { allowed: true, usage: { monthly_limit: 500, current_month_usage: 0, usage_percentage: 0, remaining: 500, plan_tier: 'professional' } };
  }

  // Enterprise plan has unlimited usage
  if (usage.plan_tier === 'enterprise' || usage.monthly_limit === -1) {
    return { allowed: true, usage };
  }

  // Check if under limit
  const allowed = usage.current_month_usage < usage.monthly_limit;

  return { allowed, usage };
}

/**
 * Get usage statistics for a time period
 */
export async function getUsageStats(
  clientId: string,
  startDate?: string,
  endDate?: string
) {
  const supabase = await createClient();

  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('ai_usage_tracking')
    .select('*')
    .eq('client_id', clientId)
    .gte('date', start)
    .lte('date', end)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching usage stats:', error);
    return {
      total_actions: 0,
      total_tokens: 0,
      total_cost_cents: 0,
      by_action_type: {},
      by_date: {},
    };
  }

  // Aggregate stats
  const stats = {
    total_actions: data.length,
    total_tokens: data.reduce((sum, r) => sum + (r.total_tokens || 0), 0),
    total_cost_cents: data.reduce((sum, r) => sum + (r.estimated_cost_cents || 0), 0),
    by_action_type: {} as Record<string, number>,
    by_date: {} as Record<string, number>,
  };

  // Count by action type
  data.forEach(record => {
    stats.by_action_type[record.action_type] = (stats.by_action_type[record.action_type] || 0) + 1;
    stats.by_date[record.date] = (stats.by_date[record.date] || 0) + 1;
  });

  return stats;
}

/**
 * Reset monthly usage (called via cron job on 1st of month)
 */
export async function resetMonthlyUsage(): Promise<number> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from('client_ai_settings')
    .update({ current_month_usage: 0 })
    .neq('client_id', '00000000-0000-0000-0000-000000000000'); // Update all

  if (error) {
    console.error('Error resetting monthly usage:', error);
    return 0;
  }

  return count || 0;
}
