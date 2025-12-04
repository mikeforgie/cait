/**
 * AI Attribution Engine
 * Automatically links SEO actions to traffic/ranking improvements
 * Uses timing analysis and confidence scoring
 */

import { createClient } from '@/lib/supabase/server';

export interface AttributionResult {
  actionId: string;
  resultId: string;
  confidenceScore: number;
  timeLagDays: number;
  correlationStrength: 'strong' | 'moderate' | 'weak' | 'probable';
  reasoning: string;
  estimatedValue?: number;
}

interface SEOAction {
  id: string;
  client_id: string;
  action_type: string;
  action_category: string;
  target_type: string;
  target_url: string | null;
  action_details: Record<string, any>;
  executed_at: string;
}

interface SEOResult {
  id: string;
  client_id: string;
  result_type: string;
  target_type: string;
  target_url: string | null;
  metric_name: string;
  metric_value: number;
  previous_value: number | null;
  change_amount: number | null;
  change_percent: number | null;
  measured_at: string;
}

/**
 * Attribution time windows - how long after an action we expect to see results
 */
const ATTRIBUTION_WINDOWS = {
  // Technical fixes often show results quickly
  technical: { minDays: 1, maxDays: 14, peakDays: 7 },
  // Content takes longer to get indexed and rank
  content: { minDays: 7, maxDays: 90, peakDays: 30 },
  // On-page SEO changes are medium term
  on_page: { minDays: 3, maxDays: 30, peakDays: 14 },
  // Off-page (backlinks) can take a while
  off_page: { minDays: 14, maxDays: 120, peakDays: 45 },
};

/**
 * Calculate confidence score based on timing
 */
function calculateTimingConfidence(
  timeLagDays: number,
  actionCategory: string
): number {
  const window = ATTRIBUTION_WINDOWS[actionCategory as keyof typeof ATTRIBUTION_WINDOWS]
    || ATTRIBUTION_WINDOWS.on_page;

  // Outside the window = low confidence
  if (timeLagDays < window.minDays || timeLagDays > window.maxDays) {
    return 0.1;
  }

  // Peak timing = highest confidence
  const distanceFromPeak = Math.abs(timeLagDays - window.peakDays);
  const maxDistance = Math.max(window.peakDays - window.minDays, window.maxDays - window.peakDays);
  const timingScore = 1 - (distanceFromPeak / maxDistance) * 0.5;

  return Math.min(0.95, Math.max(0.2, timingScore));
}

/**
 * Calculate confidence based on URL/target matching
 */
function calculateTargetMatchConfidence(
  action: SEOAction,
  result: SEOResult
): number {
  // Exact URL match = high confidence
  if (action.target_url && result.target_url && action.target_url === result.target_url) {
    return 0.9;
  }

  // Same page path (ignoring domain variations)
  if (action.target_url && result.target_url) {
    const actionPath = extractPath(action.target_url);
    const resultPath = extractPath(result.target_url);
    if (actionPath === resultPath) {
      return 0.8;
    }
  }

  // Site-wide actions can affect any page
  if (action.target_type === 'site') {
    return 0.5;
  }

  // No clear match
  return 0.3;
}

/**
 * Extract path from URL
 */
function extractPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url;
  }
}

/**
 * Determine correlation strength based on confidence score
 */
function getCorrelationStrength(confidence: number): 'strong' | 'moderate' | 'weak' | 'probable' {
  if (confidence >= 0.8) return 'strong';
  if (confidence >= 0.6) return 'moderate';
  if (confidence >= 0.4) return 'probable';
  return 'weak';
}

/**
 * Generate human-readable reasoning for attribution
 */
function generateReasoning(
  action: SEOAction,
  result: SEOResult,
  timeLagDays: number,
  confidence: number
): string {
  const actionDescription = describeAction(action);
  const resultDescription = describeResult(result);

  let reasoning = `${actionDescription} was performed ${timeLagDays} day${timeLagDays === 1 ? '' : 's'} before ${resultDescription}. `;

  if (action.target_url && result.target_url && action.target_url === result.target_url) {
    reasoning += 'The action and result affect the same URL, indicating a direct relationship. ';
  } else if (action.target_type === 'site') {
    reasoning += 'This site-wide action could have contributed to improvements across multiple pages. ';
  }

  if (confidence >= 0.7) {
    reasoning += 'The timing and target alignment suggest a strong causal connection.';
  } else if (confidence >= 0.5) {
    reasoning += 'The timing suggests a probable connection, though other factors may have contributed.';
  } else {
    reasoning += 'This is a possible but not definitive connection.';
  }

  return reasoning;
}

