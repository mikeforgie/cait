/**
 * RecommendedActionsCard Component
 *
 * Full-width card with AI-powered recommendations:
 * - 3 prioritized action items
 * - Icon + description + count/details
 * - "Generate with AI" button (gradient)
 * - "Schedule" button (secondary)
 */

'use client'

import { Sparkles, FileText, Link, Search, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface Action {
  icon: LucideIcon
  title: string
  description: string
  count?: number
  countLabel?: string
}

interface RecommendedActionsCardProps {
  actions?: Action[]
  onGenerateClick?: (actionIndex: number) => void
  onScheduleClick?: (actionIndex: number) => void
}

export function RecommendedActionsCard({
  actions = [
    {
      icon: FileText,
      title: 'Content Optimization',
      description: 'Update thin content pages with comprehensive information',
      count: 12,
      countLabel: 'pages identified'
    },
    {
      icon: Link,
      title: 'Backlink Building',
      description: 'Build quality backlinks from high-authority domains',
      count: 8,
      countLabel: 'opportunities found'
    },
    {
      icon: Search,
      title: 'Keyword Optimization',
      description: 'Optimize for high-volume keywords with low competition',
      count: 23,
      countLabel: 'keywords suggested'
    }
  ],
  onGenerateClick,
  onScheduleClick
}: RecommendedActionsCardProps) {
  return (
    <Card className="col-span-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <CardTitle>Recommended Actions</CardTitle>
        </div>
        <CardDescription>AI-powered suggestions to improve your SEO</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon

            return (
              <div
                key={index}
                className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-gray-300 transition-all"
              >
                {/* Icon & Title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>

                {/* Count/Details */}
                {action.count && (
                  <div className="mb-3 px-2 py-1.5 bg-blue-50 rounded text-sm">
                    <span className="font-bold text-blue-700">{action.count}</span>
                    <span className="text-blue-600 ml-1">{action.countLabel}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <GradientButton
                    size="sm"
                    className="flex-1"
                    onClick={() => onGenerateClick?.(index)}
                  >
                    Generate with AI
                  </GradientButton>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onScheduleClick?.(index)}
                  >
                    <Calendar className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
