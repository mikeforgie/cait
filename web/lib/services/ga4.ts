/**
 * Google Analytics 4 Data Service
 *
 * Fetches analytics data from GA4 using OAuth tokens
 */

import { google } from 'googleapis'
import type { analyticsdata_v1beta } from 'googleapis'
import { getAuthenticatedClient, refreshAccessToken } from '@/lib/auth/google-oauth'

type RunReportResponse = analyticsdata_v1beta.Schema$RunReportResponse

export interface GA4Metrics {
  totalUsers: number
  newUsers: number
  sessions: number
  bounceRate: number
  avgSessionDuration: number
  pageviews: number
  screenPageViews: number
  eventsCount: number
}

export interface GA4PageData {
  pagePath: string
  pageTitle: string
  screenPageViews: number
  uniquePageViews: number
  avgTimeOnPage: number
  bounceRate: number
}

export interface GA4SourceData {
  source: string
  medium: string
  users: number
  sessions: number
  bounceRate: number
}

export interface GA4Response {
  dateRange: {
    startDate: string
    endDate: string
  }
  metrics: GA4Metrics
  topPages: GA4PageData[]
  topSources: GA4SourceData[]
  dailyMetrics: Array<{
    date: string
    users: number
    sessions: number
    pageviews: number
  }>
}

/**
 * Fetch GA4 data for a property
 */
export async function fetchGA4Data(
  propertyId: string,
  tokens: any,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<GA4Response> {
  try {
    const oauth2Client = getAuthenticatedClient(tokens)
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client })

    // Fetch main metrics
    const propId: string = String(propertyId).startsWith('properties/') ? String(propertyId) : `properties/${String(propertyId)}`

    // @ts-ignore - googleapis type definitions are incorrect for v1beta
    const metricsResponse: { data: RunReportResponse } = await analyticsData.properties.runReport({
      property: propId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'screenPageViews' },
          { name: 'eventCount' },
        ],
      },
    })

    // Fetch top pages
    // @ts-ignore - googleapis type definitions are incorrect for v1beta
    const pagesResponse: { data: RunReportResponse } = await analyticsData.properties.runReport({
      property: propId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        limit: 10,
        orderBys: [
          {
            metric: { metricName: 'screenPageViews' },
            desc: true,
          },
        ],
      },
    })

    // Fetch traffic sources
    // @ts-ignore - googleapis type definitions are incorrect for v1beta
    const sourcesResponse: { data: RunReportResponse } = await analyticsData.properties.runReport({
      property: propId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'bounceRate' },
        ],
        limit: 10,
        orderBys: [
          {
            metric: { metricName: 'totalUsers' },
            desc: true,
          },
        ],
      },
    })

    // Fetch daily metrics for trend chart
    // @ts-ignore - googleapis type definitions are incorrect for v1beta
    const dailyResponse: { data: RunReportResponse } = await analyticsData.properties.runReport({
      property: propId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
        orderBys: [
          {
            dimension: { dimensionName: 'date' },
            desc: false,
          },
        ],
      },
    })

    // Parse main metrics
    const metricsRow = metricsResponse.data.rows?.[0]?.metricValues || []
    const metrics: GA4Metrics = {
      totalUsers: parseInt(metricsRow[0]?.value || '0'),
      newUsers: parseInt(metricsRow[1]?.value || '0'),
      sessions: parseInt(metricsRow[2]?.value || '0'),
      bounceRate: parseFloat(metricsRow[3]?.value || '0'),
      avgSessionDuration: parseFloat(metricsRow[4]?.value || '0'),
      pageviews: parseInt(metricsRow[5]?.value || '0'),
      screenPageViews: parseInt(metricsRow[5]?.value || '0'),
      eventsCount: parseInt(metricsRow[6]?.value || '0'),
    }

    // Parse top pages
    const topPages: GA4PageData[] = (pagesResponse.data.rows || []).map((row) => ({
      pagePath: row.dimensionValues?.[0]?.value || '',
      pageTitle: row.dimensionValues?.[1]?.value || '',
      screenPageViews: parseInt(row.metricValues?.[0]?.value || '0'),
      uniquePageViews: parseInt(row.metricValues?.[0]?.value || '0'),
      avgTimeOnPage: parseFloat(row.metricValues?.[1]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[2]?.value || '0'),
    }))

    // Parse traffic sources
    const topSources: GA4SourceData[] = (sourcesResponse.data.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || 'direct',
      medium: row.dimensionValues?.[1]?.value || 'none',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[2]?.value || '0'),
    }))

    // Parse daily metrics
    const dailyMetrics = (dailyResponse.data.rows || []).map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      pageviews: parseInt(row.metricValues?.[2]?.value || '0'),
    }))

    // Debug logging
    console.log(`GA4 API Request: ${startDate} to ${endDate}`)
    console.log(`GA4 API Response: ${dailyMetrics.length} days of data`)
    if (dailyMetrics.length > 0) {
      console.log(`First day: ${dailyMetrics[0].date}, Last day: ${dailyMetrics[dailyMetrics.length - 1].date}`)
    }
    console.log(`Daily response row count: ${dailyResponse.data.rows?.length || 0}`)

    // Get actual date range from the data (GA4 may not have complete data for recent days)
    const actualStartDate = dailyMetrics.length > 0 ? dailyMetrics[0].date : startDate
    const actualEndDate = dailyMetrics.length > 0 ? dailyMetrics[dailyMetrics.length - 1].date : endDate

    return {
      dateRange: {
        startDate: actualStartDate,
        endDate: actualEndDate,
      },
      metrics,
      topPages,
      topSources,
      dailyMetrics,
    }
  } catch (error: any) {
    // Try to refresh token if expired
    if (error.code === 401 && tokens.refresh_token) {
      console.log('Access token expired, refreshing...')
      const newTokens = await refreshAccessToken(tokens.refresh_token)
      // Retry with new tokens
      return fetchGA4Data(propertyId, { ...tokens, ...newTokens }, startDate, endDate)
    }

    console.error('Error fetching GA4 data:', error.message)
    throw error
  }
}

/**
 * Get GA4 property metadata
 */
export async function getGA4PropertyMetadata(propertyId: string, tokens: any) {
  try {
    const oauth2Client = getAuthenticatedClient(tokens)
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client })

    const response = await analyticsAdmin.properties.get({
      name: `properties/${propertyId}`,
    })

    return {
      propertyId: propertyId,
      displayName: response.data.displayName || '',
      timeZone: response.data.timeZone || 'America/New_York',
      currencyCode: response.data.currencyCode || 'USD',
      industryCategory: response.data.industryCategory || '',
      createTime: response.data.createTime || '',
    }
  } catch (error: any) {
    console.error('Error fetching GA4 property metadata:', error.message)
    throw error
  }
}
