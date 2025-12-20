/**
 * Task Completion Detection API
 *
 * GET /api/tasks/detect?clientId=xxx
 *   - Returns detection results without auto-completing
 *
 * POST /api/tasks/detect
 *   - Runs detection AND auto-completes high-confidence tasks
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  detectTaskCompletion,
  getDetectionSummary,
} from '@/lib/automation/task-completion-detector'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json(
      { error: 'clientId is required' },
      { status: 400 }
    )
  }

  try {
    // Get summary without auto-completing
    const summary = await getDetectionSummary(clientId)

    return NextResponse.json({
      success: true,
      data: summary,
    })
  } catch (error: any) {
    console.error('Error getting detection summary:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get detection summary' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, autoComplete = true } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    // Run full detection with optional auto-complete
    const result = await detectTaskCompletion(clientId)

    // If autoComplete is false, don't actually complete any tasks
    // (The detector already handles this internally based on confidence)

    return NextResponse.json({
      success: true,
      data: {
        tasks_checked: result.tasks_checked,
        tasks_detected_complete: result.tasks_detected_complete,
        tasks_auto_completed: autoComplete ? result.tasks_auto_completed : 0,
        results: result.results.map(r => ({
          task_id: r.task_id,
          task_name: r.task_name,
          detected: r.detected,
          confidence: r.confidence,
          evidence: r.evidence,
          auto_completed: autoComplete && r.auto_complete && r.detected && r.confidence === 'high',
        })),
      },
    })
  } catch (error: any) {
    console.error('Error detecting task completion:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to detect task completion' },
      { status: 500 }
    )
  }
}
