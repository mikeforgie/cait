/**
 * Google Business Profile Metrics Fetch API
 *
 * Fetches GBP performance data and stores in database
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchAllGBPMetrics,
  aggregateGBPMetrics,
  type GBPMetrics
} from '@/lib/api/google-business-profile'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_id, start_date, end_date } = body

    if (!client_id) {
      return NextResponse.json(
        { error: 'Missing client_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get client with Google tokens and GBP locations
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('google_oauth_tokens, gbp_locations')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    if (!client.google_oauth_tokens) {
      return NextResponse.json(
        { error: 'Google not connected for this client' },
        { status: 400 }
      )
    }

    if (!client.gbp_locations || client.gbp_locations.length === 0) {
      return NextResponse.json(
        { error: 'No GBP locations found for this client' },
        { status: 404 }
      )
    }

    // Default to last 30 days if dates not provided
    const endDate = end_date || new Date().toISOString().split('T')[0]
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    console.log(`Fetching GBP metrics for ${client.gbp_locations.length} locations`)
    console.log(`Date range: ${startDate} to ${endDate}`)

    // Fetch metrics for all locations
    const metrics = await fetchAllGBPMetrics(
      client.google_oauth_tokens,
      client.gbp_locations,
      startDate,
      endDate
    )

    if (metrics.length === 0) {
      return NextResponse.json(
        {
          error: 'No GBP metrics available',
          message: 'This could be due to insufficient permissions or no data in date range'
        },
        { status: 404 }
      )
    }

    // Aggregate metrics
    const aggregated = aggregateGBPMetrics(metrics)

    // Store aggregated metrics in database
    const { error: insertError } = await supabase
      .from('metrics')
      .upsert({
        client_id,
        date: endDate,
        period_type: 'monthly',
        gbp_views: aggregated.total_views,
        gbp_actions: aggregated.total_actions,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,date,period_type'
      })

    if (insertError) {
      console.error('Error storing GBP metrics:', insertError)
    }

    console.log(`✅ GBP metrics fetched successfully`)
    console.log(`Total views: ${aggregated.total_views}`)
    console.log(`Total actions: ${aggregated.total_actions}`)

    return NextResponse.json({
      success: true,
      data: {
        locations: metrics,
        aggregated,
        date_range: {
          start_date: startDate,
          end_date: endDate
        }
      }
    })
  } catch (error: any) {
    console.error('GBP fetch error:', error)

    // Handle specific Google API errors
    if (error.message?.includes('403')) {
      return NextResponse.json(
        {
          error: 'Permission denied',
          message: 'The Google account does not have access to Business Profile Performance API. Please ensure the account has proper permissions.'
        },
        { status: 403 }
      )
    }

    if (error.message?.includes('401')) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Google tokens may have expired. Please reconnect your Google account.'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch GBP metrics',
        message: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint - fetch latest GBP metrics for a client
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const client_id = searchParams.get('client_id')

    if (!client_id) {
      return NextResponse.json(
        { error: 'Missing client_id parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get latest GBP metrics from database
    const { data: metrics, error } = await supabase
      .from('metrics')
      .select('date, gbp_views, gbp_actions, period_type')
      .eq('client_id', client_id)
      .not('gbp_views', 'is', null)
      .order('date', { ascending: false })
      .limit(12) // Last 12 months

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: metrics || []
    })
  } catch (error: any) {
    console.error('GBP GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch stored GBP metrics',
        message: error.message
      },
      { status: 500 }
    )
  }
}
