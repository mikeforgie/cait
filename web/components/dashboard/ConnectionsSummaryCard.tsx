/**
 * ConnectionsSummaryCard Component
 *
 * Dashboard summary of platform connections with:
 * - Status dots (pulsing animation)
 * - Platform list with connection status
 * - Summary count
 * - "Manage" link to full connections page
 * - AI Guide button for setup help
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Link as LinkIcon, ChevronRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusDot } from '@/components/ui/status-dot'
import { AIGuideModal } from '@/components/ai/ai-guide-modal'
import { getGuide } from '@/lib/ai/guides/guide-library'

interface Platform {
  id?: string
  name: string
  status: 'success' | 'warning' | 'danger'
  guideId?: string // Maps to a guide in the library
}

interface ConnectionsSummaryCardProps {
  platforms?: Platform[]
  onConnectionComplete?: () => void
}

const DEFAULT_PLATFORMS: Platform[] = [
  { id: 'gsc', name: 'Google Search Console', status: 'danger', guideId: 'connect-gsc' },
  { id: 'ga4', name: 'Google Analytics 4', status: 'danger', guideId: 'connect-ga4' },
  { id: 'anthropic', name: 'Anthropic API', status: 'danger', guideId: 'add-anthropic-key' },
]

export function ConnectionsSummaryCard({
  platforms = DEFAULT_PLATFORMS,
  onConnectionComplete,
}: ConnectionsSummaryCardProps) {
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  const connectedCount = platforms.filter(p => p.status === 'success').length
  const totalCount = platforms.length

  const selectedGuide = selectedGuideId ? getGuide(selectedGuideId) : null

  const handleOpenGuide = (guideId: string) => {
    setSelectedGuideId(guideId)
    setIsGuideOpen(true)
  }

  const handleCloseGuide = () => {
    setIsGuideOpen(false)
    setSelectedGuideId(null)
  }

  const handleGuideComplete = () => {
    handleCloseGuide()
    onConnectionComplete?.()
  }

  return (
    <>
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
              <div key={platform.id || index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <StatusDot status={platform.status} size="sm" />
                  <span className="text-gray-700">{platform.name}</span>
                </div>
                {/* Show Guide Me button for disconnected platforms with a guide */}
                {platform.status !== 'success' && platform.guideId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenGuide(platform.guideId!)}
                    className="h-7 px-2 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    Guide Me
                  </Button>
                )}
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

      {/* AI Guide Modal */}
      {selectedGuide && (
        <AIGuideModal
          guide={selectedGuide}
          isOpen={isGuideOpen}
          onClose={handleCloseGuide}
          onComplete={handleGuideComplete}
        />
      )}
    </>
  )
}
