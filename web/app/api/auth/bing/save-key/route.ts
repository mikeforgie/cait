/**
 * Bing Webmaster Tools API Key Save Route
 *
 * Validates and saves Bing Webmaster Tools API key
 *
 * Usage: POST /api/auth/bing/save-key
 * Body: { clientId: "xxx", apiKey: "xxx", siteUrl: "https://example.com" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, apiKey, siteUrl } = body

    if (!clientId || !apiKey || !siteUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, apiKey, or siteUrl' },
        { status: 400 }
      )
    }

    // Validate site URL format
    try {
      new URL(siteUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid site URL format. Must be a full URL like https://example.com' },
        { status: 400 }
      )
    }

    // Validate API key by making a test request to Bing Webmaster API
    const testUrl = `https://ssl.bing.com/webmaster/api.svc/json/GetUserSites?apikey=${apiKey}`

    const testResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('Bing API validation failed:', errorText)

      if (testResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Bing Webmaster Tools API key.' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to validate API key with Bing Webmaster Tools' },
        { status: 400 }
      )
    }

    // Parse response to verify we can access the API
    const apiData = await testResponse.json()

    if (!apiData || !apiData.d) {
      return NextResponse.json(
        { error: 'Invalid response from Bing Webmaster Tools API' },
        { status: 400 }
      )
    }

    // Check if the specified siteUrl is in the user's verified sites
    const userSites = apiData.d as Array<{ Url: string }>
    const siteNormalized = siteUrl.toLowerCase().replace(/\/$/, '')
    const siteExists = userSites.some((site) =>
      site.Url.toLowerCase().replace(/\/$/, '') === siteNormalized
    )

    if (!siteExists) {
      return NextResponse.json({
        error: `The site ${siteUrl} is not verified in your Bing Webmaster Tools account. Please verify it first.`,
        availableSites: userSites.map((s) => s.Url),
      }, { status: 400 })
    }

    // Save to database
    const supabase = await createClient()

    const { error } = await supabase
      .from('clients')
      .update({
        bing_api_key: apiKey, // TODO: Encrypt this in production!
        bing_site_url: siteUrl,
        bing_connected_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Bing Webmaster Tools connected successfully',
      siteUrl,
    })
  } catch (error: any) {
    console.error('Bing save-key error:', error)
    return NextResponse.json(
      { error: 'Failed to save API key', message: error.message },
      { status: 500 }
    )
  }
}
