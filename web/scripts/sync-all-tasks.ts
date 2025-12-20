/**
 * Sync All Client Tasks Script
 *
 * Run with: npx tsx scripts/sync-all-tasks.ts
 *
 * This script adds any missing tasks from the task templates to all existing clients.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Import task templates inline to avoid server-side imports
import { TASK_TEMPLATES } from '../lib/automation/tasks'

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

async function syncClientTasks(clientId: string, clientName: string) {
  // Get existing tasks for this client
  const { data: existingTasks, error: fetchError } = await supabase
    .from('tasks')
    .select('name, month')
    .eq('client_id', clientId)

  if (fetchError) {
    throw new Error(`Failed to fetch tasks for ${clientName}: ${fetchError.message}`)
  }

  // Create a Set of existing task keys (name + month)
  const existingTaskKeys = new Set(
    (existingTasks || []).map(t => `${t.name}|${t.month}`)
  )

  // Filter templates to only include tasks that don't exist yet
  const newTasks = TASK_TEMPLATES.filter(
    template => !existingTaskKeys.has(`${template.name}|${template.month}`)
  ).map(template => ({
    client_id: clientId,
    month: template.month,
    name: template.name,
    description: template.description,
    category: template.category,
    automated: template.automated,
    automation_config: template.automation_config || null,
    status: 'pending' as TaskStatus,
  }))

  if (newTasks.length > 0) {
    const { error: insertError } = await supabase.from('tasks').insert(newTasks)

    if (insertError) {
      throw new Error(`Failed to insert tasks for ${clientName}: ${insertError.message}`)
    }
  }

  return {
    added: newTasks.length,
    existing: existingTaskKeys.size,
    total: existingTaskKeys.size + newTasks.length,
  }
}

async function main() {
  console.log('🔄 Syncing tasks for all clients...\n')

  // Get all clients
  const { data: clients, error: fetchError } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  if (fetchError) {
    console.error('Failed to fetch clients:', fetchError.message)
    process.exit(1)
  }

  if (!clients || clients.length === 0) {
    console.log('No clients found.')
    return
  }

  console.log(`Found ${clients.length} client(s)\n`)
  console.log(`Task templates available: ${TASK_TEMPLATES.length}\n`)

  let totalAdded = 0

  for (const client of clients) {
    try {
      const result = await syncClientTasks(client.id, client.name)
      totalAdded += result.added

      if (result.added > 0) {
        console.log(`✅ ${client.name}: Added ${result.added} new tasks (${result.existing} existed, ${result.total} total)`)
      } else {
        console.log(`⏭️  ${client.name}: No new tasks needed (${result.existing} already exist)`)
      }
    } catch (error) {
      console.error(`❌ ${client.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  console.log(`\n✨ Done! Added ${totalAdded} new tasks across ${clients.length} client(s)`)
}

main().catch(console.error)
