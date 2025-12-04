'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, Link2, ListTodo, TrendingUp, BarChart3, Settings, HelpCircle, Target, Sparkles, Scan } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClientSidebarProps {
  clientId: string
}

const clientNavigation = [
  { name: 'Client Dashboard', href: '', icon: LayoutGrid },
  { name: 'Connections', href: '/connections', icon: Link2 },
  { name: 'To Dos', href: '/todos', icon: ListTodo },
  { name: 'SEO Scanning', href: '/scanning', icon: Scan },
  { name: 'Rankings', href: '/rankings', icon: TrendingUp },
  { name: 'Attribution', href: '/attribution', icon: Target },
  { name: 'Content Studio', href: '/content', icon: Sparkles },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
]

export function ClientSidebar({ clientId }: ClientSidebarProps) {
  const pathname = usePathname()
  const baseHref = `/dashboard/clients/${clientId}`

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] border-r border-gray-200 bg-white fixed left-0 top-16 flex flex-col z-40">
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {/* Home button to return to main dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            pathname === '/dashboard'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        {/* Divider */}
        <div className="border-t border-gray-200 my-2"></div>

        {clientNavigation.map((item) => {
          const fullHref = `${baseHref}${item.href}`
          const isActive = pathname === fullHref
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={fullHref}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
