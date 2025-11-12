'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, PlayCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RunAutomationButtonProps {
  clientId: string
  tasks: Array<{
    id: string
    name: string
    automated: boolean
    status: string
  }>
  disabled?: boolean
}

export function RunAutomationButton({ clientId, tasks, disabled }: RunAutomationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRunAutomation = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Find automated tasks
      const automatedTasks = tasks.filter(t => t.automated && t.status !== 'completed')

      if (automatedTasks.length === 0) {
        setError('No automated tasks to run')
        setIsLoading(false)
        return
      }

      // Run keyword research if found
      const keywordTask = automatedTasks.find(t => t.name.toLowerCase().includes('keyword'))
      if (keywordTask) {
        setCurrentStep('Running keyword research...')
        const response = await fetch('/api/automation/keyword-research', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientId, taskId: keywordTask.id }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Keyword research failed')
        }
      }

      // Run technical audit if found
      const auditTask = automatedTasks.find(t => t.name.toLowerCase().includes('audit'))
      if (auditTask) {
        setCurrentStep('Running technical audit...')
        const response = await fetch('/api/automation/technical-audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientId, taskId: auditTask.id }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Technical audit failed')
        }
      }

      setCurrentStep('Automation complete!')
      setSuccess(true)

      // Refresh the page to show updated tasks
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const hasAutomatedTasks = tasks.some(t => t.automated && t.status !== 'completed')

  if (!hasAutomatedTasks && !disabled) {
    return null
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {currentStep && !error && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          {currentStep}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Automation completed! Refreshing...
        </div>
      )}

      <Button
        variant="outline"
        onClick={handleRunAutomation}
        disabled={isLoading || success || disabled}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {currentStep || 'Running...'}
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Completed!
          </>
        ) : (
          <>
            <PlayCircle className="mr-2 h-4 w-4" />
            Run Month 0 Automation
          </>
        )}
      </Button>
    </div>
  )
}
