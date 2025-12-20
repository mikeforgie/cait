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

  // Site Setup Checklist Items
  'SSL Certificate Verification': detectSSLCertificate,
  'Favicon Setup': detectFavicon,
  'Submit Sitemap to Google Search Console': detectSitemapSubmission,
  'Bing Webmaster Tools Setup': detectBingSetup,
  'Microsoft Clarity Setup': detectClaritySetup,
  'Privacy Policy Page': detectPrivacyPolicy,
  'Terms of Service Page': detectTermsPage,
  'URL Structure Audit': detectURLStructure,
  'Mobile Responsiveness Check': detectMobileResponsive,
  'Page Speed Optimization Check': detectPageSpeed,

  // Month 1: Technical Foundation
  'Technical SEO Audit': detectTechnicalAudit,
  'Local SEO Setup': detectLocalSEOSetup,
  'Rank Tracking Setup': detectRankTracking,
  'Content Calendar Creation': detectContentCalendar,
  'Backlink Tracker Setup': detectBacklinkTrackerSetup,

  // On-Page SEO Checklist Items
  'Robots.txt Optimization': detectRobotsTxt,
  '404 Error Page Setup': detect404Page,
  'Canonical Tags Implementation': detectCanonicalTags,
  'Schema Markup Implementation': detectSchemaMarkup,
  'Image Alt Text Audit': detectAltTextAudit,
  'Breadcrumb Navigation Setup': detectBreadcrumbs,
  'ADA Accessibility Compliance': detectAccessibility,

  // Month 1 Content Optimization
  '301 Redirects for Broken Links': detectBrokenLinks,
  'Crawl Errors Audit': detectCrawlErrors,
  'Lazy Loading Implementation': detectLazyLoading,

  // Month 2+ Ongoing Optimization
  'Pages Ranking 10-30 Optimization': detectRanking10to30,
  'Exit Page Analysis': detectExitPages,
  'Old Content Update': detectOldContentUpdate,

  // Off-Page SEO Tasks
  'NAP Consistency Audit': detectNAPConsistency,
  'Toxic Backlink Audit': detectToxicBacklinks,
  'Brand Mention Monitoring': detectBrandMentions,
  'Competitor Backlink Analysis': detectCompetitorBacklinks,
  'Link Audit': detectLinkAudit,
  'Local Citations Building': detectLocalCitations,
  'Review Generation Campaign': detectReviewGeneration,
  'Directory Submissions': detectDirectorySubmissions,

  // Gap Analysis Tasks
  'Google Penalties Check': detectGooglePenalties,
  'Index Coverage Report Review': detectIndexCoverage,
  'Core Web Vitals Audit': detectCoreWebVitals,
  'Conversion Tracking Setup': detectConversionTracking,
  'Local Business Schema Implementation': detectLocalBusinessSchema,
  'Google Map Embed on Contact Page': detectGoogleMapEmbed,
  'XML Sitemap Audit': detectXMLSitemapAudit,
  'JavaScript SEO Audit': detectJavaScriptSEO,
  'Long-Tail Keyword Targeting': detectLongTailKeywords,

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
    .select('id, scan_type, scan_status, created_at')
    .eq('client_id', clientId)
    .eq('scan_type', 'technical')
    .eq('scan_status', 'completed')
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
 * Detect SSL certificate setup
 */
async function detectSSLCertificate(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check scan results for SSL
  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_ssl === true) {
    evidence.push('SSL certificate verified')
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
    evidence: ['SSL status not verified yet'],
    auto_complete: false,
  }
}

/**
 * Detect favicon setup
 */
async function detectFavicon(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check scan results for favicon
  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_favicon === true) {
    evidence.push('Favicon detected')
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
    evidence: ['Favicon not detected'],
    auto_complete: false,
  }
}

/**
 * Detect sitemap submission to GSC
 */
