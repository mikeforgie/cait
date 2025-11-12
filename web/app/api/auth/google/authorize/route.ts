/**
 * Google OAuth Authorization Route
 *
 * Redirects user to Google OAuth consent screen
 *
 * Usage: GET /api/auth/google/authorize?clientId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/auth/google-oauth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId parameter' },
        { status: 400 }
      )
    }

    // Generate OAuth URL with client ID in state
    const authUrl = getAuthorizationUrl(clientId)

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('OAuth authorization error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth', message: error.message },
      { status: 500 }
    )
  }
}