/**
 * Describe an action in human-readable terms
 */
function describeAction(action: SEOAction): string {
  const typeDescriptions: Record<string, string> = {
    meta_update: 'Meta tag update',
    content_published: 'New content publication',
    content_updated: 'Content update',
    backlink_acquired: 'Backlink acquisition',
    technical_fix: 'Technical SEO fix',
    schema_added: 'Schema markup addition',
    internal_link_added: 'Internal link addition',
    image_optimization: 'Image optimization',
  };

  return typeDescriptions[action.action_type] || `${action.action_type} action`;
}

/**
 * Describe a result in human-readable terms
 */
function describeResult(result: SEOResult): string {
  if (result.result_type === 'ranking_change' && result.change_amount) {
    const direction = result.change_amount > 0 ? 'improvement' : 'decline';
    return `a ranking ${direction} of ${Math.abs(result.change_amount)} positions`;
  }

  if (result.result_type === 'traffic_increase') {
    const percent = result.change_percent ? `${Math.abs(result.change_percent).toFixed(1)}%` : '';
    return `a traffic increase${percent ? ` of ${percent}` : ''}`;
  }

  return `a ${result.result_type} event`;
}

/**
 * Estimate monetary value of a result
 */
function estimateResultValue(result: SEOResult): number | undefined {
  // Ranking improvement value estimation
  if (result.result_type === 'ranking_change' && result.change_amount && result.change_amount > 0) {
    // Rough estimate: each position improvement on page 1 = $50/month value
    // Improvements from page 2+ to page 1 = higher value
    const positionValue = result.change_amount * 50;
    if (result.previous_value && result.previous_value > 10 && result.metric_value <= 10) {
      return positionValue * 2; // Double value for getting to page 1
    }
    return positionValue;
  }

  // Traffic increase value estimation
  if (result.result_type === 'traffic_increase' && result.change_amount && result.change_amount > 0) {
    // Rough estimate: each organic visitor = $2 value
    return result.change_amount * 2;
  }

  return undefined;
}

/**
 * Run the AI Attribution Engine for a client
 */
