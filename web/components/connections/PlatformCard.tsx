/**
 * PlatformCard Component
 *
 * Visual connection card for each platform with:
 * - Colored border based on connection status
 * - Platform icon and description
 * - Action button (Connect/Reconnect/Configure)
 * - Status indicator with pulse animation
 */

'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusDot } from '@/components/ui/status-dot'
import { Settings } from 'lucide-react'

interface PlatformCardProps {
  name: string
  description: string
  icon: LucideIcon
  status: 'connected' | 'pending' | 'disconnected'
  onConnect?: () => void
  onConfigure?: () => void
  lastSync?: string
}

export function PlatformCard({
  name,
  description,
  icon: Icon,
  status,
  onConnect,
  onConfigure,
  lastSync
}: PlatformCardProps) {
  const statusConfig = {
    connected: {
      border: 'border-green-300',
      bg: 'from-green-50 to-white',
      dot: 'success' as const,
      label: 'Connected',
      buttonText: 'Reconnect',
      buttonVariant: 'secondary' as const
    },
    pending: {
      border: 'border-yellow-300',
      bg: 'from-yellow-50 to-white',
      dot: 'warning' as const,
      label: 'Pending',
      buttonText: 'Complete Setup',
      buttonVariant: 'primary' as const
    },
    disconnected: {
      border: 'border-red-300',
      bg: 'from-red-50 to-white',
      dot: 'danger' as const,
      label: 'Disconnected',
      buttonText: 'Connect',
      buttonVariant: 'primary' as const
    }
  }

  const config = statusConfig[status]

  return (
    <Card className={`hover:shadow-xl transition-all border-2 ${config.border} bg-gradient-to-br ${config.bg}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Icon className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <StatusDot status={config.dot} size="sm" pulse={status === 'pending'} />
                <span className="text-xs font-medium text-gray-600">{config.label}</span>
              </div>
            </div>
          </div>
          {status === 'connected' && onConfigure && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onConfigure}
              className="text-gray-500 hover:text-gray-700"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 min-h-[40px]">
          {description}
        </CardDescription>

        {lastSync && status === 'connected' && (
          <div className="mb-4 text-xs text-gray-500">
            Last synced: {lastSync}
          </div>
        )}

        <button
          className={`w-full px-6 py-2.5 rounded-lg font-medium transition-all ${
            config.buttonVariant === 'primary'
              ? 'text-white bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 hover:opacity-90'
              : 'text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300'
          }`}
          onClick={onConnect}
        >
          {config.buttonText}
        </button>
      </CardContent>
    </Card>
  )
}
