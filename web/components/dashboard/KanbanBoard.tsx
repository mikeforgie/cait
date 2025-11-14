'use client';

import React, { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: 'red' | 'orange' | 'green';
  tasks: Task[];
}

export const KanbanBoard = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: 'onsite',
      title: 'On-Site',
      color: 'red',
      tasks: [
        {
          id: '1',
          title: 'Fix title tags',
          description: '5 pages need updates',
          priority: 'high',
        },
        {
          id: '2',
          title: 'Update meta descriptions',
          description: '10 pages',
          priority: 'medium',
        },
      ],
    },
    {
      id: 'offsite',
      title: 'Off-Site',
      color: 'orange',
      tasks: [
        {
          id: '3',
          title: 'Build backlinks',
          description: '3 URLs in queue',
          priority: 'high',
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      color: 'green',
      tasks: [
        {
          id: '4',
          title: 'Write blog post',
          description: 'About SEO best practices',
          priority: 'medium',
        },
        {
          id: '5',
          title: 'Create video script',
          description: 'Technical SEO guide',
          priority: 'low',
        },
      ],
    },
  ]);

  const [draggedTask, setDraggedTask] = useState<{ columnId: string; taskId: string } | null>(null);

  const handleDragStart = (columnId: string, taskId: string) => {
    setDraggedTask({ columnId, taskId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask) return;

    setColumns(
      columns.map((col) => {
        if (col.id === draggedTask.columnId) {
          return {
            ...col,
            tasks: col.tasks.filter((task) => task.id !== draggedTask.taskId),
          };
        }

        if (col.id === targetColumnId) {
          const draggedTaskObj = columns
            .find((c) => c.id === draggedTask.columnId)
            ?.tasks.find((t) => t.id === draggedTask.taskId);

          if (draggedTaskObj) {
            return {
              ...col,
              tasks: [...col.tasks, draggedTaskObj],
            };
          }
        }

        return col;
      })
    );

    setDraggedTask(null);
  };

  const deleteTask = (columnId: string, taskId: string) => {
    setColumns(
      columns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: col.tasks.filter((task) => task.id !== taskId),
          };
        }
        return col;
      })
    );
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      case 'low':
        return 'border-l-4 border-l-green-500';
    }
  };

  const getColumnColor = (color: 'red' | 'orange' | 'green') => {
    switch (color) {
      case 'red':
        return {
          dot: 'bg-red-500 shadow-lg shadow-red-500/40',
          header: 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b-2 border-red-500',
          count: 'text-red-500 font-bold',
        };
      case 'orange':
        return {
          dot: 'bg-yellow-500 shadow-lg shadow-yellow-500/30',
          header: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-b-2 border-yellow-500',
          count: 'text-yellow-500 font-bold',
        };
      case 'green':
        return {
          dot: 'bg-green-500 shadow-lg shadow-green-500/40',
          header: 'bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-b-2 border-green-500',
          count: 'text-green-500 font-bold',
        };
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
          To Dos
        </h2>
        <p className="text-gray-600 mt-2">Manage your SEO tasks across channels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => {
          const colorConfig = getColumnColor(column.color);
          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
              className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {/* Column Header */}
              <div className={`p-4 ${colorConfig.header}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colorConfig.dot}`} />
                    <h3 className="font-bold text-lg text-gray-900">{column.title}</h3>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${colorConfig.count} bg-gray-100`}>
                    {column.tasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks Container */}
              <div className="p-4 space-y-3 min-h-96 max-h-[600px] overflow-y-auto">
                {column.tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-sm">No tasks yet</p>
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(column.id, task.id)}
                      className={`p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <button
                          onClick={() => deleteTask(column.id, task.id)}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                        </button>
                      </div>

                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{task.title}</h4>
                      <p className="text-xs text-gray-600 mb-3">{task.description}</p>

                      {/* Priority Badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            task.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Task Button */}
              <div className="p-4 border-t border-gray-200">
                <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900 transition-colors font-semibold text-sm">
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
