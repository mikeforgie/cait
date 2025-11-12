import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Supabase URL:', supabaseUrl ? '✓' : '✗')
console.log('Supabase Key:', supabaseKey ? '✓' : '✗')

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetTasks() {
  const clientId = '2233ae6a-d90d-49fa-8770-5a55c3a22785'

  console.log('Resetting keyword research and technical audit tasks...')

  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'pending', result: null })
    .eq('client_id', clientId)
    .or('name.ilike.%Keyword Research%,name.ilike.%Technical%Audit%')
    .select()

  if (error) {
    console.error('Error resetting tasks:', error)
    process.exit(1)
  }

  console.log('Reset', data?.length, 'tasks:', data?.map(t => t.name))
  console.log('\nNow you can run the automation again to see the logs!')
}

resetTasks()
