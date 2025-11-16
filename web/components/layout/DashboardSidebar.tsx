'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Link2, CheckSquare, BarChart3, Settings, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Connections', href: '/dashboard/connections', icon: Link2 },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen border-r border-gray-200 bg-white fixed left-0 top-16 flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 via-yellow-500 to-green-500 rounded-r"></div>
              )}
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom branding */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
            N
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600">CAIT v1.0</div>
            <div className="text-xs text-gray-500">Core AI Tool</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
