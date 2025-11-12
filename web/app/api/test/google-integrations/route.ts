/**
 * Test endpoint for Google Analytics & Search Console integrations
 *
 * Tests:
 * 1. GA4 credentials and API access
 * 2. GSC credentials and API access
 * 3. Sample data retrieval
 *
 * Usage:
 * POST /api/test/google-integrations
 * Body: {
 *   "ga4PropertyId": "123456789",
 *   "gscSiteUrl": "https://example.com"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { googleAnalytics } from '@/lib/api/google-analytics'
import { googleSearchConsole } from '@/lib/api/google-search-console'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ga4PropertyId, gscSiteUrl } = body

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    }

    // Test GA4 Integration
    if (ga4PropertyId) {
      console.log('Testing GA4 integration...')
      try {
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]

        const metrics = await googleAnalytics.getMetrics(
          ga4PropertyId,
          startDate,
          endDate
        )

        results.tests.ga4 = {
          status: 'SUCCESS',
          credentials: 'Valid',
          api_access: 'Working',
          sample_data: {
            date_range: `${startDate} to ${endDate}`,
            sessions: metrics.sessions,
            users: metrics.users,
            pageviews: metrics.pageviews,
            bounce_rate: `${(metrics.bounce_rate * 100).toFixed(2)}%`,
          },
        }
      } catch (error: any) {
        results.tests.ga4 = {
          status: 'FAILED',
          error: error.message,
          details: error.stack,
        }
      }
    } else {
      results.tests.ga4 = {
        status: 'SKIPPED',
        reason: 'No ga4PropertyId provided',
      }
    }

    // Test GSC Integration
    if (gscSiteUrl) {
      console.log('Testing GSC integration...')
      try {
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]

        const metrics = await googleSearchConsole.getMetrics(
          gscSiteUrl,
          startDate,
          endDate
        )

        const topQueries = await googleSearchConsole.getTopQueries(
          gscSiteUrl,
          startDate,
          endDate,
          5
        )

        results.tests.gsc = {
          status: 'SUCCESS',
          credentials: 'Valid',
          api_access: 'Working',
          sample_data: {
            date_range: `${startDate} to ${endDate}`,
            total_clicks: metrics.total_clicks,
            total_impressions: metrics.total_impressions,
            avg_ctr: `${(metrics.avg_ctr * 100).toFixed(2)}%`,
            avg_position: metrics.avg_position.toFixed(1),
            top_queries: topQueries.slice(0, 3).map(q => ({
              query: q.query,
              clicks: q.clicks,
              impressions: q.impressions,
            })),
          },
        }
      } catch (error: any) {
        results.tests.gsc = {
          status: 'FAILED',
          error: error.message,
          details: error.stack,
        }
      }
    } else {
      results.tests.gsc = {
        status: 'SKIPPED',
        reason: 'No gscSiteUrl provided',
      }
    }

    // Summary
    const ga4Status = results.tests.ga4?.status || 'NOT_TESTED'
    const gscStatus = results.tests.gsc?.status || 'NOT_TESTED'

    results.summary = {
      ga4: ga4Status,
      gsc: gscStatus,
      overall: ga4Status === 'SUCCESS' || gscStatus === 'SUCCESS' ? 'PARTIAL_SUCCESS' :
               (ga4Status === 'FAILED' || gscStatus === 'FAILED') ? 'FAILED' : 'NOT_TESTED',
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json(
      {
        error: 'Test failed',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Google Integrations Test Endpoint',
    usage: 'POST with { ga4PropertyId, gscSiteUrl }',
    example: {
      ga4PropertyId: '123456789',
      gscSiteUrl: 'https://example.com',
    },
    documentation: {
      ga4: 'Find your property ID in GA4: Admin > Property Settings > Property ID',
      gsc: 'Use the full URL including https:// and domain',
    },
  })
}
