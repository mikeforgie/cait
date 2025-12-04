import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Get SEO todos for a client
 * GET /api/scanning/todos?clientId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required parameter: clientId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get all todos for this client
    const { data: todos } = await supabase
      .from('seo_todos')
      .select('*')
      .eq('client_id', clientId)
      .order('priority', { ascending: true }) // Critical first
      .order('created_at', { ascending: false });

    if (!todos) {
      return NextResponse.json({
        success: true,
        todos: [],
      });
    }

    // Group by status
    const grouped = {
      pending: todos.filter(t => t.status === 'pending'),
      in_progress: todos.filter(t => t.status === 'in_progress'),
      completed: todos.filter(t => t.status === 'completed'),
      skipped: todos.filter(t => t.status === 'skipped'),
    };

    // Calculate stats
    const stats = {
      total: todos.length,
      pending: grouped.pending.length,
      in_progress: grouped.in_progress.length,
      completed: grouped.completed.length,
      auto_completed: todos.filter(t => t.auto_completed).length,
      completion_rate: todos.length > 0 ? (grouped.completed.length / todos.length) * 100 : 0,
    };

    return NextResponse.json({
      success: true,
      todos,
      grouped,
      stats,
    });
  } catch (error: any) {
    console.error('Get todos error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to get todos',
      },
      { status: 500 }
    );
  }
}

/**
 * Update todo status
 * PATCH /api/scanning/todos
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { todoId, status, completedItems } = body;

    if (!todoId) {
      return NextResponse.json(
        { error: 'Missing required field: todoId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completion_method = 'manual';
      }
    }

    if (completedItems !== undefined) {
      updateData.completed_items = completedItems;

      // Get todo to check if it should be auto-completed
      const { data: todo } = await supabase
        .from('seo_todos')
        .select('*')
        .eq('id', todoId)
        .single();

      if (todo && completedItems >= todo.total_items) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
        updateData.completion_method = 'manual';
      }
    }

    const { data: updatedTodo } = await supabase
      .from('seo_todos')
      .update(updateData)
      .eq('id', todoId)
      .select()
      .single();

    if (!updatedTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      todo: updatedTodo,
    });
  } catch (error: any) {
    console.error('Update todo error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to update todo',
      },
      { status: 500 }
    );
  }
}
