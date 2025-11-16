'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { Task } from '@/components/tasks/TaskCard'
import { Plus } from 'lucide-react'

// Mock data - will be replaced with database queries filtered by client_id
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Optimize page speed for homepage',
    description: 'Reduce load time to under 2 seconds',
    priority: 'high',
    status: 'todo',
    dueDate: '2025-11-20',
    tags: ['Technical SEO', 'Performance']
  },
  {
    id: '2',
    title: 'Fix broken backlinks',
    description: 'Identify and fix 404 errors from backlink sources',
    priority: 'medium',
    status: 'todo',
    dueDate: '2025-11-18',
    tags: ['Backlinks', 'Technical SEO']
  },
  {
    id: '3',
    title: 'Update meta descriptions',
    description: 'Write compelling meta descriptions for top 10 pages',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2025-11-15',
    tags: ['On-Page SEO', 'Content']
  },
  {
    id: '4',
    title: 'Build 5 new backlinks',
    description: 'Outreach to industry blogs and directories',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2025-11-22',
    tags: ['Backlinks', 'Outreach']
  },
  {
    id: '5',
    title: 'Keyword research for Q4',
    description: 'Identify 20 high-volume, low-competition keywords',
    priority: 'low',
    status: 'in_progress',
    dueDate: '2025-11-25',
    tags: ['Keywords', 'Research']
  },
  {
    id: '6',
    title: 'Submit sitemap to Google',
    description: 'Updated sitemap with new pages',
    priority: 'medium',
    status: 'completed',
    tags: ['Technical SEO']
  },
  {
    id: '7',
    title: 'Install SSL certificate',
    description: 'Migrate from HTTP to HTTPS',
    priority: 'high',
    status: 'completed',
    tags: ['Technical SEO', 'Security']
  },
  {
    id: '8',
    title: 'Create content calendar',
    description: 'Plan blog posts for next month',
    priority: 'low',
    status: 'completed',
    dueDate: '2025-11-10',
    tags: ['Content', 'Planning']
  }
]

export default function ClientTasksPage({ params }: { params: { id: string } }) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [client, setClient] = useState<any>(null)
  const supabase = createClient()

  // Fetch client data
  useEffect(() => {
    async function fetchClient() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single()
      setClient(data)
    }
    fetchClient()
  }, [params.id])

  // Calculate stats
  const todoCount = tasks.filter(t => t.status === 'todo').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const totalCount = tasks.length

  const handleTaskMove = (taskId: string, newStatus: Task['status']) => {
    console.log(`Task ${taskId} moved to ${newStatus} for client ${params.id}`)
    // TODO: Update database in Phase 9
  }

  if (!client) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">SEO Tasks</h2>
          <p className="text-gray-600 mt-1">Manage optimization workflow for {client.name}</p>
        </div>
        <button className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 hover:opacity-90 transition-opacity flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

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

      {/* Kanban Board */}
      <KanbanBoard initialTasks={tasks} onTaskMove={handleTaskMove} />
    </div>
  )
}
