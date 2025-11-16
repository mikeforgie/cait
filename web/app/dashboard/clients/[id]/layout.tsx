import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
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

  // Fetch client data to verify it exists
  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .single()

  if (error || !client) {
    notFound()
  }

  return (
    <>
      {/* Client-specific sidebar - replaces main sidebar */}
      <ClientSidebar clientId={client.id} />

      {/* Main content - no additional offset needed, parent layout handles it */}
      {children}
    </>
  )
}
