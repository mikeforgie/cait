/**
 * Google OAuth Disconnect Route
 *
 * Removes Google OAuth connection for a client
 *
 * Usage: POST /api/auth/google/disconnect
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

    // Remove OAuth data and selections
    const { error } = await supabase
      .from('clients')
      .update({
        google_oauth_tokens: null,
        google_connected_at: null,
        ga4_properties: null,
        gsc_sites: null,
        gbp_locations: null,
        selected_ga4_property_id: null,
        selected_gsc_site_url: null,
        selected_gbp_location_id: null,
      })
      .eq('id', clientId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Google account disconnected',
    })
  } catch (error: any) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect', message: error.message },
      { status: 500 }
    )
  }
}
