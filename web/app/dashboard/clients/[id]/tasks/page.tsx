'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { Task } from '@/components/tasks/TaskCard'
import { Plus, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface DetectionResult {
  task_id: string
  task_name: string
  detected: boolean
  confidence: 'high' | 'medium' | 'low'
  evidence: string[]
  auto_completed: boolean
}

interface DetectionSummary {
  tasks_checked: number
  tasks_detected_complete: number
  tasks_auto_completed: number
  results: DetectionResult[]
}

export default function ClientTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = use(params)
  const [tasks, setTasks] = useState<Task[]>([])
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [detectionResults, setDetectionResults] = useState<DetectionSummary | null>(null)
  const [showDetectionPanel, setShowDetectionPanel] = useState(false)
  const supabase = createClient()

  // Fetch client data and tasks
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch client
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      setClient(clientData)

      // Fetch tasks from database
      const { data: dbTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', clientId)
        .order('month', { ascending: true })
        .order('created_at', { ascending: true })

      if (dbTasks && dbTasks.length > 0) {
        // Convert database tasks to KanbanBoard format
        const formattedTasks: Task[] = dbTasks.map(t => ({
          id: t.id,
          title: t.name,
          description: t.description || '',
          priority: getPriorityFromMonth(t.month),
          status: mapStatus(t.status),
          dueDate: t.completed_at || undefined,
          tags: [getCategoryLabel(t.category), `Month ${t.month}`],
          month: t.month,
          automated: t.automated,
          category: t.category,
        }))
        setTasks(formattedTasks)
      } else {
        // No tasks yet - show empty state
        setTasks([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [clientId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Map database status to Kanban status
  function mapStatus(dbStatus: string): Task['status'] {
    switch (dbStatus) {
      case 'completed': return 'completed'
      case 'in_progress': return 'in_progress'
      case 'pending':
      default: return 'todo'
    }
  }

  // Get priority based on month (earlier = higher priority)
  function getPriorityFromMonth(month: number): Task['priority'] {
    if (month === 0) return 'high'
    if (month <= 2) return 'medium'
    return 'low'
  }

  // Get human-readable category label
  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'keyword_research': 'Keywords',
      'content': 'Content',
      'technical_seo': 'Technical',
      'backlinks': 'Backlinks',
      'local_seo': 'Local SEO',
      'analytics': 'Analytics',
    }
    return labels[category] || category
  }

  // Run task completion detection
  const runDetection = async () => {
    setDetecting(true)
    setShowDetectionPanel(true)
    try {
      const response = await fetch('/api/tasks/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId,
          autoComplete: true,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setDetectionResults(result.data)
        // Refresh tasks if any were auto-completed
        if (result.data.tasks_auto_completed > 0) {
          await fetchData()
        }
      }
    } catch (error) {
      console.error('Detection error:', error)
    } finally {
      setDetecting(false)
    }
  }

  // Handle task status change
  const handleTaskMove = async (taskId: string, newStatus: Task['status']) => {
    // Map Kanban status back to database status
    const dbStatus = newStatus === 'todo' ? 'pending' : newStatus

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ))

    // Update in database
    const updates: any = {
      status: dbStatus,
      updated_at: new Date().toISOString(),
    }
    if (dbStatus === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
  }

  // Calculate stats
  const todoCount = tasks.filter(t => t.status === 'todo').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const totalCount = tasks.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!client) {
    return <div className="text-center py-8 text-gray-500">Client not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            SEO Tasks
          </h2>
          <p className="text-gray-600 mt-1">
            Manage optimization workflow for {client.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runDetection}
            disabled={detecting}
            className="px-4 py-2.5 rounded-lg font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {detecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Detect Completed
          </button>
          <button className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Detection Results Panel */}
      {showDetectionPanel && detectionResults && (
        <div className="p-4 rounded-lg border border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-orange-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Task Detection Results
            </h3>
            <button
              onClick={() => setShowDetectionPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded bg-white">
              <div className="text-sm text-gray-600">Tasks Checked</div>
              <div className="text-2xl font-bold text-gray-900">
                {detectionResults.tasks_checked}
              </div>
            </div>
            <div className="p-3 rounded bg-white">
              <div className="text-sm text-gray-600">Detected Complete</div>
              <div className="text-2xl font-bold text-green-600">
                {detectionResults.tasks_detected_complete}
              </div>
            </div>
            <div className="p-3 rounded bg-white">
              <div className="text-sm text-gray-600">Auto-Completed</div>
              <div className="text-2xl font-bold text-orange-600">
                {detectionResults.tasks_auto_completed}
              </div>
            </div>
          </div>

          {/* Detection details */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {detectionResults.results.map(result => (
              <div
                key={result.task_id}
                className={`p-3 rounded text-sm ${
                  result.detected
                    ? result.confidence === 'high'
                      ? 'bg-green-100 border border-green-200'
                      : 'bg-yellow-100 border border-yellow-200'
                    : 'bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.detected ? (
                    result.confidence === 'high' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="font-medium">{result.task_name}</span>
                  {result.auto_completed && (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-600 text-white">
                      Auto-completed
                    </span>
                  )}
                  {result.detected && !result.auto_completed && (
                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-600 text-white">
                      {result.confidence} confidence
                    </span>
                  )}
                </div>
                {result.evidence.length > 0 && (
                  <ul className="mt-1 ml-6 text-xs text-gray-600">
                    {result.evidence.slice(0, 3).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Total Tasks</div>
          <div className="text-3xl font-bold text-gray-900">{totalCount}</div>
        </div>
        <div className="p-4 rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">To Do</div>
          <div className="text-3xl font-bold text-red-700">{todoCount}</div>
        </div>
        <div className="p-4 rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">In Progress</div>
          <div className="text-3xl font-bold text-yellow-700">{inProgressCount}</div>
        </div>
        <div className="p-4 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-700">{completedCount}</div>
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-gray-500 mb-4">No tasks yet for this client</div>
          <p className="text-sm text-gray-400 mb-6">
            Tasks will be automatically created when you initialize the client's SEO roadmap
          </p>
          <button
            onClick={() => {
              // TODO: Initialize tasks
              alert('Initialize roadmap coming soon!')
            }}
            className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90"
          >
            Initialize SEO Roadmap
          </button>
        </div>
      ) : (
        /* Kanban Board */
        <KanbanBoard initialTasks={tasks} onTaskMove={handleTaskMove} />
      )}
    </div>
  )
}
