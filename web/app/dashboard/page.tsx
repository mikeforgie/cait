import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch clients
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Clients</h2>
          <p className="text-neutral-600">Manage your SEO clients</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{client.name}</CardTitle>
                      <CardDescription>{client.domain}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        client.status === 'active'
                          ? 'default'
                          : client.status === 'paused'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {client.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {client.focus_service && (
                      <div>
                        <span className="font-medium">Focus: </span>
                        {client.focus_service}
                      </div>
                    )}
                    {client.primary_location && (
                      <div>
                        <span className="font-medium">Location: </span>
                        {client.primary_location}
                      </div>
                    )}
                    <div>
                      <Badge variant={client.onboarding_completed ? 'default' : 'outline'}>
                        {client.onboarding_completed ? 'Onboarded' : 'Onboarding'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-neutral-600 mb-4">No clients yet. Add your first client to get started.</p>
            <Link href="/dashboard/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
