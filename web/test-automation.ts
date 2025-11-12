/**
 * Test script for CAIT automation system
 * Run with: npx tsx test-automation.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAutomation() {
  console.log('🧪 Testing CAIT Automation System\n')

  // 1. Check for existing clients
  console.log('📊 Fetching clients...')
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .limit(5)

  if (clientsError) {
    console.error('❌ Error fetching clients:', clientsError)
    return
  }

  console.log(`✅ Found ${clients?.length || 0} clients\n`)

  if (clients && clients.length > 0) {
    const testClient = clients[0]
    console.log(`🎯 Testing with client: ${testClient.business_name}`)
    console.log(`   Domain: ${testClient.domain}`)
    console.log(`   ID: ${testClient.id}\n`)

    // 2. Test task initialization
    console.log('📝 Testing task initialization...')
    try {
      const response = await fetch('http://localhost:3000/api/automation/initialize-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: testClient.id }),
      })

      const result = await response.json()
      console.log('✅ Task initialization:', result.success ? 'SUCCESS' : 'FAILED')
      if (!result.success) {
        console.log('   Error:', result.error)
      }
      console.log()
    } catch (error) {
      console.error('❌ Task initialization failed:', error)
      console.log()
    }

    // 3. Check created tasks
    console.log('📋 Checking created tasks...')
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', testClient.id)
      .order('month', { ascending: true })

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError)
    } else {
      console.log(`✅ Found ${tasks?.length || 0} tasks`)

      // Group by month
      const byMonth = tasks?.reduce((acc: any, task: any) => {
        acc[task.month] = (acc[task.month] || 0) + 1
        return acc
      }, {}) || {}

      console.log('   Tasks by month:', byMonth)
      console.log()
    }

    // 4. Check for automated tasks
    const automatedTasks = tasks?.filter((t: any) => t.automated) || []
    console.log(`🤖 Found ${automatedTasks.length} automated tasks`)

    if (automatedTasks.length > 0) {
      console.log('   Automated task categories:')
      const categories = [...new Set(automatedTasks.map((t: any) => t.category))]
      categories.forEach(cat => console.log(`   - ${cat}`))
      console.log()
    }

  } else {
    console.log('⚠️  No clients found in database')
    console.log('   Create a client first through the UI or database\n')
  }

  console.log('🎉 Test complete!')
}

testAutomation().catch(console.error)
