import { NextRequest, NextResponse } from 'next/server';
import { logSEOAction } from '@/lib/attribution/action-logger';

/**
 * Log a manual SEO action for attribution tracking
 * POST /api/attribution/log-action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      actionCategory,
      actionType,
      targetUrl,
      actionDetails,
    } = body;

    // Validate required fields
    if (!clientId || !actionCategory || !actionType || !targetUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, actionCategory, actionType, targetUrl' },
        { status: 400 }
      );
    }

    // Log the SEO action
    const result = await logSEOAction({
      clientId,
      actionType,
      actionCategory,
      targetType: 'page',
      targetUrl,
      actionDetails: actionDetails || {},
      automated: false,
      performedBy: 'user',
      timeInvestedMinutes: 10, // Estimate for manual actions
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to log action' },
        { status: 500 }
      );
    }

    // If it's a backlink, also create a backlink tracking record
    if (actionType === 'backlink_acquired' && actionDetails?.backlinkUrl) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      // Extract domain from URL
      const sourceDomain = new URL(actionDetails.backlinkUrl).hostname;

      await supabase.from('backlink_tracking').insert({
        client_id: clientId,
        source_url: actionDetails.backlinkUrl,
        source_domain: sourceDomain,
        target_url: targetUrl,
        anchor_text: actionDetails.anchorText,
        link_type: 'dofollow', // Default assumption
        domain_authority: actionDetails.domainAuthority,
        acquisition_method: 'manual',
        is_live: true,
        related_action_id: result.id,
        discovered_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      action: result,
      message: 'SEO action logged successfully for attribution tracking',
    });
  } catch (error: any) {
    console.error('Log action error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to log action',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
