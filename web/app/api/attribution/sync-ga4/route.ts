import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchGA4Data } from '@/lib/services/ga4';
import { syncGA4TrafficResults, syncAITrafficResults } from '@/lib/attribution/results-sync';

/**
 * Sync GA4 data to attribution system
 * POST /api/attribution/sync-ga4
 *
 * Fetches GA4 data and transforms it into seo_results for attribution analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, days = 7 } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required field: clientId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get client's Google connection
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('platform', 'google')
      .eq('status', 'connected')
      .single();

    if (!connection || !connection.credentials) {
      return NextResponse.json(
        { error: 'Google Analytics not connected for this client' },
        { status: 400 }
      );
    }

    // Get GA4 property ID
    const { data: client } = await supabase
      .from('clients')
      .select('ga4_property_id')
      .eq('id', clientId)
      .single();

    if (!client?.ga4_property_id) {
      return NextResponse.json(
        { error: 'GA4 property ID not configured for this client' },
        { status: 400 }
      );
    }

    // Fetch GA4 data
    const startDate = `${days}daysAgo`;
    const endDate = 'today';

    const ga4Data = await fetchGA4Data(
      client.ga4_property_id,
      connection.credentials,
      startDate,
      endDate
    );

    // Sync traffic results
    const trafficResults = await syncGA4TrafficResults(
      clientId,
      ga4Data.topPages,
      ga4Data.dateRange
    );

    // Sync AI traffic results
    const aiTrafficResults = await syncAITrafficResults(
      clientId,
      ga4Data.topSources,
      ga4Data.dateRange
    );

    return NextResponse.json({
      success: true,
      message: 'GA4 data synced to attribution system',
      results: {
        traffic: trafficResults.length,
        aiTraffic: aiTrafficResults.length,
        dateRange: ga4Data.dateRange,
      },
      data: {
        trafficResults,
        aiTrafficResults,
      },
    });
  } catch (error: any) {
    console.error('GA4 sync error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to sync GA4 data',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
