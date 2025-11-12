/**
 * Chart Components Demo Page
 *
 * Showcases all available chart components with mock data
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, MultiLineChart, AreaChart, GaugeChart, BarChart, KeywordRankingsChart, BacklinkGrowthChart } from '@/components/charts'
import {
  generateTrafficData,
  generateKeywordRankingData,
  generateBacklinkData,
  generateSEOScoreData,
  generateComparisonData,
  CHART_COLORS,
} from '@/lib/charts'
import { format } from 'date-fns'

export default function ChartsDemo() {
  // Generate mock data - typed for compatibility
  const trafficData = generateTrafficData(30) as Array<{[key: string]: string | number}>
  const keywordData = generateKeywordRankingData(
    ['SEO Services', 'Digital Marketing', 'Local SEO', 'Content Marketing', 'Link Building'],
    30
  )
  const backlinkData = generateBacklinkData(90)
  const seoScore = generateSEOScoreData()
  const comparisonData = generateComparisonData()

  // Format date for charts
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d')
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Chart Components Demo</h1>
          <p className="text-neutral-600">
            Interactive showcase of all available chart components with live data
          </p>
        </div>

        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Trend Chart (Line Chart)</CardTitle>
            <CardDescription>Multi-series line chart showing traffic metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              data={trafficData}
              lines={[
                { dataKey: 'users', name: 'Users', color: CHART_COLORS.primary },
                { dataKey: 'sessions', name: 'Sessions', color: CHART_COLORS.success },
                { dataKey: 'pageviews', name: 'Pageviews', color: CHART_COLORS.purple },
              ]}
              xAxisKey="date"
              height={350}
              formatXAxis={formatDate}
              formatTooltip={(value, name) => [value.toLocaleString(), name]}
            />
          </CardContent>
        </Card>

        {/* Multi-Line Chart (Keyword Rankings) */}
        <Card>
          <CardHeader>
            <CardTitle>Keyword Rankings (Multi-Line Chart)</CardTitle>
            <CardDescription>Track multiple keyword positions over time (inverted Y-axis)</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiLineChart
              data={keywordData}
              series={[
                { dataKey: 'SEO Services', name: 'SEO Services', color: CHART_COLORS.primary },
                { dataKey: 'Digital Marketing', name: 'Digital Marketing', color: CHART_COLORS.success },
                { dataKey: 'Local SEO', name: 'Local SEO', color: CHART_COLORS.purple },
                { dataKey: 'Content Marketing', name: 'Content Marketing', color: CHART_COLORS.warning },
                { dataKey: 'Link Building', name: 'Link Building', color: CHART_COLORS.error },
              ]}
              xAxisKey="date"
              yAxisLabel="Position"
              height={400}
              invertYAxis={true}
              yAxisDomain={[1, 100]}
              formatXAxis={formatDate}
            />
          </CardContent>
        </Card>

        {/* Keyword Rankings Chart (Advanced) */}
        <KeywordRankingsChart
          data={keywordData}
          keywords={[
            { keyword: 'SEO Services', currentPosition: 3, previousPosition: 5, change: 2, color: CHART_COLORS.primary },
            { keyword: 'Digital Marketing', currentPosition: 7, previousPosition: 12, change: 5, color: CHART_COLORS.success },
            { keyword: 'Local SEO', currentPosition: 15, previousPosition: 18, change: 3, color: CHART_COLORS.purple },
            { keyword: 'Content Marketing', currentPosition: 22, previousPosition: 20, change: -2, color: CHART_COLORS.warning },
            { keyword: 'Link Building', currentPosition: 8, previousPosition: 10, change: 2, color: CHART_COLORS.error },
          ]}
          height={450}
          title="Advanced Keyword Rankings Chart"
        />

        {/* Backlink Growth Chart (Advanced) */}
        <BacklinkGrowthChart
          data={backlinkData}
          height={450}
          showDomainAuthority={true}
          title="Advanced Backlink Growth Chart"
        />

        {/* Area Chart (Backlink Growth - Basic) */}
        <Card>
          <CardHeader>
            <CardTitle>Backlink Growth (Basic Area Chart)</CardTitle>
            <CardDescription>Simple stacked area chart showing new, existing, and lost backlinks</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={backlinkData}
              areas={[
                { dataKey: 'new', name: 'New Backlinks', color: CHART_COLORS.success },
                { dataKey: 'existing', name: 'Existing', color: CHART_COLORS.primary },
                { dataKey: 'lost', name: 'Lost', color: CHART_COLORS.error },
              ]}
              xAxisKey="date"
              height={350}
              stacked={true}
              formatXAxis={formatDate}
              formatTooltip={(value, name) => [value.toLocaleString(), name]}
            />
          </CardContent>
        </Card>

        {/* Gauge Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall SEO Score</CardTitle>
              <CardDescription>Current vs. Previous</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <GaugeChart
                value={seoScore.currentScore}
                previousValue={seoScore.previousScore}
                label="Overall"
                size={180}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical SEO</CardTitle>
              <CardDescription>Site health score</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <GaugeChart
                value={seoScore.breakdown.technical}
                label="Technical"
                size={180}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Quality</CardTitle>
              <CardDescription>Content optimization</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <GaugeChart
                value={seoScore.breakdown.content}
                label="Content"
                size={180}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backlink Profile</CardTitle>
              <CardDescription>Link authority</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <GaugeChart
                value={seoScore.breakdown.backlinks}
                label="Backlinks"
                size={180}
              />
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Month-over-Month Comparison (Bar Chart)</CardTitle>
            <CardDescription>Current period vs. previous period performance</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={comparisonData}
              bars={[
                { dataKey: 'current', name: 'Current Month', color: CHART_COLORS.primary },
                { dataKey: 'previous', name: 'Previous Month', color: CHART_COLORS.purple },
              ]}
              xAxisKey="category"
              height={300}
              formatYAxis={(value) => value.toLocaleString()}
            />
          </CardContent>
        </Card>

        {/* Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics (Horizontal Bar Chart)</CardTitle>
            <CardDescription>Side-by-side comparison of key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={comparisonData}
              bars={[
                { dataKey: 'current', name: 'Current', color: CHART_COLORS.success },
                { dataKey: 'previous', name: 'Previous', color: CHART_COLORS.warning },
              ]}
              xAxisKey="category"
              height={300}
              horizontal={true}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-500 py-8">
          All charts are responsive and interactive. Hover for details, click legends to toggle series.
        </div>
      </div>
    </div>
  )
}
