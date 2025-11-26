import { NextRequest, NextResponse } from 'next/server';
import { getAITrafficSummary } from '@/lib/attribution/results-sync';

/**
 * Get AI traffic summary for a client
 * GET /api/attribution/ai-traffic?clientId=xxx&days=30
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required parameter: clientId' },
        { status: 400 }
      );
    }

    const summary = await getAITrafficSummary(clientId, days);

    return NextResponse.json({
      success: true,
      summary,
      days,
    });
  } catch (error: any) {
    console.error('AI traffic summary error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch AI traffic summary',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
