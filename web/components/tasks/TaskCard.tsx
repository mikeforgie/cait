/**
 * TaskCard Component
 *
 * Individual task card for the Kanban board with:
 * - Task title and description
 * - Priority indicator
 * - Due date
 * - Assignee/tags
 * - Drag handle
 */

'use client'

import { GripVertical, Calendar, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'

export interface Task {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  tags?: string[]
  status: 'todo' | 'in_progress' | 'completed'
  // Extended fields for detail view
  month?: number
  category?: string
  automated?: boolean
  instructions?: string[]
  whyItMatters?: string
  estimatedTime?: string
  automationDescription?: string
  resources?: { label: string; url: string }[]
}

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  onClick?: () => void
}

export function TaskCard({ task, isDragging = false, onClick }: TaskCardProps) {
  const priorityConfig = {
    low: { color: 'bg-blue-100 text-blue-800', dot: 'success' as const },
    medium: { color: 'bg-yellow-100 text-yellow-800', dot: 'warning' as const },
    high: { color: 'bg-red-100 text-red-800', dot: 'danger' as const }
  }

  const config = priorityConfig[task.priority]

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click when dragging
    if (isDragging) return
    onClick?.()
  }

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all border-gray-200 ${
        isDragging ? 'opacity-50 rotate-2 scale-105 cursor-grabbing' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        {/* Drag Handle */}
        <div className="flex items-start gap-2 mb-2">
          <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
            )}
          </div>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center gap-2 mb-2">
          <StatusDot status={config.dot} size="sm" pulse={false} />
          <Badge className={`text-xs ${config.color}`}>
            {task.priority.toUpperCase()}
          </Badge>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <Calendar className="w-3 h-3" />
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Overdue Warning */}
        {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span>Overdue</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
