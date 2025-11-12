/**
 * Fetch GA4 Analytics Data
 *
 * Fetches analytics data from Google Analytics 4 for a client
 *
 * Usage: POST /api/analytics/ga4/fetch
 * Body: { clientId: "xxx", startDate?: "30daysAgo", endDate?: "today" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGA4Data } from '@/lib/services/ga4'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, startDate = '30daysAgo', endDate = 'today' } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get client with OAuth tokens and selected property
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, google_oauth_tokens, selected_ga4_property_id, ga4_properties')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check if Google is connected
    if (!client.google_oauth_tokens) {
      return NextResponse.json(
        { error: 'Google account not connected' },
        { status: 400 }
      )
    }

    // Check if GA4 property is selected
    if (!client.selected_ga4_property_id) {
      return NextResponse.json(
        { error: 'No GA4 property selected' },
        { status: 400 }
      )
    }

    console.log(`Fetching GA4 data for property ${client.selected_ga4_property_id}...`)

    // Fetch GA4 data
    const ga4Data = await fetchGA4Data(
      client.selected_ga4_property_id,
      client.google_oauth_tokens,
      startDate,
      endDate
    )

    // Find property name from stored properties
    const propertyInfo = client.ga4_properties?.find(
      (p: any) => p.property_id === client.selected_ga4_property_id
    )

    // Store in database
    const { error: insertError } = await supabase
      .from('ga4_reports')
      .upsert({
        client_id: clientId,
        property_id: client.selected_ga4_property_id,
        property_name: propertyInfo?.display_name || 'Unknown Property',
        start_date: startDate,
        end_date: endDate,
        total_users: ga4Data.metrics.totalUsers,
        new_users: ga4Data.metrics.newUsers,
        sessions: ga4Data.metrics.sessions,
        bounce_rate: ga4Data.metrics.bounceRate,
        avg_session_duration: ga4Data.metrics.avgSessionDuration,
        pageviews: ga4Data.metrics.pageviews,
        events_count: ga4Data.metrics.eventsCount,
        top_pages: ga4Data.topPages,
        top_sources: ga4Data.topSources,
        daily_metrics: ga4Data.dailyMetrics,
        fetched_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error storing GA4 data:', insertError)
      // Don't fail the request, just log the error
    }

    console.log('✅ GA4 data fetched successfully')
    console.log(`Users: ${ga4Data.metrics.totalUsers}`)
    console.log(`Sessions: ${ga4Data.metrics.sessions}`)
    console.log(`Pageviews: ${ga4Data.metrics.pageviews}`)

    return NextResponse.json({
      success: true,
      data: ga4Data,
    })
  } catch (error: any) {
    console.error('Error fetching GA4 data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GA4 data', message: error.message },
      { status: 500 }
    )
  }
}
