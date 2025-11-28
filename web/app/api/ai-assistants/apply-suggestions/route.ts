import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Apply AI suggestions (mark as approved/applied)
 * POST /api/ai-assistants/apply-suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionIds, action = 'approve' } = body;

    if (!suggestionIds || !Array.isArray(suggestionIds) || suggestionIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: suggestionIds (array)' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (action === 'approve') {
      // Mark as approved
      const { data: updated } = await supabase
        .from('ai_suggestions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .in('id', suggestionIds)
        .select();

      return NextResponse.json({
        success: true,
        updated: updated?.length || 0,
        suggestions: updated,
      });
    } else if (action === 'reject') {
      // Mark as rejected
      const { data: updated } = await supabase
        .from('ai_suggestions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .in('id', suggestionIds)
        .select();

      return NextResponse.json({
        success: true,
        updated: updated?.length || 0,
      });
    } else if (action === 'apply') {
      // Mark as applied (user has implemented on their website)
      const { data: updated } = await supabase
        .from('ai_suggestions')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
        })
        .in('id', suggestionIds)
        .select();

      // Trigger will auto-update todo progress

      return NextResponse.json({
        success: true,
        applied: updated?.length || 0,
        suggestions: updated,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: approve, reject, or apply' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Apply suggestions error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to apply suggestions',
      },
      { status: 500 }
    );
  }
}

/**
 * Update a single suggestion
 * PATCH /api/ai-assistants/apply-suggestions
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionId, suggestedContent, status } = body;

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Missing required field: suggestionId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: any = {};

    if (suggestedContent !== undefined) {
      updateData.suggested_content = suggestedContent;
      updateData.character_count = suggestedContent.length;
    }

    if (status) {
      updateData.status = status;

      if (status === 'approved' || status === 'rejected') {
        updateData.reviewed_at = new Date().toISOString();
      }

      if (status === 'applied') {
        updateData.applied_at = new Date().toISOString();
      }
    }

    const { data: updated } = await supabase
      .from('ai_suggestions')
      .update(updateData)
      .eq('id', suggestionId)
      .select()
      .single();

    if (!updated) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      suggestion: updated,
    });
  } catch (error: any) {
    console.error('Update suggestion error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to update suggestion',
      },
      { status: 500 }
    );
  }
}
