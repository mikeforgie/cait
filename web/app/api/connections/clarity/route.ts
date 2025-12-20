/**
 * Microsoft Clarity Connection API
 *
 * POST /api/connections/clarity - Test and save Clarity connection
 * GET /api/connections/clarity?clientId=xxx - Get connection status
 * DELETE /api/connections/clarity?clientId=xxx - Remove connection
 *
 * Note: Clarity API has a 10 requests/day limit per project
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CLARITY_API_BASE = 'https://www.clarity.ms/export-data/api/v1'

interface ClarityApiResponse {
  projectId?: string
  projectName?: string
  error?: string
  message?: string
}

/**
 * Test Clarity API connection
 * Uses 1 of the 10 daily requests
 */
async function testClarityConnection(
  projectId: string,
  apiToken: string
): Promise<{
  success: boolean
  projectName?: string
  error?: string
  remainingRequests?: number
}> {
  try {
    // Test connection by fetching project info
    // Using the export endpoint with a minimal date range
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const startDate = yesterday.toISOString().split('T')[0]
    const endDate = today.toISOString().split('T')[0]

    const response = await fetch(
      `${CLARITY_API_BASE}/project/${projectId}/export?startDate=${startDate}&endDate=${endDate}&format=JSON`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Check rate limit headers
    const remainingRequests = response.headers.get('X-RateLimit-Remaining')

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid API token' }
      }
      if (response.status === 403) {
        return { success: false, error: 'Access denied. Make sure you are a project administrator.' }
      }
      if (response.status === 404) {
        return { success: false, error: 'Project not found. Check the Project ID.' }
      }
      if (response.status === 429) {
        return {
          success: false,
          error: 'Daily API limit reached (10 requests/day). Please try again tomorrow.',
          remainingRequests: 0,
        }
      }

      const errorText = await response.text()
      return { success: false, error: `Clarity API error: ${response.status} - ${errorText}` }
    }

    // If we get here, connection is successful
    return {
      success: true,
      projectName: projectId, // Clarity doesn't return project name in this endpoint
      remainingRequests: remainingRequests ? parseInt(remainingRequests, 10) : undefined,
    }
  } catch (error: any) {
    console.error('Clarity API test error:', error)
    return { success: false, error: error.message || 'Connection failed' }
  }
}

/**
 * Check and update daily request count
 */
async function checkAndUpdateDailyLimit(
  supabase: any,
  clientId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0]

  const { data: client } = await supabase
    .from('clients')
    .select('clarity_daily_requests, clarity_last_request_date')
    .eq('id', clientId)
    .single()

  if (!client) {
    return { allowed: true, remaining: 10 }
  }

  const lastRequestDate = client.clarity_last_request_date
  const dailyRequests = client.clarity_daily_requests || 0

  // Reset count if it's a new day
  if (lastRequestDate !== today) {
    return { allowed: true, remaining: 10 }
  }

  // Check if limit reached
  if (dailyRequests >= 10) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: 10 - dailyRequests }
}

/**
 * Increment daily request count
 */
async function incrementDailyCount(supabase: any, clientId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  const { data: client } = await supabase
    .from('clients')
    .select('clarity_daily_requests, clarity_last_request_date')
    .eq('id', clientId)
    .single()

  const lastRequestDate = client?.clarity_last_request_date
  const currentCount = lastRequestDate === today ? (client?.clarity_daily_requests || 0) : 0

  await supabase
    .from('clients')
    .update({
      clarity_daily_requests: currentCount + 1,
      clarity_last_request_date: today,
    })
    .eq('id', clientId)
}

/**
 * POST - Test and save Clarity connection
 */
export async function POST(request: NextRequest) {
  try {
    const { clientId, apiToken, projectId } = await request.json()

    if (!clientId || !apiToken || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, apiToken, projectId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check daily limit before testing
    const limitCheck = await checkAndUpdateDailyLimit(supabase, clientId)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Daily API limit reached (10 requests/day). Please try again tomorrow.',
          remainingRequests: 0,
        },
        { status: 429 }
      )
    }

    // Test connection (uses 1 API request)
    const testResult = await testClarityConnection(projectId, apiToken)

    // Increment our tracked count
    await incrementDailyCount(supabase, clientId)

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: testResult.error,
          remainingRequests: limitCheck.remaining - 1,
        },
        { status: 400 }
      )
    }

    // Save to database
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        clarity_api_token: apiToken,
        clarity_project_id: projectId,
        clarity_connected_at: new Date().toISOString(),
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
      message: 'Microsoft Clarity connected successfully',
      projectId,
      warning: 'Remember: Clarity API allows only 10 requests per day.',
      remainingRequests: limitCheck.remaining - 1,
    })
  } catch (error: any) {
    console.error('Clarity connection error:', error)
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
      .select('clarity_api_token, clarity_project_id, clarity_connected_at, clarity_daily_requests, clarity_last_request_date')
      .eq('id', clientId)
      .single()

    if (error || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const isConnected = !!(client.clarity_api_token && client.clarity_project_id)

    // Calculate remaining requests
    const today = new Date().toISOString().split('T')[0]
    const dailyRequests = client.clarity_last_request_date === today
      ? (client.clarity_daily_requests || 0)
      : 0
    const remainingRequests = 10 - dailyRequests

    return NextResponse.json({
      connected: isConnected,
      projectId: client.clarity_project_id,
      connectedAt: client.clarity_connected_at,
      remainingRequests,
    })
  } catch (error: any) {
    console.error('Error fetching Clarity status:', error)
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
        clarity_api_token: null,
        clarity_project_id: null,
        clarity_connected_at: null,
        clarity_daily_requests: 0,
        clarity_last_request_date: null,
      })
      .eq('id', clientId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Clarity connection removed',
    })
  } catch (error: any) {
    console.error('Error removing Clarity connection:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove connection' },
      { status: 500 }
    )
  }
}
