import { NextRequest, NextResponse } from 'next/server';
import { runAttributionEngine, getAttributionSummary } from '@/lib/attribution/ai-attribution-engine';

/**
 * Get attribution summary for a client
 * GET /api/attribution/run-engine?clientId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required parameter: clientId' },
        { status: 400 }
      );
    }

    const summary = await getAttributionSummary(clientId);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('Attribution summary error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch attribution summary',
      },
      { status: 500 }
    );
  }
}

/**
 * Run AI Attribution Engine
 * POST /api/attribution/run-engine
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, lookbackDays = 90, minConfidence = 0.3, dryRun = false } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required field: clientId' },
        { status: 400 }
      );
    }

    const result = await runAttributionEngine(clientId, {
      lookbackDays,
      minConfidence,
      dryRun,
    });

    return NextResponse.json({
      success: true,
      message: dryRun
        ? 'Attribution engine dry run completed'
        : 'Attribution engine completed',
      result: {
        runId: result.runId,
        actionsAnalyzed: result.actionsAnalyzed,
        resultsAnalyzed: result.resultsAnalyzed,
        attributionsCreated: result.attributionsCreated,
      },
      // Include top attributions in response
      topAttributions: result.attributions.slice(0, 10),
    });
  } catch (error: any) {
    console.error('Attribution engine error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to run attribution engine',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
