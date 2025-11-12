/**
 * Microsoft Clarity API Token Save Route
 *
 * Validates and saves Microsoft Clarity API token
 *
 * Usage: POST /api/auth/clarity/save-token
 * Body: { clientId: "xxx", apiToken: "xxx", projectId: "xxx" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, apiToken, projectId } = body

    if (!clientId || !apiToken) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId or apiToken' },
        { status: 400 }
      )
    }

    // Validate token name format (4-32 chars, alphanumeric with -, _, .)
    if (projectId && !/^[a-zA-Z0-9._-]{4,32}$/.test(projectId)) {
      return NextResponse.json({
        error: 'Invalid project ID format. Must be 4-32 characters: alphanumeric, hyphens, underscores, or periods only',
      }, { status: 400 })
    }

    // Validate API token by making a test request to Clarity API
    const testUrl = 'https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=1'

    const testResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('Clarity API validation failed:', errorText)

      if (testResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API token. Please check your Microsoft Clarity API token.' },
          { status: 401 }
        )
      }

      if (testResponse.status === 403) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Ensure you are a project administrator.' },
          { status: 403 }
        )
      }

      if (testResponse.status === 429) {
        return NextResponse.json({
          error: 'Rate limit exceeded. You have used all 10 daily API requests for this project. Please try again tomorrow.',
        }, { status: 429 })
      }

      return NextResponse.json(
        { error: 'Failed to validate API token with Microsoft Clarity' },
        { status: 400 }
      )
    }

    // Parse response to verify we can access the API
    try {
      const apiData = await testResponse.json()
      // If we got here, the token is valid
      console.log('Clarity API validation successful')
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid response from Microsoft Clarity API' },
        { status: 400 }
      )
    }

    // Save to database
    const supabase = await createClient()

    const { error } = await supabase
      .from('clients')
      .update({
        clarity_api_token: apiToken, // TODO: Encrypt this in production!
        clarity_project_id: projectId || null,
        clarity_connected_at: new Date().toISOString(),
        clarity_daily_requests: 1, // We just made one request to validate
        clarity_last_request_date: new Date().toISOString().split('T')[0], // Today's date
      })
      .eq('id', clientId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Microsoft Clarity connected successfully',
      warning: 'Remember: Clarity API has a strict limit of 10 requests per day per project. Use sparingly!',
      remainingRequests: 9, // We used 1 for validation
    })
  } catch (error: any) {
    console.error('Clarity save-token error:', error)
    return NextResponse.json(
      { error: 'Failed to save API token', message: error.message },
      { status: 500 }
    )
  }
}
