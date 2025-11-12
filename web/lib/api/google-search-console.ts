/**
 * Google Search Console API Client
 *
 * Provides search performance data:
 * - Search queries
 * - Click-through rates
 * - Average positions
 * - Impressions & clicks
 * - Page performance
 */

import { google } from 'googleapis'

interface GSCQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCPage {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCMetrics {
  total_clicks: number
  total_impressions: number
  avg_ctr: number
  avg_position: number
}

interface GSCDevice {
  device: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export class GoogleSearchConsoleClient {
  private client: any = null

  private async getClient() {
    if (!this.client) {
      const credentialsPath = process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS || ''

      if (!credentialsPath) {
        throw new Error('Google Search Console credentials not configured')
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      })

      this.client = google.webmasters({ version: 'v3', auth })
    }
    return this.client
  }

  /**
   * Get overall metrics for date range
   */
  async getMetrics(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<GSCMetrics> {
    const client = await this.getClient()

    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
      },
    })

    const row = response.data.rows?.[0] || {}

    return {
      total_clicks: row.clicks || 0,
      total_impressions: row.impressions || 0,
      avg_ctr: row.ctr || 0,
      avg_position: row.position || 0,
    }
  }

  /**
   * Get top search queries
   */
  async getTopQueries(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<GSCQuery[]> {
    const client = await this.getClient()

    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: limit,
      },
    })

    return (response.data.rows || []).map((row: any) => ({
      query: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
  }

  /**
   * Get top performing pages
   */
  async getTopPages(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 50
  ): Promise<GSCPage[]> {
    const client = await this.getClient()

    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: limit,
      },
    })

    return (response.data.rows || []).map((row: any) => ({
      page: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
  }

  /**
   * Get queries for specific page
   */
  async getPageQueries(
    siteUrl: string,
    pageUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 50
  ): Promise<GSCQuery[]> {
    const client = await this.getClient()

    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                expression: pageUrl,
              },
            ],
          },
        ],
        rowLimit: limit,
      },
    })

    return (response.data.rows || []).map((row: any) => ({
      query: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
  }

  /**
   * Get performance by device
   */
  async getDeviceMetrics(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<GSCDevice[]> {
    const client = await this.getClient()

    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['device'],
      },
    })

    return (response.data.rows || []).map((row: any) => ({
      device: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
  }

  /**
   * Get daily performance for charting
   */
  async getDailyMetrics(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{
    date: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>> {
    const client = await this.getClient()

    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date'],
      },
    })

    return (response.data.rows || []).map((row: any) => ({
      date: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
  }

  /**
   * Get search appearance (rich results, AMP, etc.)
   */
  async getSearchAppearance(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{
    appearance: string
    clicks: number
    impressions: number
    ctr: number
  }>> {
    const client = await this.getClient()

    const response = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['searchAppearance'],
      },
    })

    return (response.data.rows || []).map((row: any) => ({
      appearance: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
    }))
  }

  /**
   * Get queries with highest CTR opportunity
   * (High impressions but low clicks)
   */
  async getCTROpportunities(
    siteUrl: string,
    startDate: string,
    endDate: string,
    minImpressions: number = 100,
    limit: number = 20
  ): Promise<GSCQuery[]> {
    const queries = await this.getTopQueries(siteUrl, startDate, endDate, 1000)

    return queries
      .filter(q => q.impressions >= minImpressions && q.ctr < 0.05)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, limit)
  }

  /**
   * Get queries with position improvement opportunity
   * (Ranking 11-20, could move to page 1)
   */
  async getPositionOpportunities(
    siteUrl: string,
    startDate: string,
    endDate: string,
    minImpressions: number = 50,
    limit: number = 20
  ): Promise<GSCQuery[]> {
    const queries = await this.getTopQueries(siteUrl, startDate, endDate, 1000)

    return queries
      .filter(q => q.position > 10 && q.position <= 20 && q.impressions >= minImpressions)
      .sort((a, b) => a.position - b.position)
      .slice(0, limit)
  }

  /**
   * Get daily keyword positions for charting
   * Returns position data over time for specific keywords
   */
  async getKeywordRankingTrends(
    siteUrl: string,
    keywords: string[],
    startDate: string,
    endDate: string
  ): Promise<Array<{
    date: string
    [keyword: string]: string | number
  }>> {
    const client = await this.getClient()

    // Get data for each keyword separately
    const keywordData = await Promise.all(
      keywords.map(async (keyword) => {
        const response = await client.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate,
            endDate,
            dimensions: ['date', 'query'],
            dimensionFilterGroups: [
              {
                filters: [
                  {
                    dimension: 'query',
                    expression: keyword,
                  },
                ],
              },
            ],
          },
        })

        return {
          keyword,
          data: (response.data.rows || []).map((row: any) => ({
            date: row.keys[0],
            position: Math.round(row.position || 0),
          })),
        }
      })
    )

    // Merge all keyword data by date
    const dateMap = new Map<string, any>()

    keywordData.forEach(({ keyword, data }) => {
      data.forEach(({ date, position }: any) => {
        if (!dateMap.has(date)) {
          dateMap.set(date, { date })
        }
        dateMap.get(date)[keyword] = position
      })
    })

    // Convert to array and sort by date
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Compare two date ranges
   */
  async comparePeriods(
    siteUrl: string,
    currentStart: string,
    currentEnd: string,
    previousStart: string,
    previousEnd: string
  ): Promise<{
    current: GSCMetrics
    previous: GSCMetrics
    change: {
      clicks: number
      impressions: number
      ctr: number
      position: number
    }
  }> {
    const [current, previous] = await Promise.all([
      this.getMetrics(siteUrl, currentStart, currentEnd),
      this.getMetrics(siteUrl, previousStart, previousEnd),
    ])

    return {
      current,
      previous,
      change: {
        clicks: current.total_clicks - previous.total_clicks,
        impressions: current.total_impressions - previous.total_impressions,
        ctr: current.avg_ctr - previous.avg_ctr,
        position: current.avg_position - previous.avg_position,
      },
    }
  }
}

// Export singleton instance
export const googleSearchConsole = new GoogleSearchConsoleClient()
