import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runTechnicalAudit, saveAuditReport } from '@/lib/automation/technical-audit'
import { updateTaskStatus } from '@/lib/automation/tasks'

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
    const { clientId, taskId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID required' },
        { status: 400 }
      )
    }

    // Update task status to in_progress
    if (taskId) {
      await updateTaskStatus(taskId, 'in_progress')
    }

    // Run technical audit automation
    const result = await runTechnicalAudit(clientId)

    // Save audit report
    await saveAuditReport(clientId, result)

    // Update task status to completed
    if (taskId) {
      await updateTaskStatus(taskId, 'completed', {
        overall_score: result.overall_score,
        critical_issues: result.critical_issues,
        warnings: result.warnings,
      })
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Technical audit error:', error)
    return NextResponse.json(
      {
        error: 'Failed to run technical audit',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
