import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { batchCheckRankings, getDataForSEOCredentials } from '@/lib/seo/dataforseo-client';
import { syncRankingResults } from '@/lib/attribution/results-sync';

/**
 * Check keyword rankings using DataForSEO
 * POST /api/rankings/check
 *
 * Checks rankings for all tracked keywords and stores in keyword_rankings table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required field: clientId' },
        { status: 400 }
      );
    }

    // Get DataForSEO credentials
    const credentials = getDataForSEOCredentials();
    if (!credentials) {
      return NextResponse.json(
        { error: 'DataForSEO credentials not configured. Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to environment variables.' },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Get client domain
    const { data: client } = await supabase
      .from('clients')
      .select('domain')
      .eq('id', clientId)
      .single();

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get all tracked keywords for this client
    const { data: trackedKeywords } = await supabase
      .from('tracked_keywords')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true);

    if (!trackedKeywords || trackedKeywords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tracked keywords found for this client',
        checked: 0,
      });
    }

    // Check rankings using DataForSEO
    const keywordChecks = trackedKeywords.map((kw) => ({
      keyword: kw.keyword,
      targetDomain: client.domain,
    }));

    const rankingResults = await batchCheckRankings(keywordChecks, credentials, {
      searchEngine: 'google',
      locationCode: 2840, // US
      deviceType: 'desktop',
    });

    // Store results in keyword_rankings table
    const rankingRecords = [];
    const resultsForSync = [];

    for (const result of rankingResults) {
      // Find the tracked keyword to get previous position
      const trackedKeyword = trackedKeywords.find((kw) => kw.keyword === result.keyword);
      const previousPosition = trackedKeyword?.current_position;

      const positionChange = previousPosition && result.position
        ? (previousPosition - result.position) // Positive = improved
        : null;

      // Insert into keyword_rankings
      const { data: rankingRecord } = await supabase
        .from('keyword_rankings')
        .insert({
          client_id: clientId,
          keyword: result.keyword,
          target_url: result.url || trackedKeyword?.target_url,
          position: result.position || 0,
          previous_position: previousPosition,
          position_change: positionChange,
          search_engine: result.searchEngine,
          search_location: result.location,
          device_type: 'desktop',
          measured_at: result.checkedAt.toISOString(),
        })
        .select()
        .single();

      if (rankingRecord) {
        rankingRecords.push(rankingRecord);

        // Prepare for seo_results sync
        if (result.position) {
          resultsForSync.push({
            keyword: result.keyword,
            position: result.position,
            targetUrl: result.url || trackedKeyword?.target_url || '',
            previousPosition,
          });
        }
      }
    }

    // Sync significant ranking changes to seo_results
    const seoResults = await syncRankingResults(clientId, resultsForSync);

    return NextResponse.json({
      success: true,
      message: `Checked ${rankingResults.length} keywords`,
      checked: rankingResults.length,
      significantChanges: seoResults.length,
      results: rankingRecords,
      seoResults,
    });
  } catch (error: any) {
    console.error('Rankings check error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to check rankings',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
