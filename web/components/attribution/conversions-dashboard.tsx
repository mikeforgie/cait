'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Phone,
  FileText,
  ShoppingCart,
  UserPlus,
  Download,
  MessageSquare,
  Calendar,
  DollarSign,
  TrendingUp,
  Bot,
  Loader2,
} from 'lucide-react';

interface ConversionSummary {
  totalConversions: number;
  totalValue: number;
  byType: Record<string, { count: number; value: number }>;
  bySource: Record<string, { count: number; value: number }>;
  aiConversions: {
    total: number;
    byPlatform: Record<string, number>;
  };
}

interface ConversionsDashboardProps {
  clientId: string;
  initialSummary?: ConversionSummary;
}

const conversionTypeIcons: Record<string, typeof Phone> = {
  form_submission: FileText,
  phone_call: Phone,
  purchase: ShoppingCart,
  signup: UserPlus,
  download: Download,
  contact: MessageSquare,
  booking: Calendar,
  quote_request: FileText,
  chat_start: MessageSquare,
  lead: UserPlus,
  custom: FileText,
};

const conversionTypeLabels: Record<string, string> = {
  form_submission: 'Form Submissions',
  phone_call: 'Phone Calls',
  purchase: 'Purchases',
  signup: 'Sign Ups',
  download: 'Downloads',
  contact: 'Contact Requests',
  booking: 'Bookings',
  quote_request: 'Quote Requests',
  chat_start: 'Chat Started',
  lead: 'Leads',
  custom: 'Other',
};

const aiPlatformLabels: Record<string, string> = {
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  claude: 'Claude',
  gemini: 'Gemini',
  searchgpt: 'SearchGPT',
  you_com: 'You.com',
};

export function ConversionsDashboard({ clientId, initialSummary }: ConversionsDashboardProps) {
  const [summary, setSummary] = useState<ConversionSummary | null>(initialSummary || null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/attribution/conversions?clientId=${clientId}&days=${days}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversions');
      }

      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const syncConversions = async () => {
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/attribution/conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, days }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync conversions');
      }

      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!initialSummary) {
      fetchSummary();
    }
  }, [days]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Conversions</h2>
          <p className="text-neutral-600">
            Track form submissions, calls, purchases, and other conversions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={syncConversions} disabled={syncing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from GA4'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && !summary && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Conversions */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Conversions</CardDescription>
                <CardTitle className="text-3xl">{summary.totalConversions}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-neutral-600">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  Last {days} days
                </div>
              </CardContent>
            </Card>

            {/* Total Value */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Value</CardDescription>
                <CardTitle className="text-3xl">{formatCurrency(summary.totalValue)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-neutral-600">
                  <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                  Estimated revenue
                </div>
              </CardContent>
            </Card>

            {/* AI Conversions */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-2">
                <CardDescription className="text-purple-700">AI Traffic Conversions</CardDescription>
                <CardTitle className="text-3xl text-purple-900">
                  {summary.aiConversions.total}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-purple-700">
                  <Bot className="h-4 w-4 mr-1" />
                  From ChatGPT, Perplexity, etc.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversions by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Conversions by Type</CardTitle>
              <CardDescription>Breakdown of conversion types</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(summary.byType).length === 0 ? (
                <p className="text-neutral-500 text-center py-8">
                  No conversions tracked yet. Click "Sync from GA4" to import conversion data.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(summary.byType)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([type, data]) => {
                      const Icon = conversionTypeIcons[type] || FileText;
                      const label = conversionTypeLabels[type] || type;

                      return (
                        <div
                          key={type}
                          className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
                        >
                          <div className="p-2 rounded-lg bg-neutral-100">
                            <Icon className="h-5 w-5 text-neutral-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-900">{label}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-neutral-600">{data.count} conversions</span>
                              {data.value > 0 && (
                                <Badge variant="outline" className="text-green-700">
                                  {formatCurrency(data.value)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversions by Source */}
          <Card>
            <CardHeader>
              <CardTitle>Conversions by Source</CardTitle>
              <CardDescription>Which traffic sources are converting</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(summary.bySource).length === 0 ? (
                <p className="text-neutral-500 text-center py-8">
                  No source data available yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(summary.bySource)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 10)
                    .map(([source, data]) => {
                      const percentage = (data.count / summary.totalConversions) * 100;

                      return (
                        <div key={source} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-neutral-900">{source}</span>
                              <span className="text-sm text-neutral-600">
                                {data.count} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          {data.value > 0 && (
                            <Badge variant="outline" className="text-green-700">
                              {formatCurrency(data.value)}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Platform Breakdown */}
          {summary.aiConversions.total > 0 && (
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  AI Platform Conversions
                </CardTitle>
                <CardDescription>
                  Conversions from visitors referred by AI platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(summary.aiConversions.byPlatform)
                    .sort((a, b) => b[1] - a[1])
                    .map(([platform, count]) => (
                      <div
                        key={platform}
                        className="p-4 rounded-lg bg-purple-50 border border-purple-100"
                      >
                        <p className="text-lg font-bold text-purple-900">{count}</p>
                        <p className="text-sm text-purple-700">
                          {aiPlatformLabels[platform] || platform}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
