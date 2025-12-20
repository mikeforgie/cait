'use client'

import React, { useState } from 'react'
import { X, Bot, CheckCircle, Clock, AlertTriangle, ExternalLink, Play, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Task } from './TaskCard'

// Task instructions and metadata based on category/name
const TASK_METADATA: Record<string, {
  instructions: string[]
  whyItMatters: string
  estimatedTime: string
  automatable: boolean
  automationDescription?: string
  resources?: { label: string; url: string }[]
}> = {
  'Keyword Research': {
    instructions: [
      'Open Google Search Console or keyword research tool',
      'Analyze current ranking keywords and search queries',
      'Identify keyword gaps and opportunities',
      'Group keywords by intent (informational, transactional, navigational)',
      'Prioritize keywords by search volume and competition',
      'Create a target keyword list for content planning'
    ],
    whyItMatters: 'Keyword research is the foundation of SEO. It helps you understand what your target audience is searching for and guides your content strategy.',
    estimatedTime: '2-4 hours',
    automatable: true,
    automationDescription: 'AI can analyze your current rankings, identify keyword gaps, and suggest high-opportunity keywords based on your niche.',
    resources: [
      { label: 'Google Search Console', url: 'https://search.google.com/search-console' },
      { label: 'Keyword Research Guide', url: 'https://moz.com/beginners-guide-to-seo/keyword-research' }
    ]
  },
  'Technical SEO Audit': {
    instructions: [
      'Run a full site crawl to identify technical issues',
      'Check for broken links and 404 errors',
      'Verify robots.txt and sitemap.xml configuration',
      'Analyze page load speed and Core Web Vitals',
      'Check mobile-friendliness and responsive design',
      'Review URL structure and internal linking',
      'Identify duplicate content issues'
    ],
    whyItMatters: 'Technical SEO ensures search engines can properly crawl and index your site. Poor technical health can prevent even great content from ranking.',
    estimatedTime: '4-6 hours',
    automatable: true,
    automationDescription: 'AI can crawl your site, identify technical issues, and generate a prioritized fix list with specific recommendations.',
    resources: [
      { label: 'Google PageSpeed Insights', url: 'https://pagespeed.web.dev/' },
      { label: 'Technical SEO Checklist', url: 'https://www.semrush.com/blog/technical-seo-checklist/' }
    ]
  },
  'Google Analytics Setup': {
    instructions: [
      'Create or access your Google Analytics 4 property',
      'Add the GA4 tracking code to your website',
      'Configure conversion events and goals',
      'Set up audience segments',
      'Link to Google Search Console',
      'Verify data is being collected correctly'
    ],
    whyItMatters: 'Analytics data is essential for measuring SEO success, understanding user behavior, and making data-driven decisions.',
    estimatedTime: '1-2 hours',
    automatable: false,
    resources: [
      { label: 'GA4 Setup Guide', url: 'https://support.google.com/analytics/answer/9304153' }
    ]
  },
  'Google Search Console Setup': {
    instructions: [
      'Add your property to Google Search Console',
      'Verify domain ownership (DNS, HTML file, or meta tag)',
      'Submit your sitemap.xml',
      'Review any existing errors or warnings',
      'Set up email notifications for critical issues'
    ],
    whyItMatters: 'Search Console provides direct insights from Google about how your site appears in search results and any issues affecting visibility.',
    estimatedTime: '30-60 minutes',
    automatable: false,
    resources: [
      { label: 'Search Console Help', url: 'https://support.google.com/webmasters/answer/9128668' }
    ]
  },
  'Backlink Analysis': {
    instructions: [
      'Export your current backlink profile',
      'Identify high-authority referring domains',
      'Check for toxic or spammy backlinks',
      'Analyze competitor backlink profiles',
      'Identify link building opportunities',
      'Create a disavow file if needed'
    ],
    whyItMatters: 'Backlinks are a major ranking factor. Understanding your backlink profile helps identify opportunities and protect against penalties.',
    estimatedTime: '2-3 hours',
    automatable: true,
    automationDescription: 'AI can analyze your backlink profile, compare against competitors, and identify high-value link opportunities.',
    resources: [
      { label: 'Backlink Analysis Guide', url: 'https://ahrefs.com/blog/backlink-analysis/' }
    ]
  },
  'Content Creation': {
    instructions: [
      'Review target keywords for the content piece',
      'Research top-ranking competitor content',
      'Create a detailed content outline',
      'Write SEO-optimized content with proper headings',
      'Add internal and external links',
      'Optimize images with alt text',
      'Add schema markup if applicable'
    ],
    whyItMatters: 'High-quality, optimized content is essential for ranking. Each piece should target specific keywords and provide genuine value to users.',
    estimatedTime: '4-8 hours per piece',
    automatable: true,
    automationDescription: 'AI can generate content outlines, write drafts, and suggest optimizations based on top-ranking content.',
    resources: [
      { label: 'SEO Writing Tips', url: 'https://yoast.com/complete-guide-seo-copywriting/' }
    ]
  },
  'Local SEO Setup': {
    instructions: [
      'Claim and verify Google Business Profile',
      'Ensure NAP (Name, Address, Phone) consistency',
      'Add business categories and attributes',
      'Upload photos and respond to reviews',
      'Build local citations on relevant directories',
      'Create location-specific landing pages if needed'
    ],
    whyItMatters: 'Local SEO is crucial for businesses serving specific geographic areas. It drives foot traffic and local conversions.',
    estimatedTime: '3-5 hours',
    automatable: true,
    automationDescription: 'AI can audit your local presence, identify citation opportunities, and draft responses to reviews.',
    resources: [
      { label: 'Google Business Profile', url: 'https://business.google.com/' },
      { label: 'Local SEO Guide', url: 'https://moz.com/learn/seo/local' }
    ]
  }
}

