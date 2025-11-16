/**
 * KanbanBoard Component
 *
 * Kanban-style task board with drag-and-drop:
 * - Three columns: To Do, In Progress, Completed
 * - HTML5 drag-and-drop functionality
 * - Visual feedback during dragging
 * - Task count per column
 */

'use client'

import { useState } from 'react'
import { TaskCard, Task } from './TaskCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'

interface KanbanBoardProps {
  initialTasks: Task[]
  onTaskMove?: (taskId: string, newStatus: Task['status']) => void
}

type ColumnStatus = Task['status']

const columns: { id: ColumnStatus; title: string; dot: 'danger' | 'warning' | 'success' }[] = [
  { id: 'todo', title: 'To Do', dot: 'danger' },
  { id: 'in_progress', title: 'In Progress', dot: 'warning' },
  { id: 'completed', title: 'Completed', dot: 'success' }
]

export function KanbanBoard({ initialTasks, onTaskMove }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ColumnStatus | null>(null)

  const getTasksByStatus = (status: ColumnStatus) => {
    return tasks.filter(task => task.status === status)
  }

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: ColumnStatus) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, columnId: ColumnStatus) => {
    e.preventDefault()

    if (!draggedTask) return

    const updatedTasks = tasks.map(task =>
      task.id === draggedTask ? { ...task, status: columnId } : task
    )

    setTasks(updatedTasks)
    onTaskMove?.(draggedTask, columnId)
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(column => {
        const columnTasks = getTasksByStatus(column.id)
        const isOver = dragOverColumn === column.id

        return (
          <Card
            key={column.id}
            className={`transition-all ${
              isOver ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
            }`}
            onDragOver={e => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, column.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <StatusDot status={column.dot} size="sm" pulse={false} />
                <CardTitle className="text-lg">{column.title}</CardTitle>
              </div>
              <CardDescription>{columnTasks.length} tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 min-h-[400px]">
                {columnTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <TaskCard
                      task={task}
                      isDragging={draggedTask === task.id}
                    />
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg text-gray-400">
                    <p className="text-sm">
                      {isOver ? 'Drop task here' : 'No tasks'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