async function detectSitemapSubmission(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check scan results for sitemap
  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_sitemap === true) {
    evidence.push('Sitemap detected on website')

    // Check if GSC is connected
    const { data: client } = await supabase
      .from('clients')
      .select('selected_gsc_site_url')
      .eq('id', clientId)
      .single()

    if (client?.selected_gsc_site_url) {
      evidence.push('GSC connected - sitemap likely submitted')
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

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['Sitemap not detected or GSC not connected'],
    auto_complete: false,
  }
}

/**
 * Detect Bing Webmaster Tools setup
 */
async function detectBingSetup(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: client } = await supabase
    .from('clients')
    .select('bing_api_key, bing_site_url, bing_connected_at')
    .eq('id', clientId)
    .single()

  if (client?.bing_api_key && client?.bing_site_url) {
    evidence.push(`Bing connected: ${client.bing_site_url}`)
    if (client.bing_connected_at) {
      evidence.push(`Connected on ${new Date(client.bing_connected_at).toLocaleDateString()}`)
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
    evidence: ['Bing Webmaster Tools not connected'],
    auto_complete: false,
  }
}

/**
 * Detect Microsoft Clarity setup
 */
async function detectClaritySetup(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: client } = await supabase
    .from('clients')
    .select('clarity_api_token, clarity_project_id, clarity_connected_at')
    .eq('id', clientId)
    .single()

  if (client?.clarity_api_token && client?.clarity_project_id) {
    evidence.push(`Clarity connected: Project ${client.clarity_project_id}`)
    if (client.clarity_connected_at) {
      evidence.push(`Connected on ${new Date(client.clarity_connected_at).toLocaleDateString()}`)
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
    evidence: ['Microsoft Clarity not connected'],
    auto_complete: false,
  }
}

/**
 * Detect privacy policy page
 */
async function detectPrivacyPolicy(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check scan results for privacy policy
  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_privacy_policy === true) {
    evidence.push('Privacy policy page detected')
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
    evidence: ['Privacy policy page not detected'],
    auto_complete: false,
  }
}

/**
 * Detect terms of service page
 */
async function detectTermsPage(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check scan results for terms page
  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_terms_page === true) {
    evidence.push('Terms of service page detected')
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
    evidence: ['Terms of service page not detected'],
    auto_complete: false,
  }
}

/**
 * Detect URL structure audit
 */
async function detectURLStructure(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check if technical audit was done
  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.url_structure_checked === true) {
    evidence.push('URL structure audited')
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
    evidence: ['URL structure not audited'],
    auto_complete: false,
  }
}

/**
 * Detect mobile responsiveness check
 */
async function detectMobileResponsive(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check scan results for mobile friendly
  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.is_mobile_friendly !== undefined) {
    const isMobileFriendly = scans[0].scan_results.is_mobile_friendly
    evidence.push(isMobileFriendly ? 'Site is mobile friendly' : 'Site needs mobile optimization')
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
    evidence: ['Mobile responsiveness not checked'],
    auto_complete: false,
  }
}

/**
 * Detect page speed check
 */
async function detectPageSpeed(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check scan results for page speed
  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.performance_score !== undefined) {
    const score = scans[0].scan_results.performance_score
    evidence.push(`Performance score: ${score}/100`)
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
    evidence: ['Page speed not checked'],
    auto_complete: false,
  }
}

// ============================================
// On-Page SEO Detection Functions
// ============================================

/**
 * Detect robots.txt optimization
 */
async function detectRobotsTxt(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_robots_txt === true) {
    evidence.push('Robots.txt detected and analyzed')
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
    evidence: ['Robots.txt not detected or not analyzed'],
    auto_complete: false,
  }
}

/**
 * Detect 404 error page setup
 */
async function detect404Page(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_custom_404 === true) {
    evidence.push('Custom 404 error page detected')
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
    evidence: ['Custom 404 page not detected'],
    auto_complete: false,
  }
}

/**
 * Detect canonical tags implementation
 */
async function detectCanonicalTags(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_canonical_tags === true) {
    evidence.push('Canonical tags detected on pages')
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
    evidence: ['Canonical tags not detected'],
    auto_complete: false,
  }
}

