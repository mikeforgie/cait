import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchGA4Data } from '@/lib/services/ga4';
import { syncGA4TrafficResults, syncAITrafficResults } from '@/lib/attribution/results-sync';
import { fetchGA4Conversions, syncConversions } from '@/lib/attribution/conversions-sync';
import { runAttributionEngine } from '@/lib/attribution/ai-attribution-engine';

/**
 * Scheduled Sync Endpoint
 * Called by cron job or Vercel Cron to run daily syncs
 *
 * GET /api/sync/scheduled?secret=xxx
 *
 * This should be called by:
 * - Vercel Cron (vercel.json)
 * - External cron service
 * - Supabase Edge Function
 */
export async function GET(request: NextRequest) {
  try {
    // Verify Vercel Cron authorization header or secret query param
    const authHeader = request.headers.get('authorization');
    const searchParams = request.nextUrl.searchParams;
    const secret = searchParams.get('secret');
    const syncType = searchParams.get('type') || 'all';

    // Check for Vercel Cron authorization header first, then fallback to query param
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isSecretParam = secret === process.env.CRON_SECRET;

    if (!isVercelCron && !isSecretParam) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get all active sync schedules that are due
    const { data: schedules } = await supabase
      .from('sync_schedules')
      .select('*, clients!client_id(*)')
      .eq('is_active', true)
      .lte('next_run_at', new Date().toISOString());

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No syncs due',
        synced: 0,
      });
    }

    const results: Array<{
      clientId: string;
      syncType: string;
      status: 'success' | 'failed';
      message: string;
    }> = [];

    for (const schedule of schedules) {
      const client = schedule.clients;
      if (!client) continue;

      // Skip if type filter doesn't match
      if (syncType !== 'all' && schedule.sync_type !== syncType) continue;

      try {
        let message = '';

        switch (schedule.sync_type) {
          case 'ga4':
            if (client.selected_ga4_property_id && client.google_access_token) {
              const ga4Data = await fetchGA4Data(
                client.selected_ga4_property_id,
                {
                  access_token: client.google_access_token,
                  refresh_token: client.google_refresh_token,
                },
                '7daysAgo',
                'today'
              );

              const trafficResults = await syncGA4TrafficResults(
                client.id,
                ga4Data.topPages,
                ga4Data.dateRange
              );

              const aiResults = await syncAITrafficResults(
                client.id,
                ga4Data.topSources,
                ga4Data.dateRange
              );

              message = `Synced ${trafficResults.length} traffic results, ${aiResults.length} AI traffic results`;
            } else {
              message = 'GA4 not configured';
            }
            break;

          case 'conversions':
            if (client.selected_ga4_property_id && client.google_access_token) {
              const conversions = await fetchGA4Conversions(
                client.selected_ga4_property_id,
                {
                  access_token: client.google_access_token,
                  refresh_token: client.google_refresh_token,
                },
                '7daysAgo',
                'today'
              );

              const syncResult = await syncConversions(
                client.id,
                conversions,
                { startDate: '7daysAgo', endDate: 'today' }
              );

              message = `Synced ${syncResult.synced} conversions`;
            } else {
              message = 'GA4 not configured';
            }
            break;

          case 'attribution':
            const attributionResult = await runAttributionEngine(client.id, {
              lookbackDays: 30,
              minConfidence: 0.3,
            });

            message = `Created ${attributionResult.attributionsCreated} attributions from ${attributionResult.actionsAnalyzed} actions`;
            break;

          case 'rankings':
            // Rankings check would go here
            // This typically requires DataForSEO or similar service
            message = 'Rankings sync not implemented in scheduled job';
            break;
        }

        // Update schedule
        await supabase
          .from('sync_schedules')
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: 'success',
            last_error: null,
          })
          .eq('id', schedule.id);

        results.push({
          clientId: client.id,
          syncType: schedule.sync_type,
          status: 'success',
          message,
        });
      } catch (error: any) {
        console.error(`Sync error for client ${client.id}:`, error);

        // Update schedule with error
        await supabase
          .from('sync_schedules')
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: 'failed',
            last_error: error.message,
          })
          .eq('id', schedule.id);

        results.push({
          clientId: client.id,
          syncType: schedule.sync_type,
          status: 'failed',
          message: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} syncs`,
      results,
    });
  } catch (error: any) {
    console.error('Scheduled sync error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Scheduled sync failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Configure sync schedules for a client
 * POST /api/sync/scheduled
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, schedules } = body;

    if (!clientId || !schedules) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, schedules' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const results = [];

    for (const schedule of schedules) {
      const { syncType, frequency = 'daily', hourOfDay = 6, isActive = true } = schedule;

      const { data, error } = await supabase
        .from('sync_schedules')
        .upsert({
          client_id: clientId,
          sync_type: syncType,
          frequency,
          hour_of_day: hourOfDay,
          is_active: isActive,
        })
        .select()
        .single();

      if (error) {
        results.push({ syncType, status: 'error', error: error.message });
      } else {
        results.push({ syncType, status: 'configured', data });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync schedules configured',
      results,
    });
  } catch (error: any) {
    console.error('Configure sync error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to configure sync schedules',
      },
      { status: 500 }
    );
  }
}
