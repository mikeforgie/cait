/**
 * ClientSidebar Component
 *
 * Client-specific sidebar navigation with:
 * - Client name and status
 * - Navigation for client-specific views (Dashboard, Connections, Tasks, Analytics)
 * - Active state with gradient left border
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Link as LinkIcon,
  ListTodo,
  BarChart3,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusDot } from '@/components/ui/status-dot'

interface ClientSidebarProps {
  clientId: string
  clientName: string
  clientStatus: 'active' | 'paused' | 'inactive'
  isOpen?: boolean
  onClose?: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '',
    icon: LayoutDashboard
  },
  {
    name: 'Connections',
    href: '/connections',
    icon: LinkIcon
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: ListTodo
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3
  }
]

export function ClientSidebar({
  clientId,
  clientName,
  clientStatus,
  isOpen = false,
  onClose
}: ClientSidebarProps) {
  const pathname = usePathname()
  const baseHref = `/dashboard/clients/${clientId}`

  const statusConfig = {
    active: { status: 'success' as const, label: 'Active' },
    paused: { status: 'warning' as const, label: 'Paused' },
    inactive: { status: 'danger' as const, label: 'Inactive' }
  }

  const statusInfo = statusConfig[clientStatus] || statusConfig.inactive

  return (
    <aside
      className={cn(
        'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 transition-transform duration-300',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Client Info */}
      <div className="p-4 border-b border-gray-200">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{clientName}</h3>
          <div className="flex items-center gap-2">
            <StatusDot status={statusInfo.status} size="sm" pulse={clientStatus === 'active'} />
            <span className="text-xs text-gray-600">{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const href = `${baseHref}${item.href}`
          const isActive = pathname === href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                'hover:bg-gray-100',
                isActive
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              onClick={onClose}
            >
              {/* Gradient left border for active state */}
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-1 rounded-r gradient-bg" />
              )}

              <Icon className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
              )} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
