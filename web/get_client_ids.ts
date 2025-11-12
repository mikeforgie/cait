import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, domain, status')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching clients:', error)
    return
  }

  console.log('\n📋 Available Clients:\n')
  data?.forEach((client: any) => {
    console.log(`${client.name} (${client.domain})`)
    console.log(`   ID: ${client.id}`)
    console.log(`   Status: ${client.status}`)
    console.log(`   URL: http://localhost:3000/dashboard/clients/${client.id}`)
    console.log('')
  })
}

getClients()
