import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ClientSidebar } from '@/components/layout/ClientSidebar'

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch client data
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) {
    notFound()
  }

  return (
    <div className="flex">
      {/* Client-specific Sidebar */}
      <ClientSidebar
        clientId={client.id}
        clientName={client.name}
        clientStatus={client.status}
      />

      {/* Main Content */}
      <main className="flex-1 pt-4 pr-4 pb-4 pl-0 lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-0 min-h-[calc(100vh-4rem)] ml-0 lg:ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
