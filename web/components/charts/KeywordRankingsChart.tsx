'use client'

import { useState } from 'react'
import { MultiLineChart } from './MultiLineChart'
import { CHART_COLORS, MULTI_LINE_COLORS } from '@/lib/charts'
import { format } from 'date-fns'

export interface KeywordRankingDataPoint {
  date: string
  [keyword: string]: string | number // Dynamic keyword properties
}

export interface KeywordInfo {
  keyword: string
  currentPosition: number
  previousPosition: number
  change: number
  color?: string
}

export interface KeywordRankingsChartProps {
  data: KeywordRankingDataPoint[]
  keywords: KeywordInfo[]
  height?: number
  maxKeywordsToShow?: number
  title?: string
  className?: string
}

export function KeywordRankingsChart({
  data,
  keywords,
  height = 350,
  maxKeywordsToShow = 5,
  title = 'Keyword Rankings Over Time',
  className = '',
}: KeywordRankingsChartProps) {
  // State for selected keywords (default to top 5)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(
    keywords.slice(0, maxKeywordsToShow).map(k => k.keyword)
  )

  // Toggle keyword selection
  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== keyword))
    } else {
      if (selectedKeywords.length < 10) {
        setSelectedKeywords([...selectedKeywords, keyword])
      }
    }
  }

  // Prepare series for MultiLineChart
  const series = keywords
    .filter(k => selectedKeywords.includes(k.keyword))
    .map((k, index) => ({
      dataKey: k.keyword,
      name: k.keyword,
      color: k.color || MULTI_LINE_COLORS[index % MULTI_LINE_COLORS.length],
    }))

  // Calculate summary statistics
  const avgPosition = selectedKeywords.length > 0
    ? selectedKeywords.reduce((sum, keyword) => {
        const keywordData = keywords.find(k => k.keyword === keyword)
        return sum + (keywordData?.currentPosition || 0)
      }, 0) / selectedKeywords.length
    : 0

  const topRankedKeyword = keywords.reduce((best, current) =>
    current.currentPosition < best.currentPosition ? current : best
  , keywords[0])

  const mostImproved = keywords.reduce((best, current) =>
    current.change > best.change ? current : best
  , keywords[0])

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Avg Position</div>
            <div className="text-2xl font-bold text-blue-600">
              #{avgPosition.toFixed(1)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Top Ranked</div>
            <div className="text-xl font-bold text-green-600 truncate">
              {topRankedKeyword?.keyword || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">
              Position #{topRankedKeyword?.currentPosition}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Most Improved</div>
            <div className="text-xl font-bold text-purple-600 truncate">
              {mostImproved?.keyword || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">
              +{mostImproved?.change} positions
            </div>
          </div>
        </div>

        {/* Keyword Selector */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Select Keywords ({selectedKeywords.length}/10)
            </span>
            <button
              onClick={() => setSelectedKeywords([])}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => {
              const isSelected = selectedKeywords.includes(keyword.keyword)
              const color = keyword.color || MULTI_LINE_COLORS[index % MULTI_LINE_COLORS.length]

              return (
                <button
                  key={keyword.keyword}
                  onClick={() => toggleKeyword(keyword.keyword)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${isSelected
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                  style={{
                    backgroundColor: isSelected ? color : undefined,
                  }}
                >
                  <span className="flex items-center gap-2">
                    {keyword.keyword}
                    <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      #{keyword.currentPosition}
                    </span>
                    {keyword.change !== 0 && (
                      <span className={`text-xs ${isSelected ? 'text-white/80' : ''}`}>
                        {keyword.change > 0 ? '↑' : '↓'}{Math.abs(keyword.change)}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Chart */}
      {selectedKeywords.length > 0 ? (
        <div style={{ height }}>
          <MultiLineChart
            data={data}
            series={series}
            xAxisKey="date"
            yAxisLabel="Position"
            height={height}
            invertYAxis={true}
            yAxisDomain={[1, 100]}
            formatXAxis={(value) => {
              try {
                return format(new Date(value), 'MMM d')
              } catch {
                return value
              }
            }}
            formatYAxis={(value) => `#${value}`}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center bg-gray-50 rounded-lg"
          style={{ height }}
        >
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No keywords selected</p>
            <p className="text-sm">Select keywords above to view ranking trends</p>
          </div>
        </div>
      )}

      {/* Legend Note */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Lower position numbers are better (Position #1 = Top of Google)
      </div>
    </div>
  )
}
