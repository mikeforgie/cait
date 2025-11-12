/**
 * Task Automation System
 *
 * Manages Month 0-12 automation tasks based on CAIT roadmap
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type TaskCategory = Database['public']['Tables']['tasks']['Row']['category']
type TaskStatus = Database['public']['Tables']['tasks']['Row']['status']

export interface TaskTemplate {
  month: number
  name: string
  description: string
  category: TaskCategory
  automated: boolean
  automation_config?: {
    api?: string
    endpoint?: string
    parameters?: Record<string, any>
  }
}

/**
 * Month 0-12 Task Templates
 * Based on CAIT plan PDF roadmap
 */
export const TASK_TEMPLATES: TaskTemplate[] = [
  // Month 0: Onboarding & Foundation
  {
    month: 0,
    name: 'Client Interview & Onboarding',
    description: 'Send interview questionnaire and collect business information',
    category: 'analytics',
    automated: false, // Manual for now, AI later
  },
  {
    month: 0,
    name: 'Keyword Research (100 keywords)',
    description: 'Research and compile 100 target keywords with search volume, difficulty, and intent',
    category: 'keyword_research',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'keyword_ideas',
      parameters: { limit: 100 },
    },
  },
  {
    month: 0,
    name: 'Competitor Analysis (3 competitors)',
    description: 'Analyze top 3 competitors for keyword overlap and backlink strategies',
    category: 'keyword_research',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'competitors_domain',
      parameters: { limit: 3 },
    },
  },
  {
    month: 0,
    name: 'Technical SEO Audit',
    description: 'Comprehensive technical audit covering crawlability, speed, mobile, schema',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'technical_audit',
    },
  },
  {
    month: 0,
    name: 'Google Analytics 4 Setup',
    description: 'Verify GA4 tracking and set up goal conversions',
    category: 'analytics',
    automated: false,
  },
  {
    month: 0,
    name: 'Google Search Console Setup',
    description: 'Verify GSC access and submit sitemap',
    category: 'analytics',
    automated: false,
  },
  {
    month: 0,
    name: 'Backlink Profile Discovery',
    description: 'Discover and catalog all existing backlinks',
    category: 'backlinks',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'backlinks',
      parameters: { limit: 1000 },
    },
  },

  // Month 1: Content & Optimization
  {
    month: 1,
    name: 'Content Strategy (4 pieces)',
    description: 'Plan 4 content pieces targeting high-priority keywords',
    category: 'content',
    automated: false, // AI-assisted later
  },
  {
    month: 1,
    name: 'On-Page Optimization (Homepage + 3 pages)',
    description: 'Optimize title tags, meta descriptions, headers, and content',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 1,
    name: 'Local SEO Setup',
    description: 'Optimize Google Business Profile and local citations',
    category: 'local_seo',
    automated: false,
  },
  {
    month: 1,
    name: 'Rank Tracking Setup',
    description: 'Set up automated rank tracking for target keywords',
    category: 'analytics',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'ranked_keywords',
    },
  },

  // Month 2: Content Creation
  {
    month: 2,
    name: 'Content Creation (2 blog posts)',
    description: 'Write and publish 2 SEO-optimized blog posts',
    category: 'content',
    automated: false, // AI-assisted later
  },
  {
    month: 2,
    name: 'Internal Linking Optimization',
    description: 'Add strategic internal links to boost page authority',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 2,
    name: 'Monthly Performance Report',
    description: 'Generate and send monthly SEO performance report',
    category: 'analytics',
    automated: true,
    automation_config: {
      api: 'reporting',
      endpoint: 'monthly_report',
    },
  },

  // Months 3-12: Ongoing Optimization
  ...Array.from({ length: 10 }, (_, i) => {
    const month = i + 3
    return [
      {
        month,
        name: 'Content Creation (2 pieces)',
        description: 'Write and publish 2 SEO-optimized content pieces',
        category: 'content' as TaskCategory,
        automated: false,
      },
      {
        month,
        name: 'Backlink Outreach',
        description: 'Identify and reach out for 5 quality backlink opportunities',
        category: 'backlinks' as TaskCategory,
        automated: false,
      },
      {
        month,
        name: 'Rank Tracking & Analysis',
        description: 'Monitor keyword rankings and identify opportunities',
        category: 'analytics' as TaskCategory,
        automated: true,
        automation_config: {
          api: 'dataforseo',
          endpoint: 'ranked_keywords',
        },
      },
      {
        month,
        name: 'Monthly Performance Report',
        description: 'Generate and send monthly SEO performance report',
        category: 'analytics' as TaskCategory,
        automated: true,
        automation_config: {
          api: 'reporting',
          endpoint: 'monthly_report',
        },
      },
    ]
  }).flat(),

  // Quarterly strategy reviews
  {
    month: 3,
    name: 'Quarterly Strategy Review (Q1)',
    description: 'Review performance and adjust strategy for next quarter',
    category: 'analytics',
    automated: false,
  },
  {
    month: 6,
    name: 'Quarterly Strategy Review (Q2)',
    description: 'Review performance and adjust strategy for next quarter',
    category: 'analytics',
    automated: false,
  },
  {
    month: 9,
    name: 'Quarterly Strategy Review (Q3)',
    description: 'Review performance and adjust strategy for next quarter',
    category: 'analytics',
    automated: false,
  },
  {
    month: 12,
    name: 'Annual Strategy Review',
    description: 'Comprehensive annual review and planning for year 2',
    category: 'analytics',
    automated: false,
  },
]

