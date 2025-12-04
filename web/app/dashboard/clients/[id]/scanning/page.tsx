import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScanDashboard } from '@/components/scanning/scan-dashboard';

export default async function ScanningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = id;
  const supabase = await createClient();

  // Get client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (!client) {
    redirect('/dashboard');
  }

  // Get latest scan
  const { data: latestScan } = await supabase
    .from('seo_scans')
    .select('*')
    .eq('client_id', clientId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  // Get latest issues
  const { data: issues } = await supabase
    .from('seo_issues')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'open')
    .order('severity', { ascending: true }) // Critical first
    .limit(50);

  // Get todos
  const { data: todos } = await supabase
    .from('seo_todos')
    .select('*')
    .eq('client_id', clientId)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });

  return (
    <ScanDashboard
      client={client}
      latestScan={latestScan || undefined}
      issues={issues || []}
      todos={todos || []}
    />
  );
}
