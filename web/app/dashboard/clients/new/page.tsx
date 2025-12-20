'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    focus_service: '',
    primary_location: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('clients').insert([
        {
          name: formData.name,
          domain: formData.domain,
          focus_service: formData.focus_service || null,
          primary_location: formData.primary_location || null,
        },
      ]).select('id').single()

      if (error) {
        setError(error.message)
        return
      }

      // Initialize Month 0-12 tasks for the new client
      if (data?.id) {
        try {
          const response = await fetch('/api/automation/initialize-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: data.id }),
          })
          if (!response.ok) {
            console.error('Failed to initialize tasks:', await response.text())
          }
        } catch (taskError) {
          console.error('Error initializing tasks:', taskError)
          // Don't fail client creation if task init fails
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Client</CardTitle>
          <CardDescription>Enter the client information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Acme Corp"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Input
                  id="domain"
                  name="domain"
                  placeholder="acme.com"
                  value={formData.domain}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-neutral-500">
                  Without https:// or www.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus_service">Focus Service</Label>
                <Input
                  id="focus_service"
                  name="focus_service"
                  placeholder="e.g., Plumbing, Legal Services"
                  value={formData.focus_service}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_location">Primary Location</Label>
                <Input
                  id="primary_location"
                  name="primary_location"
                  placeholder="e.g., New York, NY"
                  value={formData.primary_location}
                  onChange={handleChange}
                />
                <p className="text-xs text-neutral-500">
                  Connect Google Analytics & Search Console after creating the client
                </p>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Client'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
