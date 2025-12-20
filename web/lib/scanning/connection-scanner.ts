/**
 * Connection Scanner
 *
 * Triggered when platform connections are established (GA4, GSC, GBP, etc.)
 * Runs task completion detection and marks relevant tasks as complete.
 */

import { createClient } from '@/lib/supabase/server'
import { detectTaskCompletion } from '@/lib/automation/task-completion-detector'

export interface ConnectionScanResult {
  client_id: string
  connection_type: 'ga4' | 'gsc' | 'gbp' | 'all'
  tasks_checked: number
  tasks_auto_completed: number
  details: {
    task_name: string
    completed: boolean
    evidence: string[]
  }[]
}

/**
 * Run connection scan after OAuth properties are selected
 * This is called from the select-properties API route
 */
export async function runConnectionScan(
  clientId: string,
  connectionType: 'ga4' | 'gsc' | 'gbp' | 'all' = 'all'
): Promise<ConnectionScanResult> {
  const supabase = await createClient()

  // Run task completion detection
  const detection = await detectTaskCompletion(clientId)

  // Filter to connection-related tasks
  const connectionTaskNames = getConnectionTaskNames(connectionType)

  const relevantResults = detection.results.filter(r =>
    connectionTaskNames.some(name =>
      r.task_name.toLowerCase().includes(name.toLowerCase())
    )
  )

  // Log the scan (ignore errors if table doesn't exist)
  try {
    await supabase.from('scan_logs').insert({
      client_id: clientId,
      scan_type: 'connection_scan',
      status: 'completed',
      results: {
        connection_type: connectionType,
        tasks_checked: detection.tasks_checked,
        tasks_auto_completed: detection.tasks_auto_completed,
        relevant_tasks: relevantResults,
      },
      created_at: new Date().toISOString(),
    })
  } catch {
    // Scan logs table might not exist yet - that's ok
  }

  return {
    client_id: clientId,
    connection_type: connectionType,
    tasks_checked: detection.tasks_checked,
    tasks_auto_completed: detection.tasks_auto_completed,
    details: relevantResults.map(r => ({
      task_name: r.task_name,
      completed: r.detected && r.auto_complete,
      evidence: r.evidence,
    })),
  }
}

/**
 * Get task names related to a specific connection type
 */
function getConnectionTaskNames(connectionType: 'ga4' | 'gsc' | 'gbp' | 'all'): string[] {
  const taskMap: Record<string, string[]> = {
    ga4: ['Google Analytics', 'GA4', 'Analytics Setup'],
    gsc: ['Google Search Console', 'GSC', 'Search Console Setup'],
    gbp: ['Local SEO', 'Google Business', 'GBP', 'Local Listing'],
    all: [
      'Google Analytics', 'GA4', 'Analytics Setup',
      'Google Search Console', 'GSC', 'Search Console Setup',
      'Local SEO', 'Google Business', 'GBP', 'Local Listing',
    ],
  }

  return taskMap[connectionType] || taskMap.all
}

/**
 * Quick check if a specific connection task is now complete
 * Returns true if the task should be marked complete
 */
export async function checkConnectionTask(
  clientId: string,
  taskType: 'ga4' | 'gsc' | 'gbp'
): Promise<{ complete: boolean; evidence: string[] }> {
  const supabase = await createClient()

  const columnMap = {
    ga4: { token: 'google_oauth_tokens', property: 'selected_ga4_property_id' },
    gsc: { token: 'google_oauth_tokens', property: 'selected_gsc_site_url' },
    gbp: { token: 'google_oauth_tokens', property: 'selected_gbp_location_id' },
  }

  const columns = columnMap[taskType]

  const { data: client } = await supabase
    .from('clients')
    .select(`${columns.token}, ${columns.property}`)
    .eq('id', clientId)
    .single()

  if (!client) {
    return { complete: false, evidence: ['Client not found'] }
  }

  const hasToken = !!client[columns.token as keyof typeof client]
  const hasProperty = !!client[columns.property as keyof typeof client]

  if (hasToken && hasProperty) {
    const propertyValue = client[columns.property as keyof typeof client]
    return {
      complete: true,
      evidence: [
        `${taskType.toUpperCase()} connected`,
        `Property: ${propertyValue}`,
      ],
    }
  }

  return {
    complete: false,
    evidence: [
      hasToken ? 'OAuth token present' : 'Missing OAuth token',
      hasProperty ? 'Property selected' : 'No property selected',
    ],
  }
}
