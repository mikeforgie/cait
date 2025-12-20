/**
 * Task Completion Detector
 *
 * Automatically detects and updates task completion status based on:
 * - Technical SEO scan results
 * - Backlink data
 * - Google connections (GA4, GSC, GBP)
 * - Content presence
 * - Local SEO data
 *
 * This bridges the high-level `tasks` table with actual completion criteria.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']

export interface DetectionResult {
  task_id: string
  task_name: string
  detected: boolean
  confidence: 'high' | 'medium' | 'low'
  evidence: string[]
  auto_complete: boolean
}

export interface CompletionCheckResult {
  client_id: string
  tasks_checked: number
  tasks_detected_complete: number
  tasks_auto_completed: number
  results: DetectionResult[]
}

/**
 * Detection criteria for each task type
 * Maps task names to detection functions
 */
const DETECTION_CRITERIA: Record<string, (clientId: string, task: Task) => Promise<DetectionResult>> = {
  // Month 0: Onboarding & Foundation
  'Keyword Research (100 keywords)': detectKeywordResearch,
  'Competitor Analysis (3 competitors)': detectCompetitorAnalysis,
  'Google Analytics 4 Setup': detectGA4Setup,
  'Google Search Console Setup': detectGSCSetup,
  'Google Business Profile Optimization': detectGBPSetup,
  'Backlink Profile Discovery': detectBacklinkDiscovery,
  'Initial Strategy Document': detectStrategyDocument,

  // Month 1: Technical Foundation
  'Technical SEO Audit': detectTechnicalAudit,
  'Local SEO Setup': detectLocalSEOSetup,
  'Rank Tracking Setup': detectRankTracking,
  'Content Calendar Creation': detectContentCalendar,
  'Backlink Tracker Setup': detectBacklinkTrackerSetup,

  // Generic patterns (match partial names)
  'Content Creation': detectContentCreation,
  'Content Strategy': detectContentStrategy,
  'Monthly Performance Report': detectMonthlyReport,
}

/**
 * Run completion detection for all tasks of a client
 */
export async function detectTaskCompletion(clientId: string): Promise<CompletionCheckResult> {
  const supabase = await createClient()

  // Get all pending/in_progress tasks
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .in('status', ['pending', 'in_progress'])
    .order('month', { ascending: true })

  if (error || !tasks) {
    throw new Error(`Failed to fetch tasks: ${error?.message}`)
  }

  const results: DetectionResult[] = []
  let autoCompletedCount = 0

  for (const task of tasks) {
    const result = await checkTaskCompletion(clientId, task)
    results.push(result)

    // Auto-complete if high confidence and auto_complete flag
    if (result.detected && result.confidence === 'high' && result.auto_complete) {
      await updateTaskToComplete(task.id, result.evidence)
      autoCompletedCount++
    }
  }

  return {
    client_id: clientId,
    tasks_checked: tasks.length,
    tasks_detected_complete: results.filter(r => r.detected).length,
    tasks_auto_completed: autoCompletedCount,
    results,
  }
}

/**
 * Check completion for a single task
 */
async function checkTaskCompletion(clientId: string, task: Task): Promise<DetectionResult> {
  // Find matching detection function
  const exactMatch = DETECTION_CRITERIA[task.name]
  if (exactMatch) {
    return exactMatch(clientId, task)
  }

  // Try partial matches for generic tasks
  for (const [pattern, detector] of Object.entries(DETECTION_CRITERIA)) {
    if (task.name.includes(pattern)) {
      return detector(clientId, task)
    }
  }

  // No detector found - return manual check required
  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No automatic detection available for this task type'],
    auto_complete: false,
  }
}

/**
 * Update task status to completed
 */
async function updateTaskToComplete(taskId: string, evidence: string[]): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      automation_config: {
        auto_detected: true,
        detection_evidence: evidence,
        detected_at: new Date().toISOString(),
      },
    })
    .eq('id', taskId)
}

// ============================================
// Detection Functions for Each Task Type
// ============================================

/**
 * Detect if keyword research was completed
 * Checks: keyword_research table or DataForSEO results stored
 */
