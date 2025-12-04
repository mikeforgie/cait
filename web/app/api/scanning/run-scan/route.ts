import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runTechnicalScan, type ScanProgress } from '@/lib/scanning/technical-scanner';
import { autoCompleteTodos } from '@/lib/scanning/auto-complete';

/**
 * Run technical SEO scan
 * POST /api/scanning/run-scan
 *
 * Streams progress updates as JSON lines
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, websiteUrl, triggeredBy = 'manual' } = body;

    if (!clientId || !websiteUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, websiteUrl' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify client exists
    const { data: client } = await supabase
      .from('clients')
      .select('id, website')
      .eq('id', clientId)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create scan record
    const { data: scan } = await supabase
      .from('seo_scans')
      .insert({
        client_id: clientId,
        scan_type: 'full',
        scan_status: 'running',
        triggered_by: triggeredBy,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!scan) {
      return NextResponse.json(
        { error: 'Failed to create scan record' },
        { status: 500 }
      );
    }

    const scanId = scan.id;

    // Create a TransformStream for streaming responses
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send progress update
    const sendProgress = async (data: any) => {
      await writer.write(encoder.encode(JSON.stringify(data) + '\n'));
    };

    // Start scanning in the background
    (async () => {
      try {
        const startTime = Date.now();

        // Run technical scan
        await sendProgress({
          stage: 'scanning',
          message: 'Starting technical SEO scan...',
          progress: 0,
        });

        const scanResult = await runTechnicalScan(websiteUrl, {
          maxPages: 20,
          onProgress: async (progress: ScanProgress) => {
            await sendProgress({
              stage: 'scanning',
              message: progress.message,
              progress: progress.progress * 0.7, // 0-70% for scanning
              currentUrl: progress.currentUrl,
            });

            // Update scan record with progress
            await supabase
              .from('seo_scans')
              .update({
                pages_scanned: scanResult.pages_scanned || 0,
              })
              .eq('id', scanId);
          },
        });

        // Store issues in database
        await sendProgress({
          stage: 'storing',
          message: 'Storing scan results...',
          progress: 75,
        });

        for (const issue of scanResult.issues) {
          await supabase.from('seo_issues').insert({
            client_id: clientId,
            scan_id: scanId,
            issue_type: issue.issue_type,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            affected_url: issue.affected_url,
            affected_element: issue.affected_element,
            fix_suggestion: issue.fix_suggestion,
            fix_complexity: issue.fix_complexity,
            issue_data: issue.issue_data || {},
            status: 'open',
            detected_at: new Date().toISOString(),
          });
        }

        // Count issue severities
        const criticalIssues = scanResult.issues.filter(i => i.severity === 'critical').length;
        const warnings = scanResult.issues.filter(i => i.severity === 'warning').length;
        const recommendations = scanResult.issues.filter(i => i.severity === 'recommendation').length;

        // Auto-complete todos
        await sendProgress({
          stage: 'autocomplete',
          message: 'Checking for completed tasks...',
          progress: 85,
        });

        const autoCompleteResult = await autoCompleteTodos(clientId, scanId, scanResult);

        // Update scan record with completion
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

        await supabase
          .from('seo_scans')
          .update({
            scan_status: 'completed',
            pages_scanned: scanResult.pages_scanned,
            total_pages_found: scanResult.pages_scanned,
            critical_issues: criticalIssues,
            warnings,
            recommendations,
            scan_results: {
              has_ssl: scanResult.has_ssl,
              has_sitemap: scanResult.has_sitemap,
              has_robots_txt: scanResult.has_robots_txt,
              meta_description_stats: scanResult.meta_description_stats,
              alt_text_stats: scanResult.alt_text_stats,
              broken_links: scanResult.broken_links,
              performance: scanResult.performance,
            },
            duration_seconds: durationSeconds,
            completed_at: new Date().toISOString(),
          })
          .eq('id', scanId);

        // Send completion message
        await sendProgress({
          stage: 'completed',
          message: 'Scan completed successfully!',
          progress: 100,
          details: {
            scanId,
            pages_scanned: scanResult.pages_scanned,
            issues_found: scanResult.issues.length,
            critical_issues: criticalIssues,
            warnings,
            recommendations,
            todos_completed: autoCompleteResult.todos_completed,
            todos_created: autoCompleteResult.todos_created,
            has_ssl: scanResult.has_ssl,
            has_sitemap: scanResult.has_sitemap,
            has_robots_txt: scanResult.has_robots_txt,
          },
        });

        await writer.close();
      } catch (error: any) {
        console.error('Scan error:', error);

        // Update scan record with error
        await supabase
          .from('seo_scans')
          .update({
            scan_status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', scanId);

        await sendProgress({
          stage: 'error',
          message: `Error: ${error.message}`,
          progress: 0,
          error: error.message,
        });

        await writer.close();
      }
    })();

    // Return streaming response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Run scan error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to run scan',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Get scan status and results
 * GET /api/scanning/run-scan?scanId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scanId = searchParams.get('scanId');
    const clientId = searchParams.get('clientId');

    if (!scanId && !clientId) {
      return NextResponse.json(
        { error: 'Missing required parameter: scanId or clientId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (scanId) {
      // Get specific scan
      const { data: scan } = await supabase
        .from('seo_scans')
        .select('*')
        .eq('id', scanId)
        .single();

      if (!scan) {
        return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
      }

      // Get issues for this scan
      const { data: issues } = await supabase
        .from('seo_issues')
        .select('*')
        .eq('scan_id', scanId)
        .order('severity', { ascending: true }) // Critical first
        .order('created_at', { ascending: false });

      return NextResponse.json({
        success: true,
        scan,
        issues: issues || [],
      });
    } else {
      // Get latest scan for client
      const { data: scan } = await supabase
        .from('seo_scans')
        .select('*')
        .eq('client_id', clientId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (!scan) {
        return NextResponse.json(
          {
            success: true,
            scan: null,
            message: 'No scans found for this client',
          },
          { status: 200 }
        );
      }

      // Get issues for latest scan
      const { data: issues } = await supabase
        .from('seo_issues')
        .select('*')
        .eq('scan_id', scan.id)
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false });

      return NextResponse.json({
        success: true,
        scan,
        issues: issues || [],
      });
    }
  } catch (error: any) {
    console.error('Get scan error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to get scan',
      },
      { status: 500 }
    );
  }
}
