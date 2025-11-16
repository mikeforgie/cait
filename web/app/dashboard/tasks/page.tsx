'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, CheckCircle2, Circle, Clock } from 'lucide-react'
import Link from 'next/link'

interface ClientTask {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
}

interface ClientTasks {
  client_id: string
  client_name: string
  domain: string
  tasks: ClientTask[]
  todo_count: number
  in_progress_count: number
  completed_count: number
  total_count: number
}

export default function TasksPage() {
  const [clientTasks, setClientTasks] = useState<ClientTasks[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch all clients and their tasks
  useEffect(() => {
    async function fetchClientTasks() {
      // Fetch all clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, domain')
        .order('name', { ascending: true })

      if (!clients) {
        setLoading(false)
        return
      }

      // Fetch tasks for all clients
      const tasksData: ClientTasks[] = []

      for (const client of clients) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('client_id', client.id)
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(5) // Show only top 5 tasks per client

        const clientTaskList = tasks || []

        tasksData.push({
          client_id: client.id,
          client_name: client.name,
          domain: client.domain,
          tasks: clientTaskList,
          todo_count: clientTaskList.filter(t => t.status === 'todo').length,
          in_progress_count: clientTaskList.filter(t => t.status === 'in_progress').length,
          completed_count: clientTaskList.filter(t => t.status === 'completed').length,
          total_count: clientTaskList.length
        })
      }

      setClientTasks(tasksData)
      setLoading(false)
    }
    fetchClientTasks()
  }, [supabase])

  // Calculate overall stats
  const totalTasks = clientTasks.reduce((sum, client) => sum + client.total_count, 0)
  const todoCount = clientTasks.reduce((sum, client) => sum + client.todo_count, 0)
  const inProgressCount = clientTasks.reduce((sum, client) => sum + client.in_progress_count, 0)
  const completedCount = clientTasks.reduce((sum, client) => sum + client.completed_count, 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading tasks...</div>
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-600" />
      default: return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text">All Client Tasks</h2>
        <p className="text-gray-600 mt-1">Overview of tasks across all clients</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
          <div className="text-sm text-gray-600 font-medium mb-1">Total Tasks</div>
          <div className="text-3xl font-bold text-gray-900">{totalTasks}</div>
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

      {/* Client Task Cards */}
      <div className="space-y-4">
        {clientTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No tasks found. Add clients and tasks to get started.
            </CardContent>
          </Card>
        ) : (
          clientTasks.map((client) => (
            <Card key={client.client_id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-white flex items-center justify-center border border-gray-200">
                      <Building2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{client.client_name}</CardTitle>
                      <p className="text-sm text-gray-500">{client.domain}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-red-700">{client.todo_count}</div>
                      <div className="text-xs text-gray-500">To Do</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-yellow-700">{client.in_progress_count}</div>
                      <div className="text-xs text-gray-500">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-700">{client.completed_count}</div>
                      <div className="text-xs text-gray-500">Done</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {client.tasks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No tasks yet</p>
                ) : (
                  <div className="space-y-2">
                    {client.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        {getStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
                            <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">{task.description}</p>
                          {task.due_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {client.total_count > 5 && (
                      <Link
                        href={`/dashboard/clients/${client.client_id}/todos`}
                        className="block text-center text-sm text-blue-600 hover:text-blue-700 py-2"
                      >
                        View all {client.total_count} tasks →
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
