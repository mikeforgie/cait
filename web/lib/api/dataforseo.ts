/**
 * DataForSEO API Client
 *
 * Provides SEO data for:
 * - Keyword research
 * - Technical audits
 * - Backlink analysis
 * - SERP data
 * - Domain metrics
 */

interface DataForSEOCredentials {
  login: string
  password: string
}

interface KeywordData {
  keyword: string
  search_volume: number
  difficulty: number
  cpc: number
  competition: number
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational'
}

interface TechnicalAuditResult {
  url: string
  pages_crawled: number
  errors: {
    broken_links: number
    missing_titles: number
    missing_descriptions: number
    duplicate_titles: number
    duplicate_descriptions: number
  }
  performance: {
    avg_response_time: number
    slow_pages: number
  }
  seo_score: number
}

interface BacklinkData {
  target: string
  backlinks: number
  referring_domains: number
  domain_rank: number
  organic_keywords: number
  organic_traffic: number
}

export class DataForSEOClient {
  private baseUrl = 'https://api.dataforseo.com/v3'
  private credentials: DataForSEOCredentials | null = null

  private getCredentials(): DataForSEOCredentials {
    if (this.credentials) {
      return this.credentials
    }

    const login = process.env.DATAFORSEO_LOGIN
    const password = process.env.DATAFORSEO_PASSWORD

    if (!login || !password) {
      throw new Error('DataForSEO credentials not configured')
    }

    this.credentials = { login, password }
    return this.credentials
  }

  private async request<T>(
    endpoint: string,
    data?: any[]
  ): Promise<T> {
    const credentials = this.getCredentials()
    const auth = Buffer.from(
      `${credentials.login}:${credentials.password}`
    ).toString('base64')

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    const result = await response.json()

    // Check for payment required error (no credits)
    if (result.tasks?.[0]?.status_code === 40200) {
      throw new Error('PAYMENT_REQUIRED: DataForSEO account has no credits')
    }

    // Check for internal errors
    if (result.tasks?.[0]?.status_code === 50000) {
      throw new Error('INTERNAL_ERROR: DataForSEO internal error')
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`DataForSEO API error: ${response.status} ${error}`)
    }

    if (result.status_code !== 20000) {
      throw new Error(`DataForSEO error: ${result.status_message}`)
    }

