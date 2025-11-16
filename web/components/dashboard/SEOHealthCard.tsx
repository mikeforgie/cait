/**
 * SEOHealthCard Component
 *
 * Displays overall SEO health score with:
 * - Large percentage display
 * - Gradient progress bar (red → yellow → green)
 * - Sub-metrics breakdown (On-Page, Technical, Backlinks)
 * - Status badge
 */

'use client'

import { Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GradientProgress } from '@/components/ui/gradient-progress'
import { StatusDot } from '@/components/ui/status-dot'
import { cn } from '@/lib/utils'

interface SubMetric {
  label: string
  value: number
  status: 'success' | 'warning' | 'danger'
}

interface SEOHealthCardProps {
  overallScore: number
  status: 'success' | 'warning' | 'danger'
  subMetrics: SubMetric[]
}

export function SEOHealthCard({
  overallScore = 85,
  status = 'success',
  subMetrics = [
    { label: 'On-Page', value: 90, status: 'success' },
    { label: 'Technical', value: 75, status: 'warning' },
    { label: 'Backlinks', value: 60, status: 'danger' }
  ]
}: SEOHealthCardProps) {
  const statusLabels = {
    success: 'Healthy',
    warning: 'Needs Attention',
    danger: 'Critical'
  }

  const statusColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <CardTitle>SEO Health</CardTitle>
          </div>
          <div className={cn('px-3 py-1 rounded-full text-xs font-medium', statusColors[status])}>
            {statusLabels[status]}
          </div>
        </div>
        <CardDescription>Overall site optimization score</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-bold gradient-text">
                {overallScore}%
              </span>
            </div>
            <GradientProgress value={overallScore} size="lg" animated />
          </div>

          {/* Sub-metrics */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700">Breakdown</h4>
            {subMetrics.map((metric, index) => {
              const Icon = metric.status === 'success' ? '✓' : metric.status === 'warning' ? '⚠' : '✗'
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusDot status={metric.status} size="sm" pulse={false} />
                    <span className="text-sm text-gray-700">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{metric.value}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
