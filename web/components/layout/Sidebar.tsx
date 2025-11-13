/**
 * Sidebar Component
 *
 * Fixed sidebar navigation with:
 * - Icon + text for each menu item
 * - Active state with gradient left border
 * - Smooth transitions
 * - Responsive (collapsible on mobile)
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Link as LinkIcon,
  ListTodo,
  BarChart3,
  Settings,
  HelpCircle,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Connections',
    href: '/dashboard/connections',
    icon: LinkIcon
  },
  {
    name: 'Tasks',
    href: '/dashboard/tasks',
    icon: ListTodo
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  },
  {
    name: 'Help',
    href: '/dashboard/help',
    icon: HelpCircle
  }
]

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <button
          className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4 mt-2 lg:mt-0">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
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

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <div className="font-medium">CAIT v1.0</div>
            <div className="mt-1">Core AI Tool</div>
          </div>
        </div>
      </aside>
    </>
  )
}