async function detectKeywordResearch(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for stored keyword data
  const { data: keywords } = await supabase
    .from('keyword_research')
    .select('id')
    .eq('client_id', clientId)
    .limit(100)

  const keywordCount = keywords?.length || 0

  if (keywordCount >= 100) {
    evidence.push(`Found ${keywordCount} keywords in research database`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  } else if (keywordCount > 0) {
    evidence.push(`Found ${keywordCount} keywords (target: 100)`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: false,
      confidence: 'medium',
      evidence,
      auto_complete: false,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No keyword research data found'],
    auto_complete: false,
  }
}

/**
 * Detect if competitor analysis was completed
 */
async function detectCompetitorAnalysis(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for competitor data
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, domain')
    .eq('client_id', clientId)

  const competitorCount = competitors?.length || 0

  if (competitorCount >= 3) {
    evidence.push(`Found ${competitorCount} competitors analyzed`)
    competitors?.slice(0, 3).forEach(c => evidence.push(`- ${c.domain}`))
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: competitorCount > 0
      ? [`Found ${competitorCount} competitors (need 3)`]
      : ['No competitor data found'],
    auto_complete: false,
  }
}

/**
 * Detect if technical SEO audit was completed
 */
async function detectTechnicalAudit(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for scan results
  const { data: scans } = await supabase
    .from('seo_scans')
    .select('id, scan_type, status, created_at')
    .eq('client_id', clientId)
    .eq('scan_type', 'technical')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0) {
    const scan = scans[0]
    evidence.push(`Technical audit completed on ${new Date(scan.created_at).toLocaleDateString()}`)

    // Check for seo_todos created from the scan
    const { data: todos } = await supabase
      .from('seo_todos')
      .select('id')
      .eq('client_id', clientId)
      .eq('related_scan_id', scan.id)

    if (todos && todos.length > 0) {
      evidence.push(`${todos.length} SEO todos generated from audit`)
    }

    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No completed technical audit found'],
    auto_complete: false,
  }
}

/**
 * Detect if GA4 is set up
 */
async function detectGA4Setup(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for GA4 connection
  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, selected_ga4_property_id')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_ga4_property_id) {
    evidence.push(`GA4 connected: Property ${client.selected_ga4_property_id}`)

    // Connection is established - this is the setup task completion criteria
    // Data collection is a separate ongoing process, not a setup requirement
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['GA4 not connected'],
    auto_complete: false,
  }
}

/**
 * Detect if GSC is set up
 */
async function detectGSCSetup(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for GSC connection
  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, selected_gsc_site_url')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_gsc_site_url) {
    evidence.push(`GSC connected: ${client.selected_gsc_site_url}`)

    // Connection is established - this is the setup task completion criteria
    // Data collection is a separate ongoing process, not a setup requirement
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['GSC not connected'],
    auto_complete: false,
  }
}

/**
 * Detect if backlink discovery was completed
 */
async function detectBacklinkDiscovery(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for backlink data
  const { data: backlinks, count } = await supabase
    .from('backlinks')
    .select('id', { count: 'exact' })
    .eq('client_id', clientId)
    .limit(1)

  if (count && count > 0) {
    evidence.push(`${count} backlinks discovered and cataloged`)

    // Check for referring domains
    const { data: domains } = await supabase
      .from('referring_domains')
      .select('id')
      .eq('client_id', clientId)

    if (domains && domains.length > 0) {
      evidence.push(`${domains.length} referring domains tracked`)
    }

    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No backlink data found'],
    auto_complete: false,
  }
}

/**
 * Detect if local SEO is set up (GBP connected)
 */
async function detectLocalSEOSetup(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for GBP connection
  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, gbp_locations, selected_gbp_location_id')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && (client?.selected_gbp_location_id || client?.gbp_locations)) {
    const locations = Array.isArray(client.gbp_locations) ? client.gbp_locations : []

    if (locations.length > 0) {
      evidence.push(`${locations.length} GBP location(s) connected`)
      locations.slice(0, 3).forEach((loc: any) => {
        evidence.push(`- ${loc.title || loc.name || 'Location'}`)
      })

      return {
        task_id: task.id,
        task_name: task.name,
        detected: true,
        confidence: 'high',
        evidence,
        auto_complete: true,
      }
    }
  }

  // Check for BrightLocal connection as fallback
  const { data: brightlocal } = await supabase
    .from('brightlocal_locations')
    .select('id, business_name')
    .eq('client_id', clientId)
    .limit(1)

  if (brightlocal && brightlocal.length > 0) {
    evidence.push('BrightLocal location configured')
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'medium',
      evidence,
      auto_complete: false,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No local SEO setup detected'],
    auto_complete: false,
  }
}

