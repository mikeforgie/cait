/**
 * Bing Webmaster Tools Disconnect Route
 *
 * Removes Bing Webmaster Tools connection for a client
 *
 * Usage: POST /api/auth/bing/disconnect
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

    // Remove Bing connection data
    const { error } = await supabase
      .from('clients')
      .update({
        bing_api_key: null,
        bing_site_url: null,
        bing_connected_at: null,
      })
      .eq('id', clientId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Bing Webmaster Tools disconnected',
    })
  } catch (error: any) {
    console.error('Bing disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect', message: error.message },
      { status: 500 }
    )
  }
}
