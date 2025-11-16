/**
 * ConnectionsSummaryCard Component
 *
 * Dashboard summary of platform connections with:
 * - Status dots (pulsing animation)
 * - Platform list with connection status
 * - Summary count
 * - "Manage" link to full connections page
 */

'use client'

import Link from 'next/link'
import { Link as LinkIcon, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'

interface Platform {
  name: string
  status: 'success' | 'warning' | 'danger'
}

interface ConnectionsSummaryCardProps {
  platforms: Platform[]
}

export function ConnectionsSummaryCard({
  platforms = [
    { name: 'Google Search Console', status: 'success' },
    { name: 'Google Analytics', status: 'success' },
    { name: 'Bing Webmaster Tools', status: 'warning' },
    { name: 'Microsoft Clarity', status: 'success' },
    { name: 'OpenAI API', status: 'danger' },
    { name: 'Perplexity API', status: 'danger' }
  ]
}: ConnectionsSummaryCardProps) {
  const connectedCount = platforms.filter(p => p.status === 'success').length
  const totalCount = platforms.length

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-gray-600" />
          <CardTitle>Connections</CardTitle>
        </div>
        <CardDescription>
          <span className="text-gray-900 font-medium">{connectedCount} of {totalCount}</span> platforms connected
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Platform List */}
          {platforms.map((platform, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <StatusDot status={platform.status} size="sm" />
                <span className="text-gray-700">{platform.name}</span>
              </div>
            </div>
          ))}

          {/* Manage Link */}
          <Link
            href="/dashboard/connections"
            className="flex items-center justify-between w-full mt-4 pt-4 border-t border-gray-200 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <span>Manage Connections</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