    return result
  }

  /**
   * Get keyword research data
   * Returns search volume, difficulty, CPC, and more for keywords
   */
  async getKeywordData(
    keywords: string[],
    location: string = 'United States',
    language: string = 'en'
  ): Promise<KeywordData[]> {
    console.log('DataForSEO API: Getting keyword data for', keywords.length, 'keywords in', location)

    const response = await this.request<any>(
      '/dataforseo_labs/google/keyword_ideas/live',
      [{
        keywords,
        location_name: location,
        language_code: language,
        include_clickstream_data: true,
        limit: 100,
      }]
    )

    console.log('DataForSEO API response status:', response.status_code, response.status_message)
    console.log('Tasks in response:', response.tasks?.length)

    const items = response.tasks?.[0]?.result?.[0]?.items || []
    console.log('Items found:', items.length)

    return items.map((item: any) => ({
      keyword: item.keyword,
      search_volume: item.keyword_info?.search_volume || 0,
      difficulty: item.keyword_properties?.keyword_difficulty || 0,
      cpc: item.keyword_info?.cpc || 0,
      competition: item.keyword_info?.competition || 0,
      intent: this.determineIntent(item),
    }))
  }

  /**
   * Perform quick technical SEO audit (single page)
   * For full site audits, use runFullSiteAudit instead
   */
  async runTechnicalAudit(domain: string): Promise<TechnicalAuditResult> {
    // Use OnPage API - Instant Pages endpoint for quick audit
    const response = await this.request<any>(
      '/on_page/instant_pages',
      [{
        url: `https://${domain}`,
        enable_javascript: true,
        custom_js: '',
      }]
    )

    const result = response.tasks?.[0]?.result?.[0] || {}
    const meta = result.meta || {}
    const onpage = result.onpage_score || 0

    // Calculate issues from the response
    const items = result.items || []
    const errors = {
      broken_links: items.filter((i: any) => i.status_code >= 400).length,
      missing_titles: items.filter((i: any) => !i.meta?.title).length,
      missing_descriptions: items.filter((i: any) => !i.meta?.description).length,
      duplicate_titles: 0, // Would need crawl for this
      duplicate_descriptions: 0, // Would need crawl for this
    }

    return {
      url: domain,
      pages_crawled: items.length,
      errors,
      performance: {
        avg_response_time: meta.response_time || 0,
        slow_pages: items.filter((i: any) => i.meta?.response_time > 2000).length,
      },
      seo_score: Math.round(onpage * 100),
    }
  }

  /**
   * Run full site technical audit
   * Crawls entire site (up to maxPages) and provides comprehensive analysis
   * Cost: ~$0.00125 per page with JavaScript enabled
   */
  async runFullSiteAudit(
    domain: string,
    maxPages: number = 500
  ): Promise<{
    task_id: string
    pages_crawled: number
    errors: {
      broken_links: number
      broken_resources: number
      missing_titles: number
      missing_descriptions: number
      missing_h1: number
      duplicate_titles: number
      duplicate_descriptions: number
      duplicate_content: number
      slow_pages: number
      mobile_issues: number
      canonical_issues: number
      redirect_chains: number
      pages_with_errors: number
    }
    performance: {
      avg_response_time: number
      slow_pages: number
      avg_page_size: number
      large_pages: number
    }
    mobile: {
      mobile_friendly_pages: number
      non_mobile_friendly: number
      viewport_issues: number
    }
    technical: {
      pages_with_https: number
      pages_with_http: number
      canonical_issues: number
      redirect_chains: number
      pages_with_errors: number
    }
    seo_score: number
    top_issues: Array<{
      type: string
      severity: 'critical' | 'warning' | 'notice'
      count: number
      description: string
    }>
  }> {
    console.log('DataForSEO: Starting full site audit for', domain, 'with max', maxPages, 'pages')

    // Step 1: Create crawl task
    const taskResponse = await this.request<any>(
      '/on_page/task_post',
      [{
        target: `https://${domain}`,
        max_crawl_pages: maxPages,
        enable_javascript: true,
        load_resources: true,
        enable_browser_rendering: false, // Keep costs down
        store_raw_html: false,
        custom_js: '',
        calculate_keyword_density: true,
        check_spell: false,
        checks_threshold: {
          broken_links: 1,
          duplicate_title: 1,
          duplicate_description: 1,
          duplicate_content: 1,
          no_description: 1,
          no_title: 1,
          no_h1: 1,
          canonical: 1,
          low_content_rate: 1,
          high_waiting_time: 3000,
          large_page_size: 1024,
        },
      }]
    )

    const taskId = taskResponse.tasks?.[0]?.id

    if (!taskId) {
      throw new Error('Failed to create crawl task')
    }

    console.log('DataForSEO: Created task', taskId, '- waiting for completion...')

    // Step 2: Wait for task completion (poll every 5 seconds)
    let isReady = false
    let attempts = 0
    const maxAttempts = 120 // 10 minutes max wait

    while (!isReady && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
      attempts++

      const readyResponse = await this.request<any>(
        '/on_page/tasks_ready',
        []
      )

      const readyTasks = readyResponse.tasks?.[0]?.result || []
      isReady = readyTasks.some((t: any) => t.id === taskId)

      if (attempts % 6 === 0) { // Log every 30 seconds
        console.log(`DataForSEO: Still waiting... (${attempts * 5}s elapsed)`)
      }
    }

    if (!isReady) {
      throw new Error('Crawl task timeout - site may be too large or slow')
    }

    console.log('DataForSEO: Task complete! Fetching results...')

    // Step 3: Get summary data
    const summaryResponse = await this.request<any>(
      '/on_page/summary',
      [{
        id: taskId,
      }]
    )

    const summary = summaryResponse.tasks?.[0]?.result?.[0] || {}

    // Step 4: Get pages data for detailed analysis
    const pagesResponse = await this.request<any>(
      '/on_page/pages',
      [{
        id: taskId,
        limit: maxPages,
        filters: [
          ['internal_links_count', '>', 0] // Only pages with internal links
        ],
      }]
    )

    const pages = pagesResponse.tasks?.[0]?.result?.[0]?.items || []

    console.log('DataForSEO: Analyzed', pages.length, 'pages')

    // Process results
    const responseTimes = pages
      .map((p: any) => p.meta?.response_time || 0)
      .filter((t: number) => t > 0)

    const pageSizes = pages
      .map((p: any) => p.meta?.content?.size || 0)
      .filter((s: number) => s > 0)

    const slowPages = pages.filter((p: any) => (p.meta?.response_time || 0) > 3000).length
    const nonMobileFriendly = pages.filter((p: any) => !p.meta?.viewport).length
    const canonicalIssues = pages.filter((p: any) => p.checks?.canonical).length
    const redirectChains = pages.filter((p: any) => p.checks?.redirect_chain).length
    const pagesWithErrors = pages.filter((p: any) => (p.status_code || 200) >= 400).length

    const errors = {
      broken_links: pages.filter((p: any) => p.broken_links).length,
      broken_resources: pages.filter((p: any) => p.broken_resources).length,
      missing_titles: pages.filter((p: any) => p.checks?.no_title).length,
      missing_descriptions: pages.filter((p: any) => p.checks?.no_description).length,
      missing_h1: pages.filter((p: any) => p.checks?.no_h1).length,
      duplicate_titles: pages.filter((p: any) => p.checks?.duplicate_title).length,
      duplicate_descriptions: pages.filter((p: any) => p.checks?.duplicate_description).length,
      duplicate_content: pages.filter((p: any) => p.checks?.duplicate_content).length,
      slow_pages: slowPages,
      mobile_issues: nonMobileFriendly,
      canonical_issues: canonicalIssues,
      redirect_chains: redirectChains,
      pages_with_errors: pagesWithErrors,
    }

    const performance = {
      avg_response_time: responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length)
        : 0,
      slow_pages: slowPages,
      avg_page_size: pageSizes.length > 0
        ? Math.round(pageSizes.reduce((a: number, b: number) => a + b, 0) / pageSizes.length)
        : 0,
      large_pages: pages.filter((p: any) => (p.meta?.content?.size || 0) > 1024 * 1024).length, // > 1MB
    }

    const mobile = {
      mobile_friendly_pages: pages.filter((p: any) => p.meta?.viewport).length,
      non_mobile_friendly: nonMobileFriendly,
      viewport_issues: pages.filter((p: any) => p.checks?.no_viewport).length,
    }

    const technical = {
      pages_with_https: pages.filter((p: any) => p.url?.startsWith('https://')).length,
      pages_with_http: pages.filter((p: any) => p.url?.startsWith('http://')).length,
      canonical_issues: canonicalIssues,
      redirect_chains: redirectChains,
      pages_with_errors: pagesWithErrors,
    }

    // Generate top issues list
    const topIssues = []

    if (errors.broken_links > 0) {
      topIssues.push({
        type: 'broken_links',
        severity: 'critical' as const,
        count: errors.broken_links,
        description: 'Pages with broken internal or external links',
      })
    }

    if (errors.missing_titles > 0) {
      topIssues.push({
        type: 'missing_titles',
        severity: 'critical' as const,
        count: errors.missing_titles,
        description: 'Pages missing title tags',
      })
    }

    if (errors.duplicate_titles > 0) {
      topIssues.push({
        type: 'duplicate_titles',
        severity: 'warning' as const,
        count: errors.duplicate_titles,
        description: 'Pages with duplicate title tags',
      })
    }

    if (performance.slow_pages > 0) {
      topIssues.push({
        type: 'slow_pages',
        severity: 'warning' as const,
        count: performance.slow_pages,
        description: 'Pages with slow response times (>3s)',
      })
    }

    if (mobile.non_mobile_friendly > 0) {
      topIssues.push({
        type: 'mobile_issues',
        severity: 'warning' as const,
        count: mobile.non_mobile_friendly,
        description: 'Pages not mobile-friendly',
      })
    }

    // Calculate overall SEO score (0-100)
    let score = 100
    score -= Math.min(errors.broken_links * 2, 30)
    score -= Math.min(errors.missing_titles * 3, 30)
    score -= Math.min(errors.duplicate_titles * 1, 15)
    score -= Math.min(performance.slow_pages * 1, 10)
    score -= Math.min(mobile.non_mobile_friendly * 1, 15)

    return {
      task_id: taskId,
      pages_crawled: pages.length,
      errors,
      performance,
      mobile,
      technical,
      seo_score: Math.max(0, Math.round(score)),
      top_issues: topIssues.sort((a, b) => {
        // Sort by severity then count
        const severityOrder = { critical: 0, warning: 1, notice: 2 }
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity]
        }
        return b.count - a.count
      }).slice(0, 10), // Top 10 issues
    }
  }

  /**
   * Get backlink summary for domain
   * Returns total backlinks, referring domains, and domain rank
   */
  async getBacklinkSummary(domain: string): Promise<BacklinkData> {
    const response = await this.request<any>(
      '/backlinks/summary/live',
      [{
        target: domain,
        include_subdomains: true,
      }]
    )

    const result = response.tasks?.[0]?.result?.[0] || {}

    return {
      target: domain,
      backlinks: result.backlinks || 0,
      referring_domains: result.referring_domains || 0,
      domain_rank: result.rank || 0,
      organic_keywords: result.organic?.count || 0,
      organic_traffic: result.organic?.etv || 0,
    }
  }

  /**
   * Get backlink growth trends over time
   * Returns daily backlink metrics for charting
   */
  async getBacklinkGrowthTrends(
    domain: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{
    date: string
    new: number
    lost: number
    existing: number
    total: number
    domainAuthority: number
  }>> {
    const response = await this.request<any>(
      '/backlinks/timeseries_summary/live',
      [{
        target: domain,
        date_from: startDate,
        date_to: endDate,
      }]
    )

    const items = response.tasks?.[0]?.result?.[0]?.items || []

    // Calculate cumulative totals and daily changes
    let cumulativeTotal = 0

    return items.map((item: any, index: number) => {
      const newBacklinks = item.new_backlinks || 0
      const lostBacklinks = item.lost_backlinks || 0

      cumulativeTotal += (newBacklinks - lostBacklinks)
      const existingBacklinks = cumulativeTotal - newBacklinks

      return {
        date: item.date,
        new: newBacklinks,
        lost: lostBacklinks,
        existing: Math.max(0, existingBacklinks),
        total: Math.max(0, cumulativeTotal),
        domainAuthority: Math.round(item.rank || 0), // Domain rank as proxy for DA
      }
    })
  }

  /**
   * Get new and lost backlinks summary
   * Returns summary of backlink changes for a date range
   */
  async getBacklinkChanges(
    domain: string,
    dateFrom: string
  ): Promise<{
    new_backlinks: number
    lost_backlinks: number
    new_referring_domains: number
    lost_referring_domains: number
  }> {
    const response = await this.request<any>(
      '/backlinks/bulk_new_lost_backlinks/live',
      [{
        targets: [domain],
        date_from: dateFrom,
      }]
    )

    const result = response.tasks?.[0]?.result?.[0]?.items?.[0] || {}

    return {
      new_backlinks: result.new_backlinks || 0,
      lost_backlinks: result.lost_backlinks || 0,
      new_referring_domains: result.new_referring_domains || 0,
      lost_referring_domains: result.lost_referring_domains || 0,
    }
  }

  /**
   * Get detailed backlinks for domain
   * Returns individual backlink data
   */
  async getBacklinks(
    domain: string,
    limit: number = 100
  ): Promise<Array<{
    source_url: string
    target_url: string
    anchor: string
    rank: number
    dofollow: boolean
  }>> {
    const response = await this.request<any>(
      '/backlinks/backlinks/live',
      [{
        target: domain,
        mode: 'as_is',
        limit,
        order_by: ['rank,desc'],
      }]
    )

    const items = response.tasks?.[0]?.result?.[0]?.items || []

    return items.map((item: any) => ({
      source_url: item.url_from,
      target_url: item.url_to,
      anchor: item.anchor || '',
      rank: item.rank || 0,
      dofollow: item.dofollow === true,
    }))
  }

  /**
   * Get ranked keywords for domain
   * Returns keywords domain is ranking for with positions
   */
  async getRankedKeywords(
    domain: string,
    location: string = 'United States',
    language: string = 'en',
    limit: number = 100
  ): Promise<Array<{
    keyword: string
    position: number
    search_volume: number
    url: string
  }>> {
    const response = await this.request<any>(
      '/dataforseo_labs/google/ranked_keywords/live',
      [{
        target: domain,
        location_name: location,
        language_code: language,
        limit,
        order_by: ['ranked_serp_element.serp_item.rank_group,asc'],
      }]
    )

    const items = response.tasks?.[0]?.result?.[0]?.items || []

    return items.map((item: any) => ({
      keyword: item.keyword_data?.keyword || '',
      position: item.ranked_serp_element?.serp_item?.rank_absolute || 0,
      search_volume: item.keyword_data?.keyword_info?.search_volume || 0,
      url: item.ranked_serp_element?.serp_item?.url || '',
    }))
  }

  /**
   * Get competitor domains
   * Returns domains competing for same keywords
   */
  async getCompetitors(
    domain: string,
    location: string = 'United States',
    language: string = 'en',
    limit: number = 10
  ): Promise<Array<{
    domain: string
    rank: number
    intersections: number
    organic_keywords: number
    organic_traffic: number
  }>> {
    const response = await this.request<any>(
      '/dataforseo_labs/google/competitors_domain/live',
      [{
        target: domain,
        location_name: location,
        language_code: language,
        limit,
        exclude_top_domains: true,
      }]
    )

    const items = response.tasks?.[0]?.result?.[0]?.items || []

    return items.map((item: any) => ({
      domain: item.domain,
      rank: item.avg_position || 0,
      intersections: item.intersections || 0,
      organic_keywords: item.metrics?.organic?.count || 0,
      organic_traffic: item.metrics?.organic?.etv || 0,
    }))
  }

  /**
   * Get SERP results for keyword
   * Returns top 10 organic results
   */
  async getSERPResults(
    keyword: string,
    location: string = 'United States',
    language: string = 'en'
  ): Promise<Array<{
    position: number
    url: string
    title: string
    description: string
    domain: string
  }>> {
    const response = await this.request<any>(
      '/serp/google/organic/live/advanced',
      [{
        keyword,
        location_name: location,
        language_code: language,
        depth: 10,
      }]
    )

    const items = response.tasks?.[0]?.result?.[0]?.items || []

    return items
      .filter((item: any) => item.type === 'organic')
      .map((item: any) => ({
        position: item.rank_absolute || 0,
        url: item.url || '',
        title: item.title || '',
        description: item.description || '',
        domain: item.domain || '',
      }))
  }

  /**
   * Determine keyword intent from API data
   */
  private determineIntent(item: any): 'informational' | 'commercial' | 'transactional' | 'navigational' {
    const keyword = item.keyword?.toLowerCase() || ''

    // Transactional signals
    if (
      keyword.includes('buy') ||
      keyword.includes('price') ||
      keyword.includes('cost') ||
      keyword.includes('purchase') ||
      keyword.includes('order')
    ) {
      return 'transactional'
    }

    // Commercial signals
    if (
      keyword.includes('best') ||
      keyword.includes('top') ||
      keyword.includes('review') ||
      keyword.includes('compare') ||
      keyword.includes('vs')
    ) {
      return 'commercial'
    }

    // Navigational signals
    if (
      keyword.includes('login') ||
      keyword.includes('sign in') ||
      keyword.includes('website') ||
      keyword.includes('official')
    ) {
      return 'navigational'
    }

    // Default to informational
    return 'informational'
  }

  /**
   * Get keyword difficulty
   * Returns 0-100 score of ranking difficulty
   */
  async getKeywordDifficulty(
    keywords: string[],
    location: string = 'United States',
    language: string = 'en'
  ): Promise<Array<{ keyword: string; difficulty: number }>> {
    const response = await this.request<any>(
      '/dataforseo_labs/bulk_keyword_difficulty/live',
      [{
        keywords,
        location_name: location,
        language_code: language,
      }]
    )

    const items = response.tasks?.[0]?.result?.[0]?.items || []

    return items.map((item: any) => ({
      keyword: item.keyword,
      difficulty: item.keyword_difficulty || 0,
    }))
  }
}

// Export singleton instance
export const dataForSEO = new DataForSEOClient()
