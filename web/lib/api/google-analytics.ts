/**
 * Google Analytics 4 API Client
 *
 * Provides traffic and engagement metrics:
 * - Sessions & users
 * - Bounce rate
 * - Page views
 * - Traffic sources
 * - Device breakdown
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data'

interface GA4Metrics {
  sessions: number
  users: number
  pageviews: number
  bounce_rate: number
  avg_session_duration: number
  new_users: number
}

interface GA4TrafficSource {
  source: string
  medium: string
  sessions: number
  users: number
}

interface GA4PageData {
  page_path: string
  page_title: string
  views: number
  users: number
  avg_time: number
}

export class GoogleAnalyticsClient {
  private client: BetaAnalyticsDataClient | null = null

  private async getClient(): Promise<BetaAnalyticsDataClient> {
    if (!this.client) {
      const credentialsPath = process.env.GOOGLE_ANALYTICS_CREDENTIALS || ''

      if (!credentialsPath) {
        throw new Error('Google Analytics credentials not configured')
      }

      this.client = new BetaAnalyticsDataClient({
        keyFilename: credentialsPath,
      })
    }
    return this.client
  }

  /**
   * Get overall metrics for date range
   */
  async getMetrics(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<GA4Metrics> {
    const client = await this.getClient()

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'newUsers' },
      ],
    })

    const row = response.rows?.[0]
    const values = row?.metricValues || []

    return {
      sessions: parseInt(values[0]?.value || '0'),
      users: parseInt(values[1]?.value || '0'),
      pageviews: parseInt(values[2]?.value || '0'),
      bounce_rate: parseFloat(values[3]?.value || '0'),
      avg_session_duration: parseFloat(values[4]?.value || '0'),
      new_users: parseInt(values[5]?.value || '0'),
    }
  }

  /**
   * Get traffic by source/medium
   */
  async getTrafficSources(
    propertyId: string,
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<GA4TrafficSource[]> {
    const client = await this.getClient()

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
      ],
      limit,
      orderBys: [
        {
          metric: {
            metricName: 'sessions',
          },
          desc: true,
        },
      ],
    })

    return (response.rows || []).map(row => {
      const dimensions = row.dimensionValues || []
      const metrics = row.metricValues || []

      return {
        source: dimensions[0]?.value || '(not set)',
        medium: dimensions[1]?.value || '(not set)',
        sessions: parseInt(metrics[0]?.value || '0'),
        users: parseInt(metrics[1]?.value || '0'),
      }
    })
  }

  /**
   * Get top pages by views
   */
  async getTopPages(
    propertyId: string,
    startDate: string,
    endDate: string,
    limit: number = 20
  ): Promise<GA4PageData[]> {
    const client = await this.getClient()

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'userEngagementDuration' },
      ],
      limit,
      orderBys: [
        {
          metric: {
            metricName: 'screenPageViews',
          },
          desc: true,
        },
      ],
    })

    return (response.rows || []).map(row => {
      const dimensions = row.dimensionValues || []
      const metrics = row.metricValues || []
      const views = parseInt(metrics[0]?.value || '0')
      const users = parseInt(metrics[1]?.value || '0')
      const duration = parseFloat(metrics[2]?.value || '0')

      return {
        page_path: dimensions[0]?.value || '',
        page_title: dimensions[1]?.value || '(not set)',
        views,
        users,
        avg_time: users > 0 ? duration / users : 0,
      }
    })
  }

  /**
   * Get metrics by device category
   */
  async getDeviceMetrics(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{
    device: string
    sessions: number
    users: number
    bounce_rate: number
  }>> {
    const client = await this.getClient()

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: 'deviceCategory' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'bounceRate' },
      ],
    })

    return (response.rows || []).map(row => {
      const dimensions = row.dimensionValues || []
      const metrics = row.metricValues || []

      return {
        device: dimensions[0]?.value || 'unknown',
        sessions: parseInt(metrics[0]?.value || '0'),
        users: parseInt(metrics[1]?.value || '0'),
        bounce_rate: parseFloat(metrics[2]?.value || '0'),
      }
    })
  }

  /**
   * Get daily metrics for charting
   */
  async getDailyMetrics(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{
    date: string
    sessions: number
    users: number
    pageviews: number
  }>> {
    const client = await this.getClient()

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: 'date' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
      orderBys: [
        {
          dimension: {
            dimensionName: 'date',
          },
          desc: false,
        },
      ],
    })

    return (response.rows || []).map(row => {
      const dimensions = row.dimensionValues || []
      const metrics = row.metricValues || []
      const dateStr = dimensions[0]?.value || ''

      // Convert YYYYMMDD to YYYY-MM-DD
      const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`

      return {
        date,
        sessions: parseInt(metrics[0]?.value || '0'),
        users: parseInt(metrics[1]?.value || '0'),
        pageviews: parseInt(metrics[2]?.value || '0'),
      }
    })
  }

  /**
   * Get conversion data (if goals are set up)
   */
  async getConversions(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{
    event_name: string
    event_count: number
    total_users: number
  }>> {
    const client = await this.getClient()

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: 'eventName' },
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'totalUsers' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'CONTAINS' as any,
            value: 'conversion',
            caseSensitive: false,
          },
        },
      },
      limit: 10,
      orderBys: [
        {
          metric: {
            metricName: 'eventCount',
          },
          desc: true,
        },
      ],
    })

    return (response.rows || []).map(row => {
      const dimensions = row.dimensionValues || []
      const metrics = row.metricValues || []

      return {
        event_name: dimensions[0]?.value || '',
        event_count: parseInt(metrics[0]?.value || '0'),
        total_users: parseInt(metrics[1]?.value || '0'),
      }
    })
  }

  /**
   * Get landing pages
   */
  async getLandingPages(
    propertyId: string,
    startDate: string,
    endDate: string,
    limit: number = 20
  ): Promise<Array<{
    page: string
    sessions: number
    bounce_rate: number
    avg_duration: number
  }>> {
    const client = await this.getClient()

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        { name: 'landingPage' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
      limit,
      orderBys: [
        {
          metric: {
            metricName: 'sessions',
          },
          desc: true,
        },
      ],
    })

    return (response.rows || []).map(row => {
      const dimensions = row.dimensionValues || []
      const metrics = row.metricValues || []

      return {
        page: dimensions[0]?.value || '',
        sessions: parseInt(metrics[0]?.value || '0'),
        bounce_rate: parseFloat(metrics[1]?.value || '0'),
        avg_duration: parseFloat(metrics[2]?.value || '0'),
      }
    })
  }
}

// Export singleton instance
export const googleAnalytics = new GoogleAnalyticsClient()