/**
 * Detect schema markup implementation
 */
async function detectSchemaMarkup(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_schema_markup === true) {
    const schemaTypes = scans[0].scan_results.schema_types || []
    evidence.push('Schema markup detected')
    if (schemaTypes.length > 0) {
      evidence.push(`Types: ${schemaTypes.slice(0, 5).join(', ')}`)
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
    evidence: ['Schema markup not detected'],
    auto_complete: false,
  }
}

/**
 * Detect image alt text audit
 */
async function detectAltTextAudit(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.images_audited !== undefined) {
    const { images_total, images_with_alt, images_missing_alt } = scans[0].scan_results
    evidence.push(`${images_total || 0} images audited`)
    if (images_with_alt) evidence.push(`${images_with_alt} have alt text`)
    if (images_missing_alt) evidence.push(`${images_missing_alt} missing alt text`)
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
    evidence: ['Image alt text audit not performed'],
    auto_complete: false,
  }
}

/**
 * Detect breadcrumb navigation
 */
async function detectBreadcrumbs(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_breadcrumbs === true) {
    evidence.push('Breadcrumb navigation detected')
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
    evidence: ['Breadcrumb navigation not detected'],
    auto_complete: false,
  }
}

/**
 * Detect ADA accessibility compliance
 */
async function detectAccessibility(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.accessibility_score !== undefined) {
    const score = scans[0].scan_results.accessibility_score
    evidence.push(`Accessibility score: ${score}/100`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: score >= 80 ? 'high' : 'medium',
      evidence,
      auto_complete: score >= 80,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['Accessibility not audited'],
    auto_complete: false,
  }
}

/**
 * Detect broken links / 301 redirects
 */
async function detectBrokenLinks(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.broken_links_checked === true) {
    const brokenCount = scans[0].scan_results.broken_links_count || 0
    const fixedCount = scans[0].scan_results.broken_links_fixed || 0
    evidence.push(`Broken links audit completed`)
    evidence.push(`Found: ${brokenCount}, Fixed: ${fixedCount}`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: brokenCount === 0 || fixedCount > 0 ? 'high' : 'medium',
      evidence,
      auto_complete: brokenCount === 0 || fixedCount === brokenCount,
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['Broken links not audited'],
    auto_complete: false,
  }
}

/**
 * Detect crawl errors audit
 */
async function detectCrawlErrors(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check GSC connection for crawl error data
  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, selected_gsc_site_url')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_gsc_site_url) {
    evidence.push('GSC connected - crawl errors available')

    // Check for crawl error data in scans
    const { data: scans } = await supabase
      .from('seo_scans')
      .select('scan_results')
      .eq('client_id', clientId)
      .eq('scan_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (scans && scans.length > 0 && scans[0].scan_results?.crawl_errors_count !== undefined) {
      evidence.push(`${scans[0].scan_results.crawl_errors_count} crawl errors found`)
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
    evidence: ['GSC not connected - cannot audit crawl errors'],
    auto_complete: false,
  }
}

/**
 * Detect lazy loading implementation
 */
async function detectLazyLoading(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_lazy_loading === true) {
    evidence.push('Lazy loading detected on images/videos')
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
    evidence: ['Lazy loading not detected'],
    auto_complete: false,
  }
}

/**
 * Detect pages ranking 10-30 optimization
 */
async function detectRanking10to30(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check GSC for pages in positions 10-30
  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, selected_gsc_site_url')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_gsc_site_url) {
    // Check if we have ranking data stored
    const { data: rankings } = await supabase
      .from('rank_tracking')
      .select('keyword, position')
      .eq('client_id', clientId)
      .gte('position', 10)
      .lte('position', 30)
      .limit(10)

    if (rankings && rankings.length > 0) {
      evidence.push(`${rankings.length} keywords in positions 10-30 identified`)
      evidence.push('Optimization opportunities identified')
      return {
        task_id: task.id,
        task_name: task.name,
        detected: true,
        confidence: 'medium',
        evidence,
        auto_complete: false, // Requires manual optimization
      }
    }

    evidence.push('GSC connected - ranking data available')
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
    evidence: ['GSC not connected - cannot identify ranking opportunities'],
    auto_complete: false,
  }
}

