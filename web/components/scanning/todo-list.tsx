'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  AlertTriangle,
  Info,
  Bot,
  User,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { AITodoAssistant } from '@/components/ai-assistants/ai-todo-assistant';

interface Todo {
  id: string;
  todo_type: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  priority: 'critical' | 'high' | 'medium' | 'low';
  auto_completable: boolean;
  auto_completed: boolean;
  completion_method?: string;
  total_items?: number;
  completed_items?: number;
  created_at: string;
  completed_at?: string;
  metadata?: any;
}

interface TodoListProps {
  todos: Todo[];
  clientId: string;
  onRefresh?: () => void;
}

export function TodoList({ todos, clientId, onRefresh }: TodoListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Helper to check if todo supports AI assistance
  const supportsAIAssistance = (todoType: string) => {
    return ['add_meta_descriptions', 'add_alt_text', 'add_h1_tags'].includes(todoType);
  };

  // Helper to get URLs from todo metadata
  const getIssueUrls = (todo: Todo): string[] => {
    // In real implementation, these URLs would come from the scan results
    // For now, return empty array - will be populated by detailed scanner
    return todo.metadata?.issue_urls || [];
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'pending') return todo.status === 'pending' || todo.status === 'in_progress';
    if (filter === 'completed') return todo.status === 'completed';
    return true;
  });

  const getPriorityIcon = (priority: Todo['priority']) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'low':
        return <Info className="h-4 w-4 text-neutral-400" />;
    }
  };

  const getPriorityColor = (priority: Todo['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  const getStatusIcon = (todo: Todo) => {
    if (todo.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (todo.status === 'in_progress') {
      return <Clock className="h-5 w-5 text-blue-600" />;
    } else {
      return <Circle className="h-5 w-5 text-neutral-400" />;
    }
  };

  const stats = {
    total: todos.length,
    pending: todos.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    completed: todos.filter(t => t.status === 'completed').length,
    auto_completed: todos.filter(t => t.auto_completed).length,
  };

  if (todos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SEO To-Do List</CardTitle>
          <CardDescription>
            Run a scan to discover SEO tasks that need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-neutral-500">
            <Bot className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>No todos yet. Run your first SEO scan to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SEO To-Do List</CardTitle>
            <CardDescription>
              {stats.pending} pending • {stats.completed} completed
              {stats.auto_completed > 0 && ` • ${stats.auto_completed} auto-completed`}
            </CardDescription>
          </div>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              Refresh
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({stats.pending})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed ({stats.completed})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredTodos.map(todo => (
            <div
              key={todo.id}
              className={`rounded-lg border p-4 transition-colors ${
                todo.status === 'completed'
                  ? 'border-green-200 bg-green-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="mt-0.5">{getStatusIcon(todo)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${
                          todo.status === 'completed'
                            ? 'text-green-900 line-through'
                            : 'text-neutral-900'
                        }`}
                      >
                        {todo.title}
                      </h4>
                      <p className="text-sm text-neutral-600 mt-1">{todo.description}</p>

                      {/* Progress Bar for Batch Todos */}
                      {todo.total_items && todo.total_items > 1 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                            <span>
                              Progress: {todo.completed_items || 0} / {todo.total_items}
                            </span>
                            <span>
                              {Math.round(
                                ((todo.completed_items || 0) / todo.total_items) * 100
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all"
                              style={{
                                width: `${((todo.completed_items || 0) / todo.total_items) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Priority Badge */}
                    <Badge variant="outline" className={getPriorityColor(todo.priority)}>
                      <span className="flex items-center gap-1">
                        {getPriorityIcon(todo.priority)}
                        {todo.priority}
                      </span>
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                    {/* Auto-completable indicator */}
                    {todo.auto_completable && (
                      <span className="flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        Auto-detectable
                      </span>
                    )}

                    {/* Completion method */}
                    {todo.status === 'completed' && todo.auto_completed && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCheck className="h-3 w-3" />
                        Auto-completed
                      </span>
                    )}

                    {todo.status === 'completed' && !todo.auto_completed && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Manually completed
                      </span>
                    )}

                    {/* Completion date */}
                    {todo.completed_at && (
                      <span>
                        Completed {new Date(todo.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* AI Assistant Button */}
                  {todo.status === 'pending' && supportsAIAssistance(todo.todo_type) && (
                    <div className="mt-3">
                      <AITodoAssistant
                        todoId={todo.id}
                        todoType={todo.todo_type}
                        clientId={clientId}
                        issueUrls={getIssueUrls(todo)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
