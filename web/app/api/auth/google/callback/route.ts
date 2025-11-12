/**
 * Google OAuth Callback Route
 *
 * Handles OAuth callback from Google
 * - Exchanges code for tokens
 * - Discovers GA4 properties and GSC sites
 * - Stores in database
 * - Redirects back to client page
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getTokensFromCode,
  discoverGA4Properties,
  discoverGSCSites,
  discoverGBPLocations,
} from '@/lib/auth/google-oauth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // Contains client ID
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/clients/${state}?error=oauth_denied`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      )
    }

    const clientId = state // Client ID was passed as state

    // Exchange code for tokens
    console.log('Exchanging code for tokens...')
    const tokens = await getTokensFromCode(code)

    // Discover GA4 properties, GSC sites, and GBP locations
    console.log('Discovering GA4 properties...')
    const ga4Properties = await discoverGA4Properties(tokens)

    console.log('Discovering GSC sites...')
    const gscSites = await discoverGSCSites(tokens)

    console.log('Discovering GBP locations...')
    const gbpLocations = await discoverGBPLocations(tokens)

    // Store in database
    console.log('Saving to database...')
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        google_oauth_tokens: tokens,
        google_connected_at: new Date().toISOString(),
        ga4_properties: ga4Properties,
        gsc_sites: gscSites,
        gbp_locations: gbpLocations,
      })
      .eq('id', clientId)

    if (updateError) {
      throw updateError
    }

    console.log('✅ Google connected successfully!')
    console.log(`Found ${ga4Properties.length} GA4 properties`)
    console.log(`Found ${gscSites.length} GSC sites`)
    console.log(`Found ${gbpLocations.length} GBP locations`)

    // Redirect back to client page with success
    return NextResponse.redirect(
      new URL(`/dashboard/clients/${clientId}?success=google_connected`, request.url)
    )
  } catch (error: any) {
    console.error('OAuth callback error:', error)

    // Try to redirect with error
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    if (state) {
      return NextResponse.redirect(
        new URL(`/dashboard/clients/${state}?error=oauth_failed`, request.url)
      )
    }

    return NextResponse.json(
      { error: 'OAuth callback failed', message: error.message },
      { status: 500 }
    )
  }
}
