import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initializeClientTasks } from '@/lib/automation/tasks'

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

    // Get client ID from request
    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID required' },
        { status: 400 }
      )
    }

    // Initialize Month 0-12 tasks
    await initializeClientTasks(clientId)

    return NextResponse.json({
      success: true,
      message: 'Tasks initialized successfully',
    })
  } catch (error) {
    console.error('Initialize tasks error:', error)
    return NextResponse.json(
      {
        error: 'Failed to initialize tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
