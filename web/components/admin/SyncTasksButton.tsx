'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface SyncResult {
  success: boolean
  message: string
  clients?: number
  totalAdded?: number
  results?: Array<{ clientId: string; clientName: string; added: number }>
}

export function SyncTasksButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/automation/sync-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Syncing...' : 'Sync All Tasks'}
      </button>

      {result && (
        <div
          className={`p-3 rounded-md text-sm ${
            result.success
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <p className="font-medium">{result.message}</p>
          {result.results && result.results.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.results
                .filter(r => r.added > 0)
                .map(r => (
                  <li key={r.clientId}>
                    {r.clientName}: +{r.added} tasks
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
