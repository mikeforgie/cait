/**
 * Google Business Profile API Integration
 *
 * Fetches GBP metrics: views, actions, reviews, posts
 */

import { google } from 'googleapis'
import { getAuthenticatedClient } from '@/lib/auth/google-oauth'

/**
 * GBP Metrics Interface
 */
export interface GBPMetrics {
  location_id: string
  location_name: string
  date_range: {
    start_date: string
    end_date: string
  }
  views: {
    total: number
    search_views: number
    maps_views: number
  }
  actions: {
    total: number
    website_clicks: number
    phone_calls: number
    direction_requests: number
  }
  reviews: {
    total_reviews: number
    average_rating: number
    new_reviews: number
  }
  photos: {
    total_photos: number
    views: number
  }
}

/**
 * Fetch GBP performance metrics for a location
 */
export async function fetchGBPMetrics(
  tokens: any,
  locationName: string,
  startDate: string,
  endDate: string
): Promise<GBPMetrics | null> {
  try {
    const oauth2Client = getAuthenticatedClient(tokens)

    // Use Business Profile Performance API
    const mybusiness = google.mybusinessbusinessinformation({
      version: 'v1',
      auth: oauth2Client
    })

    // Fetch location details
    const locationResponse = await mybusiness.locations.get({
      name: locationName,
      readMask: 'name,title,storefrontAddress'
    })

    const location = locationResponse.data

    // Note: The Performance API requires a different endpoint
    // We'll use the v4 API for insights (still functional)
    const insightsUrl = `https://mybusiness.googleapis.com/v4/${locationName}/insights:basic`

    const response = await oauth2Client.request({
      url: insightsUrl,
      method: 'POST',
      data: {
        locationNames: [locationName],
        basicRequest: {
          metricRequests: [
            { metric: 'QUERIES_DIRECT' },
            { metric: 'QUERIES_INDIRECT' },
            { metric: 'VIEWS_MAPS' },
            { metric: 'VIEWS_SEARCH' },
            { metric: 'ACTIONS_WEBSITE' },
            { metric: 'ACTIONS_PHONE' },
            { metric: 'ACTIONS_DRIVING_DIRECTIONS' },
          ],
          timeRange: {
            startTime: `${startDate}T00:00:00Z`,
            endTime: `${endDate}T23:59:59Z`
          }
        }
      }
    })

    // Parse metrics from response
    const metrics = response.data?.locationMetrics?.[0]?.metricValues || []

    const getMetricValue = (metricName: string): number => {
      const metric = metrics.find((m: any) => m.metric === metricName)
      return metric?.totalValue?.value || 0
    }

    // Calculate views
    const searchViews = getMetricValue('VIEWS_SEARCH')
    const mapsViews = getMetricValue('VIEWS_MAPS')
    const directQueries = getMetricValue('QUERIES_DIRECT')
    const indirectQueries = getMetricValue('QUERIES_INDIRECT')

    // Calculate actions
    const websiteClicks = getMetricValue('ACTIONS_WEBSITE')
    const phoneCalls = getMetricValue('ACTIONS_PHONE')
    const directionRequests = getMetricValue('ACTIONS_DRIVING_DIRECTIONS')

    return {
      location_id: locationName.split('/').pop() || '',
      location_name: location.title || '',
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      views: {
        total: searchViews + mapsViews + directQueries + indirectQueries,
        search_views: searchViews + directQueries,
        maps_views: mapsViews + indirectQueries
      },
      actions: {
        total: websiteClicks + phoneCalls + directionRequests,
        website_clicks: websiteClicks,
        phone_calls: phoneCalls,
        direction_requests: directionRequests
      },
      reviews: {
        total_reviews: 0, // Will fetch separately
        average_rating: 0,
        new_reviews: 0
      },
      photos: {
        total_photos: 0,
        views: 0
      }
    }
  } catch (error: any) {
    console.error('Error fetching GBP metrics:', error.message)

    // If insights API fails, try to get basic location info at least
    if (error.message.includes('403') || error.message.includes('permission')) {
      console.warn('GBP Insights API not available. User may need Business Profile Performance API access.')
    }

    return null
  }
}

/**
 * Fetch GBP reviews for a location
 */
export async function fetchGBPReviews(
  tokens: any,
  locationName: string
): Promise<any[]> {
  try {
    const oauth2Client = getAuthenticatedClient(tokens)

    // Use the v1 API to fetch reviews
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/${locationName}/reviews`

    const response = await oauth2Client.request({
      url: reviewsUrl,
      method: 'GET'
    })

    return response.data?.reviews || []
  } catch (error: any) {
    console.error('Error fetching GBP reviews:', error.message)
    return []
  }
}

/**
 * Fetch all GBP metrics for all locations in a client account
 */
export async function fetchAllGBPMetrics(
  tokens: any,
  locations: any[],
  startDate: string,
  endDate: string
): Promise<GBPMetrics[]> {
  const allMetrics: GBPMetrics[] = []

  for (const location of locations) {
    const locationName = location.account_name
      ? `${location.account_name}/locations/${location.location_id}`
      : `accounts/${location.account_name}/locations/${location.location_id}`

    const metrics = await fetchGBPMetrics(tokens, locationName, startDate, endDate)

    if (metrics) {
      allMetrics.push(metrics)
    }
  }

  return allMetrics
}

/**
 * Aggregate GBP metrics for reporting
 */
export function aggregateGBPMetrics(metrics: GBPMetrics[]): {
  total_views: number
  total_actions: number
  total_calls: number
  total_directions: number
  total_website_clicks: number
  average_rating: number
  total_reviews: number
} {
  const totals = metrics.reduce((acc, m) => ({
    total_views: acc.total_views + m.views.total,
    total_actions: acc.total_actions + m.actions.total,
    total_calls: acc.total_calls + m.actions.phone_calls,
    total_directions: acc.total_directions + m.actions.direction_requests,
    total_website_clicks: acc.total_website_clicks + m.actions.website_clicks,
    total_reviews: acc.total_reviews + m.reviews.total_reviews,
    rating_sum: acc.rating_sum + (m.reviews.average_rating * m.reviews.total_reviews)
  }), {
    total_views: 0,
    total_actions: 0,
    total_calls: 0,
    total_directions: 0,
    total_website_clicks: 0,
    total_reviews: 0,
    rating_sum: 0
  })

  return {
    ...totals,
    average_rating: totals.total_reviews > 0
      ? totals.rating_sum / totals.total_reviews
      : 0
  }
}