export async function runAttributionEngine(
  clientId: string,
  options: {
    lookbackDays?: number;
    minConfidence?: number;
    dryRun?: boolean;
  } = {}
): Promise<{
  runId: string;
  actionsAnalyzed: number;
  resultsAnalyzed: number;
  attributionsCreated: number;
  attributions: AttributionResult[];
}> {
  const { lookbackDays = 90, minConfidence = 0.3, dryRun = false } = options;

  const supabase = await createClient();

  // Create attribution run record
  const { data: run, error: runError } = await supabase
    .from('attribution_runs')
    .insert({
      client_id: clientId,
      run_type: 'manual',
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (runError || !run) {
    throw new Error('Failed to create attribution run record');
  }

  const runId = run.id;

  try {
    // Get recent SEO actions
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    const { data: actions, error: actionsError } = await supabase
      .from('seo_actions')
      .select('*')
      .eq('client_id', clientId)
      .gte('executed_at', lookbackDate.toISOString())
      .order('executed_at', { ascending: false });

    if (actionsError) throw actionsError;

    // Get recent SEO results
    const { data: results, error: resultsError } = await supabase
      .from('seo_results')
      .select('*')
      .eq('client_id', clientId)
      .gte('measured_at', lookbackDate.toISOString())
      .order('measured_at', { ascending: false });

    if (resultsError) throw resultsError;

    // Get existing attributions to avoid duplicates
    const { data: existingAttributions } = await supabase
      .from('action_result_attributions')
      .select('action_id, result_id')
      .eq('client_id', clientId);

    const existingPairs = new Set(
      (existingAttributions || []).map((a) => `${a.action_id}-${a.result_id}`)
    );

    const attributions: AttributionResult[] = [];

    // Analyze each result to find potential contributing actions
    for (const result of results || []) {
      const resultDate = new Date(result.measured_at);

      for (const action of actions || []) {
        const actionDate = new Date(action.executed_at);

        // Skip if action is after result (can't cause something before it happened)
        if (actionDate > resultDate) continue;

        // Calculate time lag
        const timeLagMs = resultDate.getTime() - actionDate.getTime();
        const timeLagDays = Math.floor(timeLagMs / (1000 * 60 * 60 * 24));

        // Skip if outside maximum attribution window
        if (timeLagDays > 120) continue;

        // Skip if already attributed
        if (existingPairs.has(`${action.id}-${result.id}`)) continue;

        // Calculate confidence scores
        const timingConfidence = calculateTimingConfidence(timeLagDays, action.action_category);
        const targetConfidence = calculateTargetMatchConfidence(action, result);

        // Combined confidence (weighted average)
        const confidence = (timingConfidence * 0.4 + targetConfidence * 0.6);

        // Skip low confidence attributions
        if (confidence < minConfidence) continue;

        const attribution: AttributionResult = {
          actionId: action.id,
          resultId: result.id,
          confidenceScore: Math.round(confidence * 100) / 100,
          timeLagDays,
          correlationStrength: getCorrelationStrength(confidence),
          reasoning: generateReasoning(action, result, timeLagDays, confidence),
          estimatedValue: estimateResultValue(result),
        };

        attributions.push(attribution);
      }
    }

    // Sort by confidence (highest first)
    attributions.sort((a, b) => b.confidenceScore - a.confidenceScore);

    // Store attributions in database (unless dry run)
    let attributionsCreated = 0;

    if (!dryRun && attributions.length > 0) {
      const attributionRecords = attributions.map((a) => ({
        client_id: clientId,
        action_id: a.actionId,
        result_id: a.resultId,
        action_type: (actions || []).find((act) => act.id === a.actionId)?.action_type || 'unknown',
        result_type: (results || []).find((res) => res.id === a.resultId)?.result_type || 'unknown',
        result_value: (results || []).find((res) => res.id === a.resultId)?.metric_value,
        confidence_score: a.confidenceScore,
        attribution_weight: a.confidenceScore, // Use confidence as weight for now
        time_lag_days: a.timeLagDays,
        attribution_reasoning: a.reasoning,
        correlation_strength: a.correlationStrength,
        estimated_value_dollars: a.estimatedValue,
        run_id: runId,
        status: 'active',
      }));

      const { error: insertError } = await supabase
        .from('action_result_attributions')
        .insert(attributionRecords);

      if (insertError) {
        console.error('Error inserting attributions:', insertError);
      } else {
        attributionsCreated = attributionRecords.length;
      }
    }

    // Update run record
    await supabase
      .from('attribution_runs')
      .update({
        status: 'completed',
        actions_analyzed: (actions || []).length,
        results_analyzed: (results || []).length,
        attributions_created: attributionsCreated,
        completed_at: new Date().toISOString(),
        duration_seconds: Math.floor((Date.now() - new Date(run.started_at).getTime()) / 1000),
      })
      .eq('id', runId);

    return {
      runId,
      actionsAnalyzed: (actions || []).length,
      resultsAnalyzed: (results || []).length,
      attributionsCreated,
      attributions,
    };
  } catch (error: any) {
    // Update run record with error
    await supabase
      .from('attribution_runs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    throw error;
  }
}

/**
 * Get attribution summary for a client
 */
export async function getAttributionSummary(clientId: string) {
  const supabase = await createClient();

  // Get recent attributions
  const { data: attributions } = await supabase
    .from('action_result_attributions')
    .select(`
      *,
      seo_actions!action_id (action_type, action_category, target_url, executed_at),
      seo_results!result_id (result_type, metric_name, metric_value, change_amount, measured_at)
    `)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('confidence_score', { ascending: false })
    .limit(50);

  // Calculate summary stats
  const totalValue = (attributions || []).reduce(
    (sum, a) => sum + (a.estimated_value_dollars || 0),
    0
  );

  const byActionType = (attributions || []).reduce((acc, a) => {
    const type = a.seo_actions?.action_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byResultType = (attributions || []).reduce((acc, a) => {
    const type = a.seo_results?.result_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgConfidence = attributions && attributions.length > 0
    ? attributions.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / attributions.length
    : 0;

  return {
    totalAttributions: (attributions || []).length,
    totalEstimatedValue: totalValue,
    averageConfidence: avgConfidence,
    byActionType,
    byResultType,
    recentAttributions: attributions || [],
  };
}
