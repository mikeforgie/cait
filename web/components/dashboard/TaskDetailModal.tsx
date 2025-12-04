'use client';

import React, { useState } from 'react';
import { X, Bot, CheckCircle, Clock, AlertTriangle, ExternalLink, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TaskDetail {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  // Extended fields for detail view
  instructions?: string[];
  whyItMatters?: string;
  estimatedTime?: string;
  automatable?: boolean;
  automationDescription?: string;
  resources?: { label: string; url: string }[];
}

interface TaskDetailModalProps {
  task: TaskDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkComplete: (taskId: string) => void;
  onRunAutomation?: (taskId: string) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onMarkComplete,
  onRunAutomation,
}: TaskDetailModalProps) {
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);

  if (!isOpen || !task) return null;

  const handleRunAutomation = async () => {
    if (!onRunAutomation) return;
    setIsRunningAutomation(true);
    try {
      await onRunAutomation(task.id);
    } finally {
      setIsRunningAutomation(false);
    }
  };

  const getPriorityConfig = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return { label: 'High Priority', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle };
      case 'medium':
        return { label: 'Medium Priority', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Clock };
      case 'low':
        return { label: 'Low Priority', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${priorityConfig.color}`}>
                <PriorityIcon className="w-3 h-3" />
                {priorityConfig.label}
              </span>
              {task.automatable && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                  <Bot className="w-3 h-3" />
                  AI Automatable
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Why It Matters */}
          {task.whyItMatters && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Why It Matters</h3>
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
                {task.whyItMatters}
              </p>
            </div>
          )}

          {/* Instructions */}
          {task.instructions && task.instructions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Step-by-Step Instructions</h3>
              <ol className="space-y-2">
                {task.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-semibold flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 pt-0.5">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Estimated Time */}
          {task.estimatedTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Estimated time: <strong>{task.estimatedTime}</strong></span>
            </div>
          )}

          {/* AI Automation Section */}
          {task.automatable && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">AI Can Help With This</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {task.automationDescription || 'Our AI agent can automatically complete this task for you.'}
                  </p>
                  <Button
                    onClick={handleRunAutomation}
                    disabled={isRunningAutomation}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isRunningAutomation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run AI Agent
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Resources */}
          {task.resources && task.resources.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Helpful Resources</h3>
              <div className="space-y-2">
                {task.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {resource.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {task.status !== 'done' && (
            <Button
              onClick={() => onMarkComplete(task.id)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
