/**
 * Microsoft Clarity Disconnect Route
 *
 * Removes Microsoft Clarity connection for a client
 *
 * Usage: POST /api/auth/clarity/disconnect
 * Body: { clientId: "xxx" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Remove Clarity connection data
    const { error } = await supabase
      .from('clients')
      .update({
        clarity_api_token: null,
        clarity_project_id: null,
        clarity_connected_at: null,
        clarity_daily_requests: 0,
        clarity_last_request_date: null,
      })
      .eq('id', clientId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Microsoft Clarity disconnected',
    })
  } catch (error: any) {
    console.error('Clarity disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect', message: error.message },
      { status: 500 }
    )
  }
}
