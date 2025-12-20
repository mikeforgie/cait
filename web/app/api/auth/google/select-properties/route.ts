/**
 * Google OAuth Select Properties Route
 *
 * Saves the user's selected GA4 property, GSC site, and GBP location
 * Then triggers auto-scan to detect and complete relevant tasks
 *
 * Usage: POST /api/auth/google/select-properties
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runConnectionScan } from '@/lib/scanning/connection-scanner'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, selectedGA4, selectedGSC, selectedGBP } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update client with selected properties
    const updates: any = {}

    if (selectedGA4) {
      updates.selected_ga4_property_id = selectedGA4
    }

    if (selectedGSC) {
      updates.selected_gsc_site_url = selectedGSC
    }

    if (selectedGBP) {
      updates.selected_gbp_location_id = selectedGBP
    }

    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)

    if (error) {
      throw error
    }

    console.log('✅ Properties selected successfully!')
    console.log('GA4 Property:', selectedGA4 || '(none)')
    console.log('GSC Site:', selectedGSC || '(none)')
    console.log('GBP Location:', selectedGBP || '(none)')

    // Trigger auto-scan to detect and complete relevant tasks
    let scanResult = null
    try {
      console.log('🔍 Running connection scan to detect completed tasks...')
      scanResult = await runConnectionScan(clientId, 'all')
      console.log(`✅ Scan complete: ${scanResult.tasks_auto_completed} tasks auto-completed`)
    } catch (scanError) {
      console.error('Warning: Connection scan failed (non-critical):', scanError)
      // Don't fail the whole request if scan fails
    }

    return NextResponse.json({
      success: true,
      message: 'Properties selected successfully',
      scan_result: scanResult,
    })
  } catch (error: any) {
    console.error('Error saving property selection:', error)
    return NextResponse.json(
      { error: 'Failed to save selection', message: error.message },
      { status: 500 }
    )
  }
}
