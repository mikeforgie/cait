import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scanPagesDetailed, getCachedPageData } from '@/lib/scanning/detailed-scanner';
import {
  generateMetaDescriptions,
  generateAltText,
  generateH1Tags,
  calculateBulkCredits,
} from '@/lib/ai-assistants/generators';
import { getBusinessKnowledgeContext } from '@/lib/intelligence/knowledge-context';
import { checkUsageLimit } from '@/lib/ai/usage-tracking';

interface GenerateProgress {
  stage: 'fetching' | 'generating' | 'storing' | 'completed' | 'error';
  message: string;
  progress: number;
  current?: number;
  total?: number;
  details?: {
    jobId: string;
    suggestions_generated: number;
    credits_used: number;
  };
  error?: string;
}

/**
 * Generate bulk AI suggestions
 * POST /api/ai-assistants/generate-bulk
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, todoId, type, urls } = body;

    if (!clientId || !todoId || !type || !urls || urls.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, todoId, type, urls' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify client
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify todo
    const { data: todo } = await supabase
      .from('seo_todos')
      .select('*')
      .eq('id', todoId)
      .single();

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Calculate credits needed
    const creditsNeeded = calculateBulkCredits(type, urls.length);

    // Check usage limits
    const { allowed, usage } = await checkUsageLimit(clientId);
    if (!allowed || usage.remaining < creditsNeeded) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          creditsNeeded,
          remaining: usage.remaining,
          message: `This bulk generation requires ${creditsNeeded} credits, but you only have ${usage.remaining} remaining.`,
        },
        { status: 429 }
      );
    }

    // Create generation job
    const { data: job } = await supabase
      .from('ai_generation_jobs')
      .insert({
        client_id: clientId,
        todo_id: todoId,
        job_type: `bulk_${type}`,
        status: 'running',
        total_items: urls.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!job) {
      return NextResponse.json(
        { error: 'Failed to create generation job' },
        { status: 500 }
      );
    }

    const jobId = job.id;

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendProgress = async (data: GenerateProgress) => {
      await writer.write(encoder.encode(JSON.stringify(data) + '\n'));
    };

    // Start generation in background
    (async () => {
      try {
        const startTime = Date.now();
        let creditsUsed = 0;

        // Get business context
        const businessContext = await getBusinessKnowledgeContext(clientId);

        // Stage 1: Fetch page data
        await sendProgress({
          stage: 'fetching',
          message: 'Fetching page data...',
          progress: 10,
          total: urls.length,
        });

        const pageDataPromises = urls.map((url: string) =>
          getCachedPageData(clientId, url, supabase)
        );
        const pageDataResults = await Promise.all(pageDataPromises);
        const pageData = pageDataResults.filter((p) => p !== null);

        // Stage 2: Generate suggestions
        await sendProgress({
          stage: 'generating',
          message: `Generating ${type.replace('_', ' ')}...`,
          progress: 30,
          total: pageData.length,
        });

        let suggestions: any[] = [];

        if (type === 'meta_descriptions') {
          suggestions = await generateMetaDescriptions(
            pageData,
            businessContext,
            {
              onProgress: async (current, total) => {
                await sendProgress({
                  stage: 'generating',
                  message: `Generating meta description ${current} of ${total}...`,
                  progress: 30 + (current / total) * 40,
                  current,
                  total,
                });
              },
            }
          );
          creditsUsed = suggestions.length * 1;
        } else if (type === 'alt_text') {
          // Collect all images from pages
          const allImages = pageData.flatMap((page: any) =>
            page.images
              .filter((img: any) => !img.alt || img.alt.trim() === '')
              .map((img: any) => ({ ...img, page_url: page.url }))
          );

          suggestions = await generateAltText(allImages, businessContext, {
            onProgress: async (current, total) => {
              await sendProgress({
                stage: 'generating',
                message: `Generating alt text ${current} of ${total}...`,
                progress: 30 + (current / total) * 40,
                current,
                total,
              });
            },
          });
          creditsUsed = Math.ceil(suggestions.length * 0.5);
        } else if (type === 'h1_tags') {
          const pagesNeedingH1 = pageData.filter(
            (p) => p.issues.missing_h1 || p.issues.multiple_h1
          );

          suggestions = await generateH1Tags(pagesNeedingH1, businessContext, {
            onProgress: async (current, total) => {
              await sendProgress({
                stage: 'generating',
                message: `Generating H1 tag ${current} of ${total}...`,
                progress: 30 + (current / total) * 40,
                current,
                total,
              });
            },
          });
          creditsUsed = Math.ceil(suggestions.length * 0.5);
        }

        // Stage 3: Store suggestions
        await sendProgress({
          stage: 'storing',
          message: 'Storing AI suggestions...',
          progress: 80,
        });

        for (const suggestion of suggestions) {
          await supabase.from('ai_suggestions').insert({
            client_id: clientId,
            todo_id: todoId,
            suggestion_type: type.replace('s', ''), // Remove plural
            target_url: suggestion.target_url,
            target_element: suggestion.target_element,
            suggested_content: suggestion.suggested_content,
            original_content: suggestion.original_content,
            context_data: suggestion.metadata || {},
            status: 'pending',
            confidence_score: suggestion.confidence_score,
            character_count: suggestion.character_count,
            credits_used: type === 'meta_descriptions' ? 1 : 0.5,
          });
        }

        // Update usage
        await supabase
          .from('client_settings')
          .update({
            current_month_usage:
              (usage.current_month_usage || 0) + creditsUsed,
          })
          .eq('client_id', clientId);

        // Update job
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

        await supabase
          .from('ai_generation_jobs')
          .update({
            status: 'completed',
            completed_items: suggestions.length,
            suggestions_generated: suggestions.length,
            total_credits_used: creditsUsed,
            duration_seconds: durationSeconds,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        // Send completion
        await sendProgress({
          stage: 'completed',
          message: 'Generation completed!',
          progress: 100,
          details: {
            jobId,
            suggestions_generated: suggestions.length,
            credits_used: creditsUsed,
          },
        });

        await writer.close();
      } catch (error: any) {
        console.error('Bulk generation error:', error);

        // Update job with error
        await supabase
          .from('ai_generation_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

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
    console.error('Generate bulk error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate bulk suggestions',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Get AI suggestions for a todo
 * GET /api/ai-assistants/generate-bulk?todoId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const todoId = searchParams.get('todoId');

    if (!todoId) {
      return NextResponse.json(
        { error: 'Missing required parameter: todoId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get suggestions
    const { data: suggestions } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('todo_id', todoId)
      .order('created_at', { ascending: false });

    // Get latest job
    const { data: latestJob } = await supabase
      .from('ai_generation_jobs')
      .select('*')
      .eq('todo_id', todoId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      suggestions: suggestions || [],
      latestJob,
    });
  } catch (error: any) {
    console.error('Get suggestions error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to get suggestions',
      },
      { status: 500 }
    );
  }
}