/**
 * Initialize tasks for a new client
 */
export async function initializeClientTasks(clientId: string): Promise<void> {
  const supabase = await createClient()

  // Create all Month 0-12 tasks
  const tasks = TASK_TEMPLATES.map(template => ({
    client_id: clientId,
    month: template.month,
    name: template.name,
    description: template.description,
    category: template.category,
    automated: template.automated,
    automation_config: template.automation_config || null,
    status: 'pending' as TaskStatus,
  }))

  const { error } = await supabase.from('tasks').insert(tasks)

  if (error) {
    throw new Error(`Failed to initialize tasks: ${error.message}`)
  }
}

/**
 * Get tasks for specific month
 */
export async function getMonthTasks(
  clientId: string,
  month: number
): Promise<Database['public']['Tables']['tasks']['Row'][]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .eq('month', month)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return data || []
}

/**
 * Get all automated tasks that need to run
 */
export async function getAutomatedTasks(
  clientId: string,
  month?: number
): Promise<Database['public']['Tables']['tasks']['Row'][]> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .eq('automated', true)
    .eq('status', 'pending')

  if (month !== undefined) {
    query = query.eq('month', month)
  }

  const { data, error } = await query.order('month', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch automated tasks: ${error.message}`)
  }

  return data || []
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  result?: any
): Promise<void> {
  const supabase = await createClient()

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }

  if (result) {
    updates.automation_config = {
      ...(updates.automation_config || {}),
      last_result: result,
    }
  }

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`)
  }
}

/**
 * Get task completion percentage for client
 */
export async function getTaskProgress(
  clientId: string,
  month?: number
): Promise<{
  total: number
  completed: number
  in_progress: number
  pending: number
  percentage: number
}> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select('status')
    .eq('client_id', clientId)

  if (month !== undefined) {
    query = query.eq('month', month)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch task progress: ${error.message}`)
  }

  const tasks = data || []
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const in_progress = tasks.filter(t => t.status === 'in_progress').length
  const pending = tasks.filter(t => t.status === 'pending').length

  return {
    total,
    completed,
    in_progress,
    pending,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * Get next task to work on
 */
export async function getNextTask(
  clientId: string
): Promise<Database['public']['Tables']['tasks']['Row'] | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'pending')
    .order('month', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw new Error(`Failed to fetch next task: ${error.message}`)
  }

  return data || null
}