// Default metadata for tasks not in the map
const DEFAULT_METADATA = {
  instructions: [
    'Review the task requirements',
    'Gather necessary resources and tools',
    'Complete the task following SEO best practices',
    'Document any changes made',
    'Verify the results'
  ],
  whyItMatters: 'Every SEO task contributes to improving your site\'s visibility and organic traffic.',
  estimatedTime: '1-2 hours',
  automatable: false,
  resources: []
}

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onMarkComplete: (taskId: string) => void
  onRunAutomation?: (taskId: string) => Promise<void>
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onMarkComplete,
  onRunAutomation,
}: TaskDetailModalProps) {
  const [isRunningAutomation, setIsRunningAutomation] = useState(false)

  if (!isOpen || !task) return null

  // Get metadata - check for exact match first, then partial match
  let metadata = TASK_METADATA[task.title]
  if (!metadata) {
    // Try partial match
    const matchingKey = Object.keys(TASK_METADATA).find(key =>
      task.title.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(task.title.toLowerCase())
    )
    metadata = matchingKey ? TASK_METADATA[matchingKey] : DEFAULT_METADATA
  }

  // Use task's own data if available, otherwise use metadata
  const instructions = task.instructions || metadata.instructions
  const whyItMatters = task.whyItMatters || metadata.whyItMatters
  const estimatedTime = task.estimatedTime || metadata.estimatedTime
  const automatable = task.automated ?? metadata.automatable
  const automationDescription = task.automationDescription || metadata.automationDescription
  const resources = task.resources || metadata.resources

  const handleRunAutomation = async () => {
    if (!onRunAutomation) return
    setIsRunningAutomation(true)
    try {
      await onRunAutomation(task.id)
    } finally {
      setIsRunningAutomation(false)
    }
  }

  const getPriorityConfig = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return { label: 'High Priority', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle }
      case 'medium':
        return { label: 'Medium Priority', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Clock }
      case 'low':
        return { label: 'Low Priority', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle }
    }
  }

  const priorityConfig = getPriorityConfig(task.priority)
  const PriorityIcon = priorityConfig.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${priorityConfig.color}`}>
                <PriorityIcon className="w-3 h-3" />
                {priorityConfig.label}
              </span>
              {task.category && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  {task.category.replace('_', ' ')}
                </span>
              )}
              {task.month !== undefined && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  Month {task.month}
                </span>
              )}
              {automatable && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                  <Bot className="w-3 h-3" />
                  AI Automatable
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            )}
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
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Why It Matters</h3>
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
              {whyItMatters}
            </p>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Step-by-Step Instructions</h3>
            <ol className="space-y-2">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-semibold flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Estimated time: <strong>{estimatedTime}</strong></span>
          </div>

          {/* AI Automation Section */}
          {automatable && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">AI Can Help With This</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {automationDescription || 'Our AI agent can automatically complete this task for you.'}
                  </p>
                  <Button
                    onClick={handleRunAutomation}
                    disabled={isRunningAutomation || !onRunAutomation}
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
          {resources && resources.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Helpful Resources</h3>
              <div className="space-y-2">
                {resources.map((resource, index) => (
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
          {task.status !== 'completed' && (
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
  )
}
