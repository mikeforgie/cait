import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crawlWebsite, type CrawlProgress } from '@/lib/intelligence/website-crawler';
import {
  analyzeBusinessKnowledge,
  type AnalysisProgress,
} from '@/lib/intelligence/ai-analyzer';

/**
 * Scan a website and extract business knowledge
 * POST /api/intelligence/scan-website
 *
 * Streams progress updates as JSON lines
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, websiteUrl } = body;

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

    // Create scan log
    const { data: scanLog } = await supabase
      .from('website_scan_logs')
      .insert({
        client_id: clientId,
        website_url: websiteUrl,
        scan_status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!scanLog) {
      return NextResponse.json(
        { error: 'Failed to create scan log' },
        { status: 500 }
      );
    }

    const scanLogId = scanLog.id;

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

        // Step 1: Crawl website
        await sendProgress({
          stage: 'crawling',
          message: 'Starting website crawl...',
          progress: 10,
        });

        const crawlResult = await crawlWebsite(websiteUrl, {
          maxPages: 30,
          onProgress: async (progress: CrawlProgress) => {
            await sendProgress({
              stage: 'crawling',
              message: progress.message,
              progress: 10 + (progress.pagesCrawled / Math.max(progress.pagesFound, 1)) * 30,
              details: {
                pagesFound: progress.pagesFound,
                pagesCrawled: progress.pagesCrawled,
                currentPage: progress.currentPage,
              },
            });

            // Update scan log
            await supabase
              .from('website_scan_logs')
              .update({
                pages_found: progress.pagesFound,
                pages_crawled: progress.pagesCrawled,
              })
              .eq('id', scanLogId);
          },
        });

        await sendProgress({
          stage: 'crawling',
          message: `Crawled ${crawlResult.pages.length} pages successfully`,
          progress: 40,
          details: {
            pagesFound: crawlResult.totalPages,
            pagesCrawled: crawlResult.pages.length,
          },
        });

        // Step 2: Analyze business knowledge
        await sendProgress({
          stage: 'analyzing',
          message: 'Analyzing business knowledge...',
          progress: 45,
        });

        const businessKnowledge = await analyzeBusinessKnowledge(crawlResult.pages, {
          onProgress: async (progress: AnalysisProgress) => {
            const stageProgress = {
              brand_voice: 50,
              products: 60,
              case_studies: 70,
              audience: 80,
              completed: 90,
            };

            await sendProgress({
              stage: 'analyzing',
              message: progress.message,
              progress: stageProgress[progress.stage],
              details: {
                analysisStage: progress.stage,
                itemsFound: progress.itemsFound,
              },
            });
          },
        });

        // Step 3: Store knowledge in database
        await sendProgress({
          stage: 'saving',
          message: 'Saving extracted knowledge...',
          progress: 90,
        });

        let knowledgeItemsExtracted = 0;

        // Store brand voice
        if (businessKnowledge.brand_voice) {
          await supabase.from('business_knowledge').insert({
            client_id: clientId,
            knowledge_type: 'brand_voice',
            knowledge_data: businessKnowledge.brand_voice,
            source_url: websiteUrl,
            source_type: 'website_scan',
            confidence_score: 0.85,
            word_count: crawlResult.pages
              .slice(0, 3)
              .reduce((sum, p) => sum + p.wordCount, 0),
            extracted_at: new Date().toISOString(),
          });
          knowledgeItemsExtracted++;
        }

        // Store products/services
        if (businessKnowledge.products_services) {
          await supabase.from('business_knowledge').insert({
            client_id: clientId,
            knowledge_type: 'products_services',
            knowledge_data: { products: businessKnowledge.products_services },
            source_url: websiteUrl,
            source_type: 'website_scan',
            confidence_score: 0.9,
            extracted_at: new Date().toISOString(),
          });
          knowledgeItemsExtracted++;
        }

        // Store case studies
        if (businessKnowledge.case_studies && businessKnowledge.case_studies.length > 0) {
          await supabase.from('business_knowledge').insert({
            client_id: clientId,
            knowledge_type: 'case_studies',
            knowledge_data: { studies: businessKnowledge.case_studies },
            source_url: websiteUrl,
            source_type: 'website_scan',
            confidence_score: 0.95,
            extracted_at: new Date().toISOString(),
          });
          knowledgeItemsExtracted++;
        }

        // Store target audience
        if (businessKnowledge.target_audience) {
          await supabase.from('business_knowledge').insert({
            client_id: clientId,
            knowledge_type: 'target_audience',
            knowledge_data: { segments: businessKnowledge.target_audience },
            source_url: websiteUrl,
            source_type: 'website_scan',
            confidence_score: 0.8,
            extracted_at: new Date().toISOString(),
          });
          knowledgeItemsExtracted++;
        }

        // Store terminology
        if (businessKnowledge.terminology && businessKnowledge.terminology.length > 0) {
          await supabase.from('business_knowledge').insert({
            client_id: clientId,
            knowledge_type: 'terminology',
            knowledge_data: { terms: businessKnowledge.terminology },
            source_url: websiteUrl,
            source_type: 'website_scan',
            confidence_score: 0.7,
            extracted_at: new Date().toISOString(),
          });
          knowledgeItemsExtracted++;
        }

        // Store pain points
        if (businessKnowledge.pain_points && businessKnowledge.pain_points.length > 0) {
          await supabase.from('business_knowledge').insert({
            client_id: clientId,
            knowledge_type: 'pain_points',
            knowledge_data: { pain_points: businessKnowledge.pain_points },
            source_url: websiteUrl,
            source_type: 'website_scan',
            confidence_score: 0.75,
            extracted_at: new Date().toISOString(),
          });
          knowledgeItemsExtracted++;
        }

        // Store unique value
        if (businessKnowledge.unique_value && businessKnowledge.unique_value.length > 0) {
          await supabase.from('business_knowledge').insert({
            client_id: clientId,
            knowledge_type: 'unique_value',
            knowledge_data: { unique_value: businessKnowledge.unique_value },
            source_url: websiteUrl,
            source_type: 'website_scan',
            confidence_score: 0.8,
            extracted_at: new Date().toISOString(),
          });
          knowledgeItemsExtracted++;
        }

        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

        // Update scan log with completion
        await supabase
          .from('website_scan_logs')
          .update({
            scan_status: 'completed',
            knowledge_items_extracted: knowledgeItemsExtracted,
            duration_seconds: durationSeconds,
            completed_at: new Date().toISOString(),
            scan_results: {
              pages_analyzed: crawlResult.pages.map((p) => p.url),
              knowledge_extracted: {
                brand_voice: !!businessKnowledge.brand_voice,
                products_services: businessKnowledge.products_services?.length || 0,
                case_studies: businessKnowledge.case_studies?.length || 0,
                target_audience: businessKnowledge.target_audience?.length || 0,
                terminology: businessKnowledge.terminology?.length || 0,
                pain_points: businessKnowledge.pain_points?.length || 0,
                unique_value: businessKnowledge.unique_value?.length || 0,
              },
            },
          })
          .eq('id', scanLogId);

        // Send completion message
        await sendProgress({
          stage: 'completed',
          message: 'Website scan completed successfully!',
          progress: 100,
          details: {
            pagesAnalyzed: crawlResult.pages.length,
            knowledgeItemsExtracted,
            durationSeconds,
            knowledge: {
              has_brand_voice: !!businessKnowledge.brand_voice,
              products_count: businessKnowledge.products_services?.length || 0,
              case_studies_count: businessKnowledge.case_studies?.length || 0,
              audience_segments: businessKnowledge.target_audience?.length || 0,
            },
          },
        });

        await writer.close();
      } catch (error: any) {
        console.error('Website scan error:', error);

        // Update scan log with error
        await supabase
          .from('website_scan_logs')
          .update({
            scan_status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', scanLogId);

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
    console.error('Scan website error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to scan website',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Get scan status
 * GET /api/intelligence/scan-website?scanLogId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scanLogId = searchParams.get('scanLogId');

    if (!scanLogId) {
      return NextResponse.json(
        { error: 'Missing required parameter: scanLogId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: scanLog } = await supabase
      .from('website_scan_logs')
      .select('*')
      .eq('id', scanLogId)
      .single();

    if (!scanLog) {
      return NextResponse.json({ error: 'Scan log not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scanLog,
    });
  } catch (error: any) {
    console.error('Get scan status error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to get scan status',
      },
      { status: 500 }
    );
  }
}
