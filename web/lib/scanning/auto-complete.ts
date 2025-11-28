/**
 * Auto-Complete Engine
 * Automatically marks SEO todos as complete based on scan results
 */

import { createClient } from '@/lib/supabase/server';
import type { ScanResult } from './technical-scanner';

export interface AutoCompleteResult {
  todos_checked: number;
  todos_completed: number;
  todos_created: number;
  completed_todo_ids: string[];
  created_todo_ids: string[];
}

/**
 * Auto-complete todos based on scan results
 */
export async function autoCompleteTodos(
  clientId: string,
  scanId: string,
  scanResult: ScanResult
): Promise<AutoCompleteResult> {
  const supabase = await createClient();

  const completedTodoIds: string[] = [];
  const createdTodoIds: string[] = [];

  // Get all pending/in-progress todos for this client
  const { data: todos } = await supabase
    .from('seo_todos')
    .select('*')
    .eq('client_id', clientId)
    .in('status', ['pending', 'in_progress'])
    .eq('auto_completable', true);

  if (!todos) {
    return {
      todos_checked: 0,
      todos_completed: 0,
      todos_created: 0,
      completed_todo_ids: [],
      created_todo_ids: [],
    };
  }

  // Check each todo against scan results
  for (const todo of todos) {
    const shouldComplete = checkTodoCompletion(todo, scanResult);

    if (shouldComplete) {
      // Mark todo as completed
      await supabase
        .from('seo_todos')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          auto_completed: true,
          completion_method: 'auto_detected',
        })
        .eq('id', todo.id);

      completedTodoIds.push(todo.id);

      // Log as SEO action for attribution
      await supabase.from('seo_actions').insert({
        client_id: clientId,
        action_type: 'technical_fix',
        description: `Auto-completed: ${todo.title}`,
        target_url: todo.metadata?.target_url,
        action_details: {
          todo_id: todo.id,
          todo_type: todo.todo_type,
          detected_by_scan_id: scanId,
          auto_completed: true,
        },
        status: 'completed',
      });
    }
  }

  // Create new todos based on scan results
  const newTodoIds = await createTodosFromScanResults(clientId, scanId, scanResult);
  createdTodoIds.push(...newTodoIds);

  return {
    todos_checked: todos.length,
    todos_completed: completedTodoIds.length,
    todos_created: createdTodoIds.length,
    completed_todo_ids: completedTodoIds,
    created_todo_ids: createdTodoIds,
  };
}

/**
 * Check if a todo should be marked complete based on scan results
 */
function checkTodoCompletion(todo: any, scanResult: ScanResult): boolean {
  switch (todo.todo_type) {
    case 'implement_ssl':
      // SSL is now implemented
      return scanResult.has_ssl === true;

    case 'create_sitemap':
      // Sitemap now exists
      return scanResult.has_sitemap === true;

    case 'create_robots_txt':
      // Robots.txt now exists
      return scanResult.has_robots_txt === true;

    case 'add_meta_descriptions':
      // Check if missing meta descriptions have decreased significantly
      if (todo.total_items && scanResult.meta_description_stats.missing === 0) {
        return true;
      }
      // Or if missing count dropped below threshold
      if (scanResult.meta_description_stats.missing < 3) {
        return true;
      }
      return false;

    case 'add_alt_text':
      // Check if missing alt text has been addressed
      if (todo.total_items && scanResult.alt_text_stats.missing_alt === 0) {
        return true;
      }
      // Or if missing count dropped significantly
      if (scanResult.alt_text_stats.missing_alt < 5) {
        return true;
      }
      return false;

    case 'fix_broken_links':
      // No broken links found
      return scanResult.broken_links.broken_count === 0;

    case 'improve_page_speed':
      // No slow pages detected
      return scanResult.performance.slow_pages === 0;

    default:
      return false;
  }
}

/**
 * Create new todos based on scan results
 */
