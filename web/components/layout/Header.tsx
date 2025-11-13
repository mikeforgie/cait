/**
 * Header Component
 *
 * Top navigation bar with:
 * - Three-dot gradient logo + CAIT branding
 * - Current page title
 * - Notification bell with badge
 * - Settings icon
 * - User profile avatar
 */

'use client'

import { Bell, Menu, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  user?: {
    name: string
    email: string
    initials: string
  }
  currentPage?: string
  notificationCount?: number
  onMenuToggle?: () => void
}

export function Header({
  user = { name: 'User', email: 'user@example.com', initials: 'U' },
  currentPage = 'Dashboard',
  notificationCount = 0,
  onMenuToggle
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left Section: Logo + Page Title */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={onMenuToggle}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Logo: Three gradient dots + CAIT */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#ff3333]" />
              <div className="w-2 h-2 rounded-full bg-[#ffcc00]" />
              <div className="w-2 h-2 rounded-full bg-[#1eff00]" />
            </div>
            <span className="text-xl font-bold gradient-text">CAIT</span>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-gray-200" />

          {/* Current Page */}
          <h1 className="hidden md:block text-lg font-semibold text-gray-900">
            {currentPage}
          </h1>
        </div>

        {/* Right Section: Notifications + Settings + Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-md transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* User Profile */}
          <button className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-md transition-colors">
            <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white rounded-full gradient-bg">
              {user.initials}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
