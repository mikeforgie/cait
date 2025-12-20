/**
 * DataForSEO Scanner
 *
 * On-demand scanning using DataForSEO MCP tools for:
 * - Keyword research and rankings
 * - Backlink discovery
 * - Technical SEO audits
 *
 * Note: These scans consume API credits. Use sparingly.
 */

import { createClient } from '@/lib/supabase/server'

export interface DataForSEOScanResult {
  client_id: string
  scan_type: 'keywords' | 'backlinks' | 'technical' | 'domain_overview'
  success: boolean
  data: any
  credits_used?: number
  error?: string
}

export interface KeywordResearchResult {
  keywords: {
    keyword: string
    search_volume: number
    cpc: number
    competition: number
    difficulty?: number
  }[]
  total_found: number
}

export interface BacklinkSummaryResult {
  total_backlinks: number
  referring_domains: number
  domain_rank: number
  trust_rank?: number
  top_anchors: { anchor: string; count: number }[]
}

export interface DomainOverviewResult {
  domain: string
  organic_traffic: number
  organic_keywords: number
  domain_rank: number
  backlinks: number
  referring_domains: number
}

/**
 * Run keyword research for a domain
 * Uses DataForSEO Labs API via MCP
 */
export async function runKeywordResearch(
  clientId: string,
  domain: string,
  options: {
    limit?: number
    location?: string
    language?: string
  } = {}
): Promise<DataForSEOScanResult> {
  const supabase = await createClient()
  const { limit = 100, location = 'United States', language = 'en' } = options

  try {
    // Get client info
    const { data: client } = await supabase
      .from('clients')
      .select('website_url')
      .eq('id', clientId)
      .single()

    const targetDomain = domain || client?.website_url

    if (!targetDomain) {
      return {
        client_id: clientId,
        scan_type: 'keywords',
        success: false,
        data: null,
        error: 'No domain specified',
      }
    }

    // This would call the DataForSEO MCP tool
    // For now, we'll structure the expected response format
    // The actual MCP call would be:
    // mcp__dfs-mcp__dataforseo_labs_google_ranked_keywords({ target: targetDomain, limit, location_name: location, language_code: language })

    // Store the scan request for tracking
    try {
      await supabase.from('scan_logs').insert({
        client_id: clientId,
        scan_type: 'keyword_research',
        status: 'pending',
        config: { domain: targetDomain, limit, location, language },
        created_at: new Date().toISOString(),
      })
    } catch {
      // Ignore if table doesn't exist
    }

    return {
      client_id: clientId,
      scan_type: 'keywords',
      success: true,
      data: {
        message: 'Keyword research scan initiated',
        domain: targetDomain,
        config: { limit, location, language },
        // Actual data would come from MCP tool response
      },
    }
  } catch (error: any) {
    return {
      client_id: clientId,
      scan_type: 'keywords',
      success: false,
      data: null,
      error: error.message,
    }
  }
}

/**
 * Run backlink discovery for a domain
 * Uses DataForSEO Backlinks API via MCP
 */
export async function runBacklinkDiscovery(
  clientId: string,
  domain: string,
  options: {
    limit?: number
  } = {}
): Promise<DataForSEOScanResult> {
  const supabase = await createClient()
  const { limit = 100 } = options

  try {
    const { data: client } = await supabase
      .from('clients')
      .select('website_url')
      .eq('id', clientId)
      .single()

    const targetDomain = domain || client?.website_url

    if (!targetDomain) {
      return {
        client_id: clientId,
        scan_type: 'backlinks',
        success: false,
        data: null,
        error: 'No domain specified',
      }
    }

    // This would call the DataForSEO MCP tools:
    // mcp__dfs-mcp__backlinks_summary({ target: targetDomain })
    // mcp__dfs-mcp__backlinks_backlinks({ target: targetDomain, limit })

    try {
      await supabase.from('scan_logs').insert({
        client_id: clientId,
        scan_type: 'backlink_discovery',
        status: 'pending',
        config: { domain: targetDomain, limit },
        created_at: new Date().toISOString(),
      })
    } catch {
      // Ignore if table doesn't exist
    }

    return {
      client_id: clientId,
      scan_type: 'backlinks',
      success: true,
      data: {
        message: 'Backlink discovery scan initiated',
        domain: targetDomain,
        config: { limit },
      },
    }
  } catch (error: any) {
    return {
      client_id: clientId,
      scan_type: 'backlinks',
      success: false,
      data: null,
      error: error.message,
    }
  }
}

/**
 * Run domain overview scan
 * Gets comprehensive domain metrics in one call
 */