/**
 * Detect if rank tracking is set up
 * Rank tracking can be achieved via:
 * 1. GSC connection (provides keyword ranking data)
 * 2. BrightLocal integration (Local Rank Tracker)
 * 3. Custom rank_tracking table entries
 */
async function detectRankTracking(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for GSC connection - GSC provides keyword ranking data
  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, selected_gsc_site_url')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_gsc_site_url) {
    evidence.push(`GSC connected: ${client.selected_gsc_site_url}`)
    evidence.push('GSC provides keyword ranking data automatically')
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  // Check for tracked keywords in custom table
  const { data: tracked } = await supabase
    .from('rank_tracking')
    .select('id, keyword')
    .eq('client_id', clientId)
    .eq('active', true)

  if (tracked && tracked.length >= 10) {
    evidence.push(`${tracked.length} keywords being tracked`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  } else if (tracked && tracked.length > 0) {
    evidence.push(`${tracked.length} keywords tracked (recommended: 10+)`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'medium',
      evidence,
      auto_complete: false,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No rank tracking configured - connect GSC or add keywords'],
    auto_complete: false,
  }
}

/**
 * Detect content creation (generic for monthly tasks)
 */
async function detectContentCreation(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Extract month from task
  const month = task.month

  // Calculate date range for this month's content
  const { data: client } = await supabase
    .from('clients')
    .select('created_at')
    .eq('id', clientId)
    .single()

  if (!client) {
    return {
      task_id: task.id,
      task_name: task.name,
      detected: false,
      confidence: 'low',
      evidence: ['Cannot determine client start date'],
      auto_complete: false,
    }
  }

  const startDate = new Date(client.created_at)
  const monthStart = new Date(startDate)
  monthStart.setMonth(monthStart.getMonth() + month)
  const monthEnd = new Date(monthStart)
  monthEnd.setMonth(monthEnd.getMonth() + 1)

  // Check for content published in this month
  const { data: content } = await supabase
    .from('content_published')
    .select('id, title, published_at')
    .eq('client_id', clientId)
    .gte('published_at', monthStart.toISOString())
    .lt('published_at', monthEnd.toISOString())

  const contentCount = content?.length || 0

  // Task typically requires 2 pieces
  if (contentCount >= 2) {
    evidence.push(`${contentCount} content pieces published this month`)
    content?.forEach(c => evidence.push(`- ${c.title}`))
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  } else if (contentCount > 0) {
    evidence.push(`${contentCount}/2 content pieces published`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: false,
      confidence: 'medium',
      evidence,
      auto_complete: false,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No content published for this period'],
    auto_complete: false,
  }
}

/**
 * Detect content strategy completion
 */
async function detectContentStrategy(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for content calendar/plan
  const { data: contentPlan } = await supabase
    .from('content_calendar')
    .select('id, title, target_keyword')
    .eq('client_id', clientId)
    .eq('status', 'planned')

  const planCount = contentPlan?.length || 0

  if (planCount >= 4) {
    evidence.push(`${planCount} content pieces planned`)
    contentPlan?.slice(0, 4).forEach(c => evidence.push(`- ${c.title}`))
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: planCount > 0
      ? [`${planCount}/4 content pieces planned`]
      : ['No content strategy found'],
    auto_complete: false,
  }
}

/**
 * Detect GBP setup (separate from Local SEO Setup)
 */
async function detectGBPSetup(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for GBP connection
  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, gbp_locations, selected_gbp_location_id')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_gbp_location_id) {
    evidence.push('Google Business Profile connected')
    evidence.push(`Location ID: ${client.selected_gbp_location_id}`)

    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  if (client?.gbp_locations && Array.isArray(client.gbp_locations) && client.gbp_locations.length > 0) {
    evidence.push(`${client.gbp_locations.length} GBP location(s) discovered`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'medium',
      evidence,
      auto_complete: false, // Needs selection
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['Google Business Profile not connected'],
    auto_complete: false,
  }
}

/**
 * Detect strategy document generation
 */
async function detectStrategyDocument(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for strategy document in automation_config or documents table
  const { data: docs } = await supabase
    .from('documents')
    .select('id, title, type, created_at')
    .eq('client_id', clientId)
    .ilike('type', '%strategy%')
    .limit(1)

  if (docs && docs.length > 0) {
    evidence.push(`Strategy document created: ${docs[0].title}`)
    evidence.push(`Created: ${new Date(docs[0].created_at).toLocaleDateString()}`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  // Check automation_config for strategy data
  const { data: taskData } = await supabase
    .from('automation_config')
    .select('config')
    .eq('client_id', clientId)
    .eq('type', 'strategy_document')
    .single()

  if (taskData?.config) {
    evidence.push('Strategy document generated via automation')
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No strategy document found'],
    auto_complete: false,
  }
}

/**
 * Detect content calendar creation
 */
async function detectContentCalendar(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for content calendar entries
  const { data: calendar, count } = await supabase
    .from('content_calendar')
    .select('id, title, scheduled_date', { count: 'exact' })
    .eq('client_id', clientId)

  if (count && count >= 4) {
    evidence.push(`Content calendar created with ${count} pieces planned`)
    calendar?.slice(0, 3).forEach(c => {
      evidence.push(`- ${c.title} (${new Date(c.scheduled_date).toLocaleDateString()})`)
    })
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  if (count && count > 0) {
    evidence.push(`${count} content pieces in calendar (needs 4+ for 3-month plan)`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'medium',
      evidence,
      auto_complete: false,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No content calendar found'],
    auto_complete: false,
  }
}

/**
 * Detect backlink tracker setup
 */
async function detectBacklinkTrackerSetup(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check if backlink monitoring is configured
  const { data: config } = await supabase
    .from('automation_config')
    .select('config')
    .eq('client_id', clientId)
    .eq('type', 'backlink_monitoring')
    .single()

  if (config?.config?.enabled) {
    evidence.push('Backlink monitoring enabled')
    if (config.config.alert_on_lost) {
      evidence.push('Lost link alerts configured')
    }
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  // Check if there are backlinks being tracked with DR/DA
  const { data: backlinks, count } = await supabase
    .from('backlinks')
    .select('id, domain_from_rank', { count: 'exact' })
    .eq('client_id', clientId)
    .not('domain_from_rank', 'is', null)
    .limit(5)

  if (count && count > 0) {
    evidence.push(`${count} backlinks tracked with DR metrics`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  // Check if backlink discovery was done (can assume tracker is set up)
  const { count: totalBacklinks } = await supabase
    .from('backlinks')
    .select('id', { count: 'exact' })
    .eq('client_id', clientId)

  if (totalBacklinks && totalBacklinks > 0) {
    evidence.push(`${totalBacklinks} backlinks discovered - tracker configured`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'medium',
      evidence,
      auto_complete: false,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No backlink tracking configured'],
    auto_complete: false,
  }
}

/**
 * Detect monthly report completion
 */
async function detectMonthlyReport(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const month = task.month

  // Check for generated report
  const { data: reports } = await supabase
    .from('reports')
    .select('id, report_type, created_at, delivered_at')
    .eq('client_id', clientId)
    .eq('report_type', 'monthly')
    .order('created_at', { ascending: false })

  if (reports && reports.length > 0) {
    // Check if a report was generated for this month
    const { data: client } = await supabase
      .from('clients')
      .select('created_at')
      .eq('id', clientId)
      .single()

    if (client) {
      const startDate = new Date(client.created_at)
      const monthStart = new Date(startDate)
      monthStart.setMonth(monthStart.getMonth() + month)
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)

      const monthlyReport = reports.find(r => {
        const reportDate = new Date(r.created_at)
        return reportDate >= monthStart && reportDate < monthEnd
      })

      if (monthlyReport) {
        evidence.push(`Report generated: ${new Date(monthlyReport.created_at).toLocaleDateString()}`)
        if (monthlyReport.delivered_at) {
          evidence.push(`Delivered: ${new Date(monthlyReport.delivered_at).toLocaleDateString()}`)
        }
        return {
          task_id: task.id,
          task_name: task.name,
          detected: true,
          confidence: 'high',
          evidence,
          auto_complete: true,
        }
      }
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['No monthly report found for this period'],
    auto_complete: false,
  }
}

/**
 * Get detection status summary for a client
 */
export async function getDetectionSummary(clientId: string): Promise<{
  total_tasks: number
  detected_complete: number
  needs_verification: number
  pending_action: number
  auto_completable: number
}> {
  const result = await detectTaskCompletion(clientId)

  return {
    total_tasks: result.tasks_checked,
    detected_complete: result.results.filter(r => r.detected && r.confidence === 'high').length,
    needs_verification: result.results.filter(r => r.detected && r.confidence !== 'high').length,
    pending_action: result.results.filter(r => !r.detected).length,
    auto_completable: result.results.filter(r => r.auto_complete).length,
  }
}
