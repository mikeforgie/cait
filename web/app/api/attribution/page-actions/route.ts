import { NextRequest, NextResponse } from 'next/server';
import { getClientActions } from '@/lib/attribution/action-logger';

/**
 * Get actions for a specific page
 * GET /api/attribution/page-actions?clientId=xxx&targetUrl=yyy
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const targetUrl = searchParams.get('targetUrl');

    if (!clientId || !targetUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: clientId and targetUrl' },
        { status: 400 }
      );
    }

    // Get actions for this specific page
    const actions = await getClientActions(clientId, {
      targetUrl,
      limit: 20,
    });

    return NextResponse.json({
      success: true,
      actions,
      count: actions.length,
    });
  } catch (error: any) {
    console.error('Get page actions error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch page actions',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
