/**
 * Microsoft Clarity Data Fetching Route
 *
 * Fetches user behavior analytics from Microsoft Clarity
 * CRITICAL: Respects 10 requests/day limit!
 *
 * Usage: POST /api/analytics/clarity/fetch
 * Body: { clientId: "xxx", numOfDays?: 1|2|3 }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, numOfDays = 3 } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId' },
        { status: 400 }
      )
    }

    if (![1, 2, 3].includes(numOfDays)) {
      return NextResponse.json(
        { error: 'numOfDays must be 1, 2, or 3' },
        { status: 400 }
      )
    }

    // Get client credentials from database
    const supabase = await createClient()
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('clarity_api_token, clarity_project_id, clarity_connected_at, clarity_daily_requests, clarity_last_request_date')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    if (!client.clarity_api_token) {
      return NextResponse.json(
        { error: 'Microsoft Clarity not connected for this client' },
        { status: 400 }
      )
    }

    // Check rate limit (10 requests/day)
    const today = new Date().toISOString().split('T')[0]
    const lastRequestDate = client.clarity_last_request_date
    const dailyRequests = lastRequestDate === today ? (client.clarity_daily_requests || 0) : 0

    if (dailyRequests >= 10) {
      return NextResponse.json({
        error: 'Daily rate limit exceeded',
        message: 'Microsoft Clarity allows only 10 API requests per day. Please try again tomorrow.',
        requestsUsed: 10,
        requestsRemaining: 0,
        resetTime: 'Midnight UTC',
      }, { status: 429 })
    }

    const apiToken = client.clarity_api_token

    // Fetch Clarity insights
    const clarityUrl = `https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=${numOfDays}`

    const clarityResponse = await fetch(clarityUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!clarityResponse.ok) {
      const errorText = await clarityResponse.text()
      console.error('Clarity API error:', errorText)

      if (clarityResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API token. Please reconnect Microsoft Clarity.' },
          { status: 401 }
        )
      }

      if (clarityResponse.status === 429) {
        return NextResponse.json({
          error: 'Clarity rate limit exceeded at their end',
          message: 'Clarity API returned 429. This may resolve shortly or you may have hit the 10/day limit.',
        }, { status: 429 })
      }

      return NextResponse.json(
        { error: 'Failed to fetch Clarity data' },
        { status: clarityResponse.status }
      )
    }

    const clarityData = await clarityResponse.json()

    // Update request counter
    const newRequestCount = dailyRequests + 1
    await supabase
      .from('clients')
      .update({
        clarity_daily_requests: newRequestCount,
        clarity_last_request_date: today,
      })
      .eq('id', clientId)

    // Parse and format the response
    const data = clarityData || {}

    return NextResponse.json({
      success: true,
      data: {
        sessions: data.sessions || 0,
        pageviews: data.pageviews || 0,
        avg_session_duration: data.avgSessionDuration || 0,
        bounce_rate: data.bounceRate || 0,
        rage_clicks: data.rageClicks || 0,
        dead_clicks: data.deadClicks || 0,
        js_errors: data.jsErrors || 0,
        popular_pages: data.popularPages || [],
        device_breakdown: data.deviceBreakdown || [],
        browser_breakdown: data.browserBreakdown || [],
        country_breakdown: data.countryBreakdown || [],
      },
      meta: {
        numOfDays: numOfDays,
        requestsUsed: newRequestCount,
        requestsRemaining: 10 - newRequestCount,
        warning: newRequestCount >= 8 ? `Only ${10 - newRequestCount} requests left today!` : undefined,
      },
    })
  } catch (error: any) {
    console.error('Clarity fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Clarity data', message: error.message },
      { status: 500 }
    )
  }
}
