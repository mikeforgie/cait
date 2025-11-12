'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface InitializeTasksButtonProps {
  clientId: string
  hasTasks: boolean
}

export function InitializeTasksButton({ clientId, hasTasks }: InitializeTasksButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleInitialize = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/automation/initialize-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize tasks')
      }

      setSuccess(true)

      // Refresh the page to show new tasks
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (hasTasks) {
    return null
  }

  return (
    <div className="text-center py-12">
      <p className="mb-4 text-neutral-600">No tasks created yet</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Tasks initialized successfully! Refreshing...
        </div>
      )}

      <Button
        onClick={handleInitialize}
        disabled={isLoading || success}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initializing Tasks...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Tasks Created!
          </>
        ) : (
          'Initialize Month 0-12 Tasks'
        )}
      </Button>
    </div>
  )
}
