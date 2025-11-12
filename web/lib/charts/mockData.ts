/**
 * Mock Data Generators for Chart Testing
 *
 * Generates realistic test data for all chart types
 */

import { addDays, subDays, format } from 'date-fns'

// Traffic data generator
export interface TrafficDataPoint {
  date: string
  users: number
  sessions: number
  pageviews: number
  [key: string]: string | number
}

export function generateTrafficData(days: number = 30): TrafficDataPoint[] {
  const data: TrafficDataPoint[] = []
  const baseUsers = 1000

  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')

    // Add some realistic variance with upward trend
    const trend = (days - i) * 10
    const variance = Math.random() * 200 - 100
    const weekendMultiplier = new Date(date).getDay() === 0 || new Date(date).getDay() === 6 ? 0.7 : 1

    const users = Math.floor((baseUsers + trend + variance) * weekendMultiplier)
    const sessions = Math.floor(users * (1.2 + Math.random() * 0.3))
    const pageviews = Math.floor(sessions * (2.5 + Math.random() * 1.5))

    data.push({
      date,
      users,
      sessions,
      pageviews,
    })
  }

  return data
}

// Keyword ranking data generator (already has index signature)
export interface KeywordRankingDataPoint {
  date: string
  [keyword: string]: string | number
}

export function generateKeywordRankingData(
  keywords: string[] = ['seo services', 'digital marketing', 'local seo', 'content marketing'],
  days: number = 30
): KeywordRankingDataPoint[] {
  const data: KeywordRankingDataPoint[] = []

  // Initialize starting positions
  const positions: { [key: string]: number } = {}
  keywords.forEach((keyword, index) => {
    positions[keyword] = 15 + index * 5 + Math.floor(Math.random() * 10)
  })

  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const dataPoint: KeywordRankingDataPoint = { date }

    keywords.forEach((keyword) => {
      // Gradual improvement with some variance
      const change = Math.random() > 0.6 ? -1 : Math.random() > 0.3 ? 0 : 1
      positions[keyword] = Math.max(1, Math.min(100, positions[keyword] + change))
      dataPoint[keyword] = positions[keyword]
    })

    data.push(dataPoint)
  }

  return data
}

// Backlink growth data generator
export interface BacklinkDataPoint {
  date: string
  total: number
  new: number
  lost: number
  existing: number
  domainAuthority: number
  [key: string]: string | number
}

export function generateBacklinkData(days: number = 90): BacklinkDataPoint[] {
  const data: BacklinkDataPoint[] = []
  let total = 500
  let domainAuthority = 40 // Starting DA

  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')

    // New backlinks gained (0-15 per day)
    const newBacklinks = Math.floor(Math.random() * 15)

    // Lost backlinks (0-5 per day, less frequent)
    const lostBacklinks = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0

    total = total + newBacklinks - lostBacklinks
    const existing = total - newBacklinks

    // Gradually increase DA over time (caps at 70)
    if (Math.random() > 0.9 && domainAuthority < 70) {
      domainAuthority += 1
    }

    data.push({
      date,
      total,
      new: newBacklinks,
      lost: lostBacklinks,
      existing,
      domainAuthority,
    })
  }

  return data
}

// Domain authority data generator
export interface DomainAuthorityDataPoint {
  date: string
  domainAuthority: number
  backlinks: number
}

export function generateDomainAuthorityData(days: number = 90): DomainAuthorityDataPoint[] {
  const data: DomainAuthorityDataPoint[] = []
  let da = 35
  let backlinks = 500

  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')

    // DA increases slowly with backlink growth
    if (Math.random() > 0.95 && da < 70) {
      da += 1
    }

    // Backlinks grow over time
    backlinks += Math.floor(Math.random() * 10)

    data.push({
      date,
      domainAuthority: da,
      backlinks,
    })
  }

  return data
}

// SEO score data (for gauge chart)
export interface SEOScoreData {
  currentScore: number
  previousScore: number
  breakdown: {
    technical: number
    content: number
    backlinks: number
    performance: number
  }
  issues: {
    critical: number
    warning: number
    notice: number
  }
}

export function generateSEOScoreData(): SEOScoreData {
  const technical = 70 + Math.floor(Math.random() * 25)
  const content = 65 + Math.floor(Math.random() * 30)
  const backlinks = 60 + Math.floor(Math.random() * 30)
  const performance = 75 + Math.floor(Math.random() * 20)

  const currentScore = Math.floor((technical + content + backlinks + performance) / 4)
  const previousScore = currentScore - Math.floor(Math.random() * 10)

  return {
    currentScore,
    previousScore,
    breakdown: {
      technical,
      content,
      backlinks,
      performance,
    },
    issues: {
      critical: Math.floor(Math.random() * 5),
      warning: 5 + Math.floor(Math.random() * 15),
      notice: 10 + Math.floor(Math.random() * 30),
    },
  }
}

// Comparison bar chart data
export interface ComparisonDataPoint {
  category: string
  current: number
  previous: number
  [key: string]: string | number
}

export function generateComparisonData(
  categories: string[] = ['Organic Traffic', 'Keywords Ranking', 'Backlinks', 'Domain Authority']
): ComparisonDataPoint[] {
  return categories.map((category) => {
    const current = 50 + Math.floor(Math.random() * 50)
    const previous = current - Math.floor(Math.random() * 20) + Math.floor(Math.random() * 10)

    return {
      category,
      current,
      previous,
    }
  })
}

// Date range presets
export const dateRangePresets = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
} as const

export type DateRangePreset = keyof typeof dateRangePresets
