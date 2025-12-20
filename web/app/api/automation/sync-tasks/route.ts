import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncClientTasks, syncAllClientsTasks } from '@/lib/automation/tasks'

/**
 * POST /api/automation/sync-tasks
 *
 * Sync tasks for one or all clients - adds any missing tasks from templates
 *
 * Body:
 *   - clientId?: string - If provided, sync only this client
 *   - all?: boolean - If true, sync all clients
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, all } = body

    if (all) {
      // Sync all clients
      const result = await syncAllClientsTasks()
      return NextResponse.json({
        success: true,
        message: `Synced ${result.clients} clients, added ${result.totalAdded} new tasks`,
        ...result,
      })
    } else if (clientId) {
      // Sync single client
      const result = await syncClientTasks(clientId)
      return NextResponse.json({
        success: true,
        message: `Added ${result.added} new tasks (${result.existing} already existed)`,
        ...result,
      })
    } else {
      return NextResponse.json(
        { error: 'Either clientId or all:true required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Sync tasks error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
