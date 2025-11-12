/**
 * Chart Utilities - Barrel Export
 *
 * Exports all chart-related utilities and configurations
 */

// Configuration
export {
  CHART_COLORS,
  MULTI_LINE_COLORS,
  GAUGE_ZONES,
  CHART_HEIGHTS,
  CHART_CONFIG,
  CHART_ANIMATIONS,
  DATE_FORMATS,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatCompactNumber,
} from './config'

// Mock data generators
export {
  generateTrafficData,
  generateKeywordRankingData,
  generateBacklinkData,
  generateDomainAuthorityData,
  generateSEOScoreData,
  generateComparisonData,
  dateRangePresets,
} from './mockData'

export type {
  TrafficDataPoint,
  KeywordRankingDataPoint,
  BacklinkDataPoint,
  DomainAuthorityDataPoint,
  SEOScoreData,
  ComparisonDataPoint,
  DateRangePreset,
} from './mockData'
