/**
 * Bing Webmaster Tools Connection API
 *
 * POST /api/connections/bing - Test and save Bing connection
 * GET /api/connections/bing?clientId=xxx - Get connection status
 * DELETE /api/connections/bing?clientId=xxx - Remove connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BING_API_BASE = 'https://ssl.bing.com/webmaster/api.svc/json'

interface BingApiResponse {
  d?: any
  ErrorCode?: number
  Message?: string
}

/**
 * Test Bing API connection and get site list
 */
async function testBingConnection(apiKey: string): Promise<{
  success: boolean
  sites?: string[]
  error?: string
}> {
  try {
    // Get list of sites from Bing Webmaster Tools
    const response = await fetch(
      `${BING_API_BASE}/GetUserSites?apikey=${encodeURIComponent(apiKey)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid API key' }
      }
      return { success: false, error: `Bing API error: ${response.status}` }
    }

    const data: BingApiResponse = await response.json()

    if (data.ErrorCode) {
      return { success: false, error: data.Message || 'Bing API error' }
    }

    // Extract site URLs from response
    const sites = data.d?.map((site: any) => site.Url) || []

    return { success: true, sites }
  } catch (error: any) {
    console.error('Bing API test error:', error)
    return { success: false, error: error.message || 'Connection failed' }
  }
}

/**
 * Verify a specific site is accessible
 */
async function verifySiteAccess(
  apiKey: string,
  siteUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get site info to verify access
    const response = await fetch(
      `${BING_API_BASE}/GetSiteIndex?apikey=${encodeURIComponent(apiKey)}&siteUrl=${encodeURIComponent(siteUrl)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid API key' }
      }
      if (response.status === 404) {
        return { success: false, error: 'Site not found in your Bing account' }
      }
      return { success: false, error: `Bing API error: ${response.status}` }
    }

    const data: BingApiResponse = await response.json()

    if (data.ErrorCode) {
      return { success: false, error: data.Message || 'Site access denied' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Bing site verification error:', error)
    return { success: false, error: error.message || 'Verification failed' }
  }
}

/**
 * POST - Test and save Bing connection
 */
export async function POST(request: NextRequest) {
  try {
    const { clientId, apiKey, siteUrl } = await request.json()

    if (!clientId || !apiKey || !siteUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, apiKey, siteUrl' },
        { status: 400 }
      )
    }

    // Test connection first
    const testResult = await testBingConnection(apiKey)

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: testResult.error,
        },
        { status: 400 }
      )
    }

    // Check if the requested site is in the user's account
    const normalizedSiteUrl = siteUrl.replace(/\/$/, '')
    const siteExists = testResult.sites?.some(
      (site) => site.replace(/\/$/, '').toLowerCase() === normalizedSiteUrl.toLowerCase()
    )

    if (!siteExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Site not found in your Bing Webmaster Tools account',
          availableSites: testResult.sites,
        },
        { status: 400 }
      )
    }

    // Verify we can access this specific site
    const verifyResult = await verifySiteAccess(apiKey, siteUrl)
    if (!verifyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: verifyResult.error,
          availableSites: testResult.sites,
        },
        { status: 400 }
      )
    }

    // Save to database
    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from('clients')
      .update({
        bing_api_key: apiKey,
        bing_site_url: siteUrl,
        bing_connected_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to save connection' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bing Webmaster Tools connected successfully',
      siteUrl,
    })
  } catch (error: any) {
    console.error('Bing connection error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Connection failed' },
      { status: 500 }
    )
  }
}

/**
 * GET - Check connection status
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json(
      { error: 'clientId is required' },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()

    const { data: client, error } = await supabase
      .from('clients')
      .select('bing_api_key, bing_site_url, bing_connected_at')
      .eq('id', clientId)
      .single()

    if (error || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const isConnected = !!(client.bing_api_key && client.bing_site_url)

    return NextResponse.json({
      connected: isConnected,
      siteUrl: client.bing_site_url,
      connectedAt: client.bing_connected_at,
    })
  } catch (error: any) {
    console.error('Error fetching Bing status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get connection status' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove connection
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json(
      { error: 'clientId is required' },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from('clients')
      .update({
        bing_api_key: null,
        bing_site_url: null,
        bing_connected_at: null,
      })
      .eq('id', clientId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Bing connection removed',
    })
  } catch (error: any) {
    console.error('Error removing Bing connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove connection' },
      { status: 500 }
    )
  }
}
