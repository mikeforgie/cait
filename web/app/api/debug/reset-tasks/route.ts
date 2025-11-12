import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID required' },
        { status: 400 }
      )
    }

    console.log('Resetting tasks for client:', clientId)

    // Reset keyword research and technical audit tasks
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'pending', completed_at: null })
      .eq('client_id', clientId)
      .or('name.ilike.%Keyword Research%,name.ilike.%Technical%Audit%')
      .select()

    if (error) {
      console.error('Error resetting tasks:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('Reset', data?.length, 'tasks')
    console.log('Tasks reset:', data?.map(t => t.name))

    return NextResponse.json({
      success: true,
      tasksReset: data?.length || 0,
      tasks: data?.map(t => t.name) || [],
    })
  } catch (error) {
    console.error('Reset tasks error:', error)
    return NextResponse.json(
      {
        error: 'Failed to reset tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