async function createTodosFromScanResults(
  clientId: string,
  scanId: string,
  scanResult: ScanResult
): Promise<string[]> {
  const supabase = await createClient();
  const createdIds: string[] = [];

  // Helper to check if todo already exists
  const todoExists = async (todoType: string): Promise<boolean> => {
    const { data } = await supabase
      .from('seo_todos')
      .select('id')
      .eq('client_id', clientId)
      .eq('todo_type', todoType)
      .in('status', ['pending', 'in_progress'])
      .limit(1)
      .single();

    return !!data;
  };

  // Create todo for missing meta descriptions
  if (scanResult.meta_description_stats.missing > 0) {
    const exists = await todoExists('add_meta_descriptions');

    if (!exists) {
      const { data } = await supabase
        .from('seo_todos')
        .insert({
          client_id: clientId,
          todo_type: 'add_meta_descriptions',
          title: `Add ${scanResult.meta_description_stats.missing} missing meta descriptions`,
          description: `${scanResult.meta_description_stats.missing} pages are missing meta descriptions. These help improve click-through rates in search results.`,
          priority: 'high',
          auto_completable: true,
          related_issue_type: 'missing_meta_description',
          related_scan_id: scanId,
          total_items: scanResult.meta_description_stats.missing,
          completed_items: 0,
        })
        .select('id')
        .single();

      if (data) createdIds.push(data.id);
    }
  }

  // Create todo for missing alt text
  if (scanResult.alt_text_stats.missing_alt > 0) {
    const exists = await todoExists('add_alt_text');

    if (!exists) {
      const { data } = await supabase
        .from('seo_todos')
        .insert({
          client_id: clientId,
          todo_type: 'add_alt_text',
          title: `Add alt text to ${scanResult.alt_text_stats.missing_alt} images`,
          description: `${scanResult.alt_text_stats.missing_alt} images are missing alt text. This is important for accessibility and image SEO.`,
          priority: 'medium',
          auto_completable: true,
          related_issue_type: 'missing_alt_text',
          related_scan_id: scanId,
          total_items: scanResult.alt_text_stats.missing_alt,
          completed_items: 0,
        })
        .select('id')
        .single();

      if (data) createdIds.push(data.id);
    }
  }

  // Create todo for broken links
  if (scanResult.broken_links.broken_count > 0) {
    const exists = await todoExists('fix_broken_links');

    if (!exists) {
      const { data } = await supabase
        .from('seo_todos')
        .insert({
          client_id: clientId,
          todo_type: 'fix_broken_links',
          title: `Fix ${scanResult.broken_links.broken_count} broken links`,
          description: `${scanResult.broken_links.broken_count} broken links detected. These hurt user experience and SEO.`,
          priority: 'high',
          auto_completable: true,
          related_issue_type: 'broken_link',
          related_scan_id: scanId,
          total_items: scanResult.broken_links.broken_count,
          completed_items: 0,
        })
        .select('id')
        .single();

      if (data) createdIds.push(data.id);
    }
  }

  // Create todo for slow pages
  if (scanResult.performance.slow_pages > 0) {
    const exists = await todoExists('improve_page_speed');

    if (!exists) {
      const { data } = await supabase
        .from('seo_todos')
        .insert({
          client_id: clientId,
          todo_type: 'improve_page_speed',
          title: `Improve speed of ${scanResult.performance.slow_pages} slow pages`,
          description: `${scanResult.performance.slow_pages} pages are loading slowly (>3s). Page speed is a ranking factor.`,
          priority: 'medium',
          auto_completable: true,
          related_issue_type: 'slow_page_speed',
          related_scan_id: scanId,
          total_items: scanResult.performance.slow_pages,
          completed_items: 0,
        })
        .select('id')
        .single();

      if (data) createdIds.push(data.id);
    }
  }

  // Update counts in batch todos based on current scan
  await updateBatchTodoCounts(clientId, scanResult);

  return createdIds;
}

/**
 * Update progress counts in batch todos
 */
async function updateBatchTodoCounts(
  clientId: string,
  scanResult: ScanResult
): Promise<void> {
  const supabase = await createClient();

  // Update meta description todo counts
  const { data: metaTodos } = await supabase
    .from('seo_todos')
    .select('*')
    .eq('client_id', clientId)
    .eq('todo_type', 'add_meta_descriptions')
    .in('status', ['pending', 'in_progress']);

  if (metaTodos && metaTodos.length > 0) {
    const metaTodo = metaTodos[0];
    const originalTotal = metaTodo.total_items || scanResult.meta_description_stats.missing;
    const currentMissing = scanResult.meta_description_stats.missing;
    const completed = Math.max(0, originalTotal - currentMissing);

    await supabase
      .from('seo_todos')
      .update({
        completed_items: completed,
        total_items: originalTotal,
      })
      .eq('id', metaTodo.id);
  }

  // Update alt text todo counts
  const { data: altTodos } = await supabase
    .from('seo_todos')
    .select('*')
    .eq('client_id', clientId)
    .eq('todo_type', 'add_alt_text')
    .in('status', ['pending', 'in_progress']);

  if (altTodos && altTodos.length > 0) {
    const altTodo = altTodos[0];
    const originalTotal = altTodo.total_items || scanResult.alt_text_stats.missing_alt;
    const currentMissing = scanResult.alt_text_stats.missing_alt;
    const completed = Math.max(0, originalTotal - currentMissing);

    await supabase
      .from('seo_todos')
      .update({
        completed_items: completed,
        total_items: originalTotal,
      })
      .eq('id', altTodo.id);
  }

  // Update broken links todo counts
  const { data: linkTodos } = await supabase
    .from('seo_todos')
    .select('*')
    .eq('client_id', clientId)
    .eq('todo_type', 'fix_broken_links')
    .in('status', ['pending', 'in_progress']);

  if (linkTodos && linkTodos.length > 0) {
    const linkTodo = linkTodos[0];
    const originalTotal = linkTodo.total_items || scanResult.broken_links.broken_count;
    const currentBroken = scanResult.broken_links.broken_count;
    const completed = Math.max(0, originalTotal - currentBroken);

    await supabase
      .from('seo_todos')
      .update({
        completed_items: completed,
        total_items: originalTotal,
      })
      .eq('id', linkTodo.id);
  }
}

/**
 * Get summary of auto-completable todos
 */
export async function getAutoCompleteSummary(clientId: string): Promise<{
  total_todos: number;
  auto_completable: number;
  manual_only: number;
  completion_rate: number;
}> {
  const supabase = await createClient();

  const { data: allTodos } = await supabase
    .from('seo_todos')
    .select('*')
    .eq('client_id', clientId);

  if (!allTodos) {
    return {
      total_todos: 0,
      auto_completable: 0,
      manual_only: 0,
      completion_rate: 0,
    };
  }

  const autoCompletable = allTodos.filter(t => t.auto_completable).length;
  const manualOnly = allTodos.filter(t => !t.auto_completable).length;
  const completed = allTodos.filter(t => t.status === 'completed').length;

  return {
    total_todos: allTodos.length,
    auto_completable: autoCompletable,
    manual_only: manualOnly,
    completion_rate: allTodos.length > 0 ? (completed / allTodos.length) * 100 : 0,
  };
}