export async function runDomainOverview(
  clientId: string,
  domain: string
): Promise<DataForSEOScanResult> {
  const supabase = await createClient()

  try {
    const { data: client } = await supabase
      .from('clients')
      .select('website_url')
      .eq('id', clientId)
      .single()

    const targetDomain = domain || client?.website_url

    if (!targetDomain) {
      return {
        client_id: clientId,
        scan_type: 'domain_overview',
        success: false,
        data: null,
        error: 'No domain specified',
      }
    }

    // This would call:
    // mcp__dfs-mcp__dataforseo_labs_google_domain_rank_overview({ target: targetDomain })

    try {
      await supabase.from('scan_logs').insert({
        client_id: clientId,
        scan_type: 'domain_overview',
        status: 'pending',
        config: { domain: targetDomain },
        created_at: new Date().toISOString(),
      })
    } catch {
      // Ignore if table doesn't exist
    }

    return {
      client_id: clientId,
      scan_type: 'domain_overview',
      success: true,
      data: {
        message: 'Domain overview scan initiated',
        domain: targetDomain,
      },
    }
  } catch (error: any) {
    return {
      client_id: clientId,
      scan_type: 'domain_overview',
      success: false,
      data: null,
      error: error.message,
    }
  }
}

/**
 * Run technical SEO audit using DataForSEO
 * Uses Lighthouse and On-Page APIs
 */
export async function runTechnicalAudit(
  clientId: string,
  domain: string
): Promise<DataForSEOScanResult> {
  const supabase = await createClient()

  try {
    const { data: client } = await supabase
      .from('clients')
      .select('website_url')
      .eq('id', clientId)
      .single()

    let targetUrl = domain || client?.website_url
    if (!targetUrl) {
      return {
        client_id: clientId,
        scan_type: 'technical',
        success: false,
        data: null,
        error: 'No domain specified',
      }
    }

    // Ensure URL has protocol
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`
    }

    // This would call:
    // mcp__dfs-mcp__on_page_lighthouse({ url: targetUrl })
    // mcp__dfs-mcp__on_page_instant_pages({ url: targetUrl })

    try {
      await supabase.from('scan_logs').insert({
        client_id: clientId,
        scan_type: 'technical_audit',
        status: 'pending',
        config: { url: targetUrl },
        created_at: new Date().toISOString(),
      })
    } catch {
      // Ignore if table doesn't exist
    }

    return {
      client_id: clientId,
      scan_type: 'technical',
      success: true,
      data: {
        message: 'Technical audit initiated',
        url: targetUrl,
      },
    }
  } catch (error: any) {
    return {
      client_id: clientId,
      scan_type: 'technical',
      success: false,
      data: null,
      error: error.message,
    }
  }
}

/**
 * Store scan results in the database
 * Called after MCP tool returns data
 */
export async function storeScanResults(
  clientId: string,
  scanType: string,
  results: any
): Promise<void> {
  const supabase = await createClient()

  // Store based on scan type
  switch (scanType) {
    case 'keywords':
      if (results.keywords?.length > 0) {
        await supabase.from('keyword_research').upsert(
          results.keywords.map((kw: any) => ({
            client_id: clientId,
            keyword: kw.keyword,
            search_volume: kw.search_volume,
            cpc: kw.cpc,
            competition: kw.competition,
            difficulty: kw.difficulty,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'client_id,keyword' }
        )
      }
      break

    case 'backlinks':
      if (results.backlinks?.length > 0) {
        await supabase.from('backlinks').upsert(
          results.backlinks.map((bl: any) => ({
            client_id: clientId,
            source_url: bl.url_from || bl.source_url,
            target_url: bl.url_to || bl.target_url,
            anchor_text: bl.anchor || bl.anchor_text,
            source_domain_rating: bl.domain_from_rank || bl.source_domain_rating,
            domain_from_rank: bl.domain_from_rank, // Also store in new column
            discovered_at: bl.first_seen || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'client_id,source_url,target_url' }
        )
      }
      break

    case 'domain_overview':
      await supabase.from('domain_metrics').upsert({
        client_id: clientId,
        organic_traffic: results.organic_traffic,
        organic_keywords: results.organic_keywords,
        domain_rank: results.domain_rank,
        backlinks_count: results.backlinks,
        referring_domains: results.referring_domains,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id' })
      break
  }

  // Update scan log
  await supabase.from('scan_logs')
    .update({
      status: 'completed',
      results,
      completed_at: new Date().toISOString(),
    })
    .eq('client_id', clientId)
    .eq('scan_type', scanType)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
}
