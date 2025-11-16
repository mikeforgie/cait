/**
 * ActiveTasksCard Component
 *
 * Dashboard summary of active tasks with:
 * - Task statistics (To-Do, In Progress, Completed)
 * - Quick task preview list
 * - "View All" link to full tasks page
 */

'use client'

import Link from 'next/link'
import { ListTodo, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'

interface TaskStats {
  toDo: number
  inProgress: number
  completed: number
}

interface Task {
  title: string
  status: 'todo' | 'in_progress' | 'completed'
}

interface ActiveTasksCardProps {
  stats: TaskStats
  recentTasks: Task[]
}

export function ActiveTasksCard({
  stats = {
    toDo: 12,
    inProgress: 5,
    completed: 8
  },
  recentTasks = [
    { title: 'Optimize page speed', status: 'in_progress' },
    { title: 'Fix broken backlinks', status: 'todo' },
    { title: 'Update meta descriptions', status: 'in_progress' }
  ]
}: ActiveTasksCardProps) {
  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return { dot: 'success' as const, label: 'Completed' }
      case 'in_progress':
        return { dot: 'warning' as const, label: 'In Progress' }
      case 'todo':
        return { dot: 'danger' as const, label: 'To Do' }
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-gray-600" />
          <CardTitle>Active Tasks</CardTitle>
        </div>
        <CardDescription>Current SEO optimization tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Task Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="text-2xl font-bold text-red-700">{stats.toDo}</div>
              <div className="text-xs text-red-600 font-medium mt-1">To Do</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="text-2xl font-bold text-yellow-700">{stats.inProgress}</div>
              <div className="text-xs text-yellow-600 font-medium mt-1">In Progress</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
              <div className="text-xs text-green-600 font-medium mt-1">Completed</div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Recent Tasks</h4>
            {recentTasks.map((task, index) => {
              const config = getStatusConfig(task.status)
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <StatusDot status={config.dot} size="sm" pulse={task.status === 'in_progress'} />
                  <span className="text-gray-700 flex-1">{task.title}</span>
                </div>
              )
            })}
          </div>

          {/* View All Link */}
          <Link
            href="/dashboard/tasks"
            className="flex items-center justify-between w-full mt-4 pt-4 border-t border-gray-200 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <span>View All Tasks</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
