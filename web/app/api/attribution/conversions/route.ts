import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchGA4Conversions, syncConversions, getConversionSummary } from '@/lib/attribution/conversions-sync';

/**
 * Get conversion summary for a client
 * GET /api/attribution/conversions?clientId=xxx&days=30
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

    const summary = await getConversionSummary(clientId, days);

    return NextResponse.json({
      success: true,
      summary,
      days,
    });
  } catch (error: any) {
    console.error('Conversion summary error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch conversion summary',
      },
      { status: 500 }
    );
  }
}

/**
 * Sync conversions from GA4
 * POST /api/attribution/conversions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, days = 30 } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required field: clientId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get client's Google connection
    const { data: client } = await supabase
      .from('clients')
      .select('selected_ga4_property_id, google_access_token, google_refresh_token')
      .eq('id', clientId)
      .single();

    if (!client?.selected_ga4_property_id) {
      return NextResponse.json(
        { error: 'GA4 property not configured for this client' },
        { status: 400 }
      );
    }

    if (!client.google_access_token) {
      return NextResponse.json(
        { error: 'Google not connected for this client' },
        { status: 400 }
      );
    }

    // Fetch conversions from GA4
    const startDate = `${days}daysAgo`;
    const endDate = 'today';

    const conversions = await fetchGA4Conversions(
      client.selected_ga4_property_id,
      {
        access_token: client.google_access_token,
        refresh_token: client.google_refresh_token,
      },
      startDate,
      endDate
    );

    // Sync to database
    const result = await syncConversions(
      clientId,
      conversions,
      { startDate, endDate }
    );

    // Get updated summary
    const summary = await getConversionSummary(clientId, days);

    return NextResponse.json({
      success: true,
      message: 'Conversions synced successfully',
      result,
      summary,
    });
  } catch (error: any) {
    console.error('Conversion sync error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to sync conversions',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
