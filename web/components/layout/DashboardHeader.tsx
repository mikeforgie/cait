'use client'

import { Bell, Settings } from 'lucide-react'

interface DashboardHeaderProps {
  user?: {
    name: string
    email: string
    initials: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white fixed top-0 left-0 right-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - Logo and Title */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {/* Three dots logo */}
            <div className="flex items-center gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
            {/* CAIT text with gradient */}
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              CAIT
            </span>
          </div>
          {/* Page title */}
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        </div>

        {/* Right side - Icons and User */}
        <div className="flex items-center gap-4">
          {/* Bell icon with notification badge */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings icon */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* User profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
              {user?.initials || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user?.name?.split('@')[0] || 'test'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
