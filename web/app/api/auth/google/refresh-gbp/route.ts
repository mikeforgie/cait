/**
 * Refresh GBP Locations API
 *
 * Re-discovers Google Business Profile locations using stored OAuth tokens.
 * Useful when the initial discovery failed due to quota limits.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { discoverGBPLocations, refreshAccessToken } from '@/lib/auth/google-oauth'

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get client's stored OAuth tokens
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('google_oauth_tokens')
      .eq('id', clientId)
      .single()

    if (fetchError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    if (!client.google_oauth_tokens) {
      return NextResponse.json(
        { error: 'Google account not connected' },
        { status: 400 }
      )
    }

    let tokens = client.google_oauth_tokens

    // Refresh access token if needed
    if (tokens.refresh_token) {
      try {
        console.log('Refreshing access token...')
        const newTokens = await refreshAccessToken(tokens.refresh_token)
        tokens = { ...tokens, ...newTokens }

        // Update stored tokens
        await supabase
          .from('clients')
          .update({ google_oauth_tokens: tokens })
          .eq('id', clientId)
      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError.message)
        // Continue with existing tokens, they might still work
      }
    }

    // Discover GBP locations with retry logic
    console.log('Discovering GBP locations...')
    const result = await discoverGBPLocations(tokens)

    // Check if quota was exceeded after all retries
    if (result.quotaExceeded) {
      console.log('⚠️ GBP quota exceeded after retries')
      return NextResponse.json({
        success: false,
        error: result.error || 'Google API quota exceeded. Please wait 1-2 minutes and try again.',
        quotaExceeded: true,
        locations: [],
        count: 0,
      })
    }

    // Check if there was another error
    if (result.error && result.locations.length === 0) {
      console.log('⚠️ GBP discovery error:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error,
        locations: [],
        count: 0,
      })
    }

    // Update database with discovered locations
    const { error: updateError } = await supabase
      .from('clients')
      .update({ gbp_locations: result.locations })
      .eq('id', clientId)

    if (updateError) {
      throw updateError
    }

    console.log(`✅ Found ${result.locations.length} GBP locations`)

    return NextResponse.json({
      success: true,
      locations: result.locations,
      count: result.locations.length,
    })
  } catch (error: any) {
    console.error('GBP refresh error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to refresh GBP locations' },
      { status: 500 }
    )
  }
}
