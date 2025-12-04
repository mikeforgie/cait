/**
 * API Route: Run Automation Task
 *
 * POST /api/automation/run-task
 *
 * Executes AI-powered SEO automation tasks like:
 * - robots.txt generation
 * - sitemap creation
 * - meta description generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAutomationTask, AutomationContext } from '@/lib/automation/task-runner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, taskId, taskType } = body;

    // Validate required fields
    if (!clientId || !taskId) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, taskId' },
        { status: 400 }
      );
    }

    // Get client info for domain
    const supabase = await createClient();
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, domain')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (!client.domain) {
      return NextResponse.json(
        { error: 'Client domain not configured. Please set the domain in client settings.' },
        { status: 400 }
      );
    }

    // Build automation context
    const context: AutomationContext = {
      clientId,
      domain: client.domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      taskId,
      taskType: taskType || taskId, // Use taskType if provided, otherwise use taskId
    };

    // Run the automation
    const result = await runAutomationTask(context);

    // Return result
    return NextResponse.json(result);

  } catch (error) {
    console.error('Automation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check automation status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clientId = searchParams.get('clientId');
  const taskId = searchParams.get('taskId');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing clientId parameter' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get recent automation actions for this client
  const { data: actions, error } = await supabase
    .from('seo_actions')
    .select('*')
    .eq('client_id', clientId)
    .eq('action_type', 'automation')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch automation history' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    automations: actions || [],
    count: actions?.length || 0,
  });
}