/**
 * Detect exit page analysis
 */
async function detectExitPages(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check GA4 connection for exit page data
  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, selected_ga4_property_id')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_ga4_property_id) {
    evidence.push('GA4 connected - exit page data available')
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'medium',
      evidence,
      auto_complete: false, // Requires analysis
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['GA4 not connected - cannot analyze exit pages'],
    auto_complete: false,
  }
}

/**
 * Detect old content updates
 */
async function detectOldContentUpdate(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []
  const month = task.month

  // Get client start date
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

  // Check for content updates in this period
  const { data: updates } = await supabase
    .from('content_published')
    .select('id, title, updated_at')
    .eq('client_id', clientId)
    .eq('is_update', true)
    .gte('updated_at', monthStart.toISOString())
    .lt('updated_at', monthEnd.toISOString())

  const updateCount = updates?.length || 0

  if (updateCount >= 2) {
    evidence.push(`${updateCount} content pieces updated this month`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  } else if (updateCount > 0) {
    evidence.push(`${updateCount}/2 content updates this month`)
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
    evidence: ['No content updates recorded for this period'],
    auto_complete: false,
  }
}

// ============================================
// Off-Page SEO Detection Functions
// ============================================

/**
 * Detect NAP consistency audit
 */
async function detectNAPConsistency(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for NAP audit data from BrightLocal or scan results
  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.nap_audit_completed === true) {
    const consistency = scans[0].scan_results.nap_consistency_score || 0
    evidence.push(`NAP consistency audit completed`)
    evidence.push(`Consistency score: ${consistency}%`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  // Check BrightLocal locations for NAP data
  const { data: locations } = await supabase
    .from('brightlocal_locations')
    .select('id, business_name')
    .eq('client_id', clientId)

  if (locations && locations.length > 0) {
    evidence.push('BrightLocal configured - NAP monitoring available')
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
    evidence: ['NAP consistency audit not performed'],
    auto_complete: false,
  }
}

/**
 * Detect toxic backlink audit
 */
async function detectToxicBacklinks(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for toxic backlink audit in automation config
  const { data: config } = await supabase
    .from('automation_config')
    .select('config')
    .eq('client_id', clientId)
    .eq('type', 'toxic_backlink_audit')
    .single()

  if (config?.config?.last_audit_date) {
    const toxicCount = config.config.toxic_count || 0
    const disavowedCount = config.config.disavowed_count || 0
    evidence.push(`Toxic backlink audit completed`)
    evidence.push(`Found: ${toxicCount} toxic links`)
    if (disavowedCount > 0) {
      evidence.push(`Disavowed: ${disavowedCount} links`)
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

  // Check if we have backlink data with spam scores
  const { data: backlinks } = await supabase
    .from('backlinks')
    .select('id, spam_score')
    .eq('client_id', clientId)
    .not('spam_score', 'is', null)
    .limit(10)

  if (backlinks && backlinks.length > 0) {
    evidence.push('Backlinks with spam scores available')
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
    evidence: ['Toxic backlink audit not performed'],
    auto_complete: false,
  }
}

/**
 * Detect brand mention monitoring
 */
async function detectBrandMentions(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for brand alert setup
  const { data: client } = await supabase
    .from('clients')
    .select('name, domain')
    .eq('id', clientId)
    .single()

  // Check automation config for brand monitoring
  const { data: config } = await supabase
    .from('automation_config')
    .select('config')
    .eq('client_id', clientId)
    .eq('type', 'brand_monitoring')
    .single()

  if (config?.config?.enabled) {
    const mentionsFound = config.config.total_mentions || 0
    const unlinkedCount = config.config.unlinked_mentions || 0
    evidence.push('Brand mention monitoring enabled')
    evidence.push(`Total mentions tracked: ${mentionsFound}`)
    if (unlinkedCount > 0) {
      evidence.push(`Unlinked mentions (link opportunities): ${unlinkedCount}`)
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
    evidence: ['Brand mention monitoring not configured'],
    auto_complete: false,
  }
}

/**
 * Detect competitor backlink analysis
 */
async function detectCompetitorBacklinks(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for competitor backlink data
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, domain, backlink_count')
    .eq('client_id', clientId)

  if (competitors && competitors.length > 0) {
    const withBacklinks = competitors.filter(c => c.backlink_count && c.backlink_count > 0)
    if (withBacklinks.length > 0) {
      evidence.push(`${withBacklinks.length} competitors with backlink data analyzed`)
      withBacklinks.slice(0, 3).forEach(c => {
        evidence.push(`- ${c.domain}: ${c.backlink_count} backlinks`)
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

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['Competitor backlink analysis not performed'],
    auto_complete: false,
  }
}

/**
 * Detect link audit completion
 */
async function detectLinkAudit(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []
  const month = task.month

  // Get client start date for monthly check
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

  // Check for backlink audit in this period
  const { data: config } = await supabase
    .from('automation_config')
    .select('config, updated_at')
    .eq('client_id', clientId)
    .eq('type', 'backlink_audit')
    .gte('updated_at', monthStart.toISOString())
    .lt('updated_at', monthEnd.toISOString())
    .single()

  if (config) {
    evidence.push('Link audit completed for this period')
    if (config.config?.new_links) evidence.push(`New links: ${config.config.new_links}`)
    if (config.config?.lost_links) evidence.push(`Lost links: ${config.config.lost_links}`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  // Check if backlinks exist (basic check)
  const { count } = await supabase
    .from('backlinks')
    .select('id', { count: 'exact' })
    .eq('client_id', clientId)

  if (count && count > 0) {
    evidence.push(`${count} backlinks in database`)
    evidence.push('Backlink data available for audit')
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
    evidence: ['Link audit not performed for this period'],
    auto_complete: false,
  }
}

/**
 * Detect local citations building
 */
async function detectLocalCitations(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for citation data in BrightLocal or custom table
  const { data: citations } = await supabase
    .from('backlinks')
    .select('id, source_url')
    .eq('client_id', clientId)
    .eq('link_type', 'citation')

  if (citations && citations.length >= 5) {
    evidence.push(`${citations.length} local citations built`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  // Check BrightLocal for citation tracking
  const { data: locations } = await supabase
    .from('brightlocal_locations')
    .select('id, citations_count')
    .eq('client_id', clientId)
    .single()

  if (locations?.citations_count && locations.citations_count > 0) {
    evidence.push(`${locations.citations_count} citations tracked in BrightLocal`)
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
    evidence: ['Local citations not built or tracked'],
    auto_complete: false,
  }
}

/**
 * Detect review generation campaign
 */
async function detectReviewGeneration(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for review data from GBP or BrightLocal
  const { data: client } = await supabase
    .from('clients')
    .select('gbp_locations, selected_gbp_location_id')
    .eq('id', clientId)
    .single()

  if (client?.selected_gbp_location_id) {
    evidence.push('GBP connected for review management')

    // Check automation config for review campaign
    const { data: config } = await supabase
      .from('automation_config')
      .select('config')
      .eq('client_id', clientId)
      .eq('type', 'review_campaign')
      .single()

    if (config?.config?.enabled) {
      evidence.push('Review generation campaign active')
      if (config.config.total_reviews) {
        evidence.push(`Total reviews: ${config.config.total_reviews}`)
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
    evidence: ['Review generation campaign not set up'],
    auto_complete: false,
  }
}

/**
 * Detect directory submissions
 */
async function detectDirectorySubmissions(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for directory backlinks
  const { data: directories } = await supabase
    .from('backlinks')
    .select('id, source_url')
    .eq('client_id', clientId)
    .eq('link_type', 'directory')

  if (directories && directories.length >= 5) {
    evidence.push(`${directories.length} directory submissions completed`)
    return {
      task_id: task.id,
      task_name: task.name,
      detected: true,
      confidence: 'high',
      evidence,
      auto_complete: true,
    }
  }

  // Check automation config for directory submission tracking
  const { data: config } = await supabase
    .from('automation_config')
    .select('config')
    .eq('client_id', clientId)
    .eq('type', 'directory_submissions')
    .single()

  if (config?.config?.submitted_count && config.config.submitted_count >= 5) {
    evidence.push(`${config.config.submitted_count} directories submitted`)
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
    evidence: ['Directory submissions not tracked'],
    auto_complete: false,
  }
}

// ============================================
// Gap Analysis Detection Functions
// ============================================

/**
 * Detect Google penalties check
 */
async function detectGooglePenalties(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check if GSC is connected (needed for manual actions check)
  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, selected_gsc_site_url')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_gsc_site_url) {
    // Check automation config for penalty check
    const { data: config } = await supabase
      .from('automation_config')
      .select('config')
      .eq('client_id', clientId)
      .eq('type', 'penalty_check')
      .single()

    if (config?.config?.checked_at) {
      evidence.push('Google penalties checked via GSC')
      evidence.push(config.config.has_penalties ? 'WARNING: Penalties found!' : 'No penalties detected')
      return {
        task_id: task.id,
        task_name: task.name,
        detected: true,
        confidence: 'high',
        evidence,
        auto_complete: !config.config.has_penalties,
      }
    }

    evidence.push('GSC connected - penalty check available')
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
    evidence: ['GSC not connected - cannot check penalties'],
    auto_complete: false,
  }
}

/**
 * Detect index coverage report review
 */
async function detectIndexCoverage(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, selected_gsc_site_url')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_gsc_site_url) {
    const { data: config } = await supabase
      .from('automation_config')
      .select('config')
      .eq('client_id', clientId)
      .eq('type', 'index_coverage')
      .single()

    if (config?.config?.reviewed_at) {
      evidence.push('Index coverage reviewed')
      if (config.config.errors) evidence.push(`Errors: ${config.config.errors}`)
      if (config.config.warnings) evidence.push(`Warnings: ${config.config.warnings}`)
      if (config.config.valid) evidence.push(`Valid pages: ${config.config.valid}`)
      return {
        task_id: task.id,
        task_name: task.name,
        detected: true,
        confidence: 'high',
        evidence,
        auto_complete: true,
      }
    }

    evidence.push('GSC connected - index coverage data available')
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
    evidence: ['GSC not connected - cannot review index coverage'],
    auto_complete: false,
  }
}

/**
 * Detect Core Web Vitals audit
 */
async function detectCoreWebVitals(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0) {
    const results = scans[0].scan_results
    if (results?.lcp !== undefined || results?.fid !== undefined || results?.cls !== undefined) {
      evidence.push('Core Web Vitals audited')
      if (results.lcp) evidence.push(`LCP: ${results.lcp}s`)
      if (results.fid) evidence.push(`FID: ${results.fid}ms`)
      if (results.inp) evidence.push(`INP: ${results.inp}ms`)
      if (results.cls) evidence.push(`CLS: ${results.cls}`)
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

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['Core Web Vitals not audited'],
    auto_complete: false,
  }
}

/**
 * Detect conversion tracking setup
 */
async function detectConversionTracking(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, selected_ga4_property_id')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_ga4_property_id) {
    const { data: config } = await supabase
      .from('automation_config')
      .select('config')
      .eq('client_id', clientId)
      .eq('type', 'conversion_tracking')
      .single()

    if (config?.config?.conversions_configured) {
      evidence.push('Conversion tracking configured in GA4')
      if (config.config.conversion_count) {
        evidence.push(`${config.config.conversion_count} conversion events set up`)
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

    evidence.push('GA4 connected - conversion tracking can be configured')
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
    evidence: ['GA4 not connected - cannot configure conversion tracking'],
    auto_complete: false,
  }
}

/**
 * Detect local business schema implementation
 */
async function detectLocalBusinessSchema(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0) {
    const schemaTypes = scans[0].scan_results?.schema_types || []
    const hasLocalSchema = schemaTypes.some((t: string) =>
      t.toLowerCase().includes('localbusiness') ||
      t.toLowerCase().includes('organization') ||
      t.toLowerCase().includes('store')
    )

    if (hasLocalSchema) {
      evidence.push('Local Business schema detected')
      evidence.push(`Types: ${schemaTypes.filter((t: string) =>
        t.toLowerCase().includes('local') || t.toLowerCase().includes('business')
      ).join(', ')}`)
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

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['Local Business schema not detected'],
    auto_complete: false,
  }
}

/**
 * Detect Google Map embed on contact page
 */
async function detectGoogleMapEmbed(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.has_google_map === true) {
    evidence.push('Google Map embed detected on site')
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
    evidence: ['Google Map embed not detected'],
    auto_complete: false,
  }
}

/**
 * Detect XML sitemap audit
 */
async function detectXMLSitemapAudit(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: client } = await supabase
    .from('clients')
    .select('google_oauth_tokens, selected_gsc_site_url')
    .eq('id', clientId)
    .single()

  if (client?.google_oauth_tokens && client?.selected_gsc_site_url) {
    const { data: config } = await supabase
      .from('automation_config')
      .select('config')
      .eq('client_id', clientId)
      .eq('type', 'sitemap_audit')
      .single()

    if (config?.config?.audited_at) {
      evidence.push('XML sitemap audited')
      if (config.config.urls_submitted) evidence.push(`URLs submitted: ${config.config.urls_submitted}`)
      if (config.config.urls_indexed) evidence.push(`URLs indexed: ${config.config.urls_indexed}`)
      if (config.config.errors) evidence.push(`Errors: ${config.config.errors}`)
      return {
        task_id: task.id,
        task_name: task.name,
        detected: true,
        confidence: 'high',
        evidence,
        auto_complete: true,
      }
    }

    evidence.push('GSC connected - sitemap status available')
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
    evidence: ['GSC not connected - cannot audit sitemap'],
    auto_complete: false,
  }
}

/**
 * Detect JavaScript SEO audit
 */
async function detectJavaScriptSEO(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  const { data: scans } = await supabase
    .from('seo_scans')
    .select('scan_results')
    .eq('client_id', clientId)
    .eq('scan_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (scans && scans.length > 0 && scans[0].scan_results?.js_rendering_checked === true) {
    evidence.push('JavaScript rendering audited')
    if (scans[0].scan_results.js_issues) {
      evidence.push(`Issues found: ${scans[0].scan_results.js_issues}`)
    } else {
      evidence.push('No JavaScript SEO issues detected')
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
    evidence: ['JavaScript SEO not audited'],
    auto_complete: false,
  }
}

/**
 * Detect long-tail keyword targeting
 */
async function detectLongTailKeywords(clientId: string, task: Task): Promise<DetectionResult> {
  const supabase = await createClient()
  const evidence: string[] = []

  // Check for long-tail keywords in keyword research (4+ words)
  const { data: keywords } = await supabase
    .from('keyword_research')
    .select('keyword')
    .eq('client_id', clientId)

  if (keywords && keywords.length > 0) {
    const longTail = keywords.filter(k => k.keyword.split(' ').length >= 4)
    if (longTail.length >= 20) {
      evidence.push(`${longTail.length} long-tail keywords identified`)
      return {
        task_id: task.id,
        task_name: task.name,
        detected: true,
        confidence: 'high',
        evidence,
        auto_complete: true,
      }
    } else if (longTail.length > 0) {
      evidence.push(`${longTail.length} long-tail keywords (target: 20+)`)
      return {
        task_id: task.id,
        task_name: task.name,
        detected: true,
        confidence: 'medium',
        evidence,
        auto_complete: false,
      }
    }
  }

  return {
    task_id: task.id,
    task_name: task.name,
    detected: false,
    confidence: 'low',
    evidence: ['Long-tail keywords not identified'],
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
