import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { SyncTasksButton } from '@/components/admin/SyncTasksButton'

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

  // Calculate stats
  const totalClients = clients?.length || 0
  const activeClients = clients?.filter(c => c.status === 'active').length || 0
  const pausedClients = clients?.filter(c => c.status === 'paused').length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Your Clients
          </h1>
          <p className="text-gray-600 mt-1">Manage and monitor your SEO clients</p>
        </div>
        <div className="flex items-center gap-3">
          <SyncTasksButton />
          <Link href="/dashboard/clients/new">
            <button className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 hover:opacity-90 transition-opacity flex items-center gap-2">
              + Add Client
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Clients */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-gray-600">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-gray-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{activeClients}</div>
          </CardContent>
        </Card>

        {/* Paused Clients */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-gray-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Paused Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-600">{pausedClients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Client Cards */}
      {clients && clients.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {clients.map((client) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                      </div>
                    </div>
                    {client.status === 'active' && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        active
                      </Badge>
                    )}
                    {client.status === 'paused' && (
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
                        paused
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {client.domain}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {client.focus_service && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Focus: </span>
                      <span className="text-gray-600">{client.focus_service}</span>
                    </div>
                  )}
                  {client.primary_location && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Location: </span>
                      <span className="text-gray-600">{client.primary_location}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <button className="px-4 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      {client.onboarding_completed ? 'Onboarded' : 'Onboarding...'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 mb-4">No clients yet. Add your first client to get started.</p>
            <Link href="/dashboard/clients/new">
              <button className="px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-orange-500 via-yellow-500 to-green-500 hover:opacity-90 transition-opacity flex items-center gap-2">
                + Add Your First Client
              </button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
