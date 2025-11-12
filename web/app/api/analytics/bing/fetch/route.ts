/**
 * Bing Webmaster Tools Data Fetching Route
 *
 * Fetches search analytics data from Bing Webmaster Tools
 *
 * Usage: POST /api/analytics/bing/fetch
 * Body: { clientId: "xxx", start_date?: "YYYY-MM-DD", end_date?: "YYYY-MM-DD" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface QueryStat {
  Query: string
  Clicks: number
  Impressions: number
  AvgClickPosition: number // Note: Divided by 10 to get actual position
}

interface RankTrafficStat {
  Date: string
  Clicks: number
  Impressions: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, start_date, end_date } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId' },
        { status: 400 }
      )
    }

    // Get client credentials from database
    const supabase = await createClient()
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('bing_api_key, bing_site_url, bing_connected_at')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    if (!client.bing_api_key || !client.bing_site_url) {
      return NextResponse.json(
        { error: 'Bing Webmaster Tools not connected for this client' },
        { status: 400 }
      )
    }

    const apiKey = client.bing_api_key
    const siteUrl = client.bing_site_url

    // Fetch Query Stats (top queries with clicks, impressions, position)
    const queryStatsUrl = `https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats?apikey=${apiKey}&siteUrl=${encodeURIComponent(siteUrl)}`

    const queryStatsResponse = await fetch(queryStatsUrl, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!queryStatsResponse.ok) {
      const errorText = await queryStatsResponse.text()
      console.error('Bing Query Stats API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch query statistics from Bing' },
        { status: queryStatsResponse.status }
      )
    }

    const queryStatsData = await queryStatsResponse.json()
    const queryStats = queryStatsData.d as QueryStat[]

    // Fetch Rank and Traffic Stats (time series data)
    const trafficStatsUrl = `https://ssl.bing.com/webmaster/api.svc/json/GetRankAndTrafficStats?apikey=${apiKey}&siteUrl=${encodeURIComponent(siteUrl)}`

    const trafficStatsResponse = await fetch(trafficStatsUrl, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!trafficStatsResponse.ok) {
      const errorText = await trafficStatsResponse.text()
      console.error('Bing Traffic Stats API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch traffic statistics from Bing' },
        { status: trafficStatsResponse.status }
      )
    }

    const trafficStatsData = await trafficStatsResponse.json()
    const trafficStats = trafficStatsData.d as RankTrafficStat[]

    // Calculate aggregated metrics
    const totalClicks = queryStats.reduce((sum, q) => sum + q.Clicks, 0)
    const totalImpressions = queryStats.reduce((sum, q) => sum + q.Impressions, 0)
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    // Calculate weighted average position
    const totalPositionWeight = queryStats.reduce(
      (sum, q) => sum + (q.AvgClickPosition / 10) * q.Impressions,
      0
    )
    const avgPosition = totalImpressions > 0 ? totalPositionWeight / totalImpressions : 0

    // Format top queries
    const topQueries = queryStats
      .slice(0, 20)
      .map((q) => ({
        query: q.Query,
        clicks: q.Clicks,
        impressions: q.Impressions,
        ctr: q.Impressions > 0 ? ((q.Clicks / q.Impressions) * 100).toFixed(2) : '0',
        position: (q.AvgClickPosition / 10).toFixed(1),
      }))

    // Format traffic trends (last 30 days)
    const last30Days = trafficStats.slice(-30).map((stat) => ({
      date: stat.Date,
      clicks: stat.Clicks,
      impressions: stat.Impressions,
      ctr: stat.Impressions > 0 ? ((stat.Clicks / stat.Impressions) * 100).toFixed(2) : '0',
    }))

    return NextResponse.json({
      success: true,
      data: {
        aggregated: {
          total_clicks: totalClicks,
          total_impressions: totalImpressions,
          avg_ctr: Number(avgCTR.toFixed(2)),
          avg_position: Number(avgPosition.toFixed(1)),
        },
        top_queries: topQueries,
        traffic_trends: last30Days,
        date_range: {
          start_date: trafficStats.length > 0 ? trafficStats[0].Date : null,
          end_date: trafficStats.length > 0 ? trafficStats[trafficStats.length - 1].Date : null,
        },
      },
    })
  } catch (error: any) {
    console.error('Bing fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Bing data', message: error.message },
      { status: 500 }
    )
  }
}
