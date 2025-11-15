'use client';

import React, { useState } from 'react';
import { TrendingUp, MapPin, Zap, Search } from 'lucide-react';

interface KeywordRanking {
  id: string;
  keyword: string;
  currentRank: number;
  previousRank?: number;
  searchVolume: number;
  trend: 'up' | 'down' | 'stable';
}

interface GeoLocation {
  id: string;
  city: string;
  state: string;
  rank: number;
  traffic: number;
}

interface AIPlatformResult {
  id: string;
  platform: string;
  keyword: string;
  status: 'first' | 'in_results' | 'not_found';
  position?: number;
}

const getRankColor = (rank: number): { bg: string; text: string; progress: number } => {
  if (rank === 1) {
    return { bg: 'from-green-500/20 to-green-600/20', text: 'text-green-600', progress: 100 };
  } else if (rank <= 5) {
    return { bg: 'from-yellow-500/20 to-orange-500/20', text: 'text-yellow-600', progress: 80 };
  } else if (rank <= 10) {
    return { bg: 'from-orange-500/20 to-red-500/20', text: 'text-orange-600', progress: 60 };
  } else {
    return { bg: 'from-red-500/20 to-red-600/20', text: 'text-red-600', progress: 20 };
  }
};

const getRankGradient = (rank: number): string => {
  if (rank === 1) {
    return 'bg-gradient-to-r from-green-500 to-green-600';
  } else if (rank <= 5) {
    return 'bg-gradient-to-r from-yellow-500 to-orange-500';
  } else if (rank <= 10) {
    return 'bg-gradient-to-r from-orange-500 to-red-500';
  } else {
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }
};

const getAIStatusColor = (
  status: 'first' | 'in_results' | 'not_found'
): { bg: string; border: string; dot: string; label: string } => {
  switch (status) {
    case 'first':
      return {
        bg: 'bg-green-50',
        border: 'border-green-500',
        dot: 'bg-green-500 shadow-lg shadow-green-500/40',
        label: '🥇 #1 Result',
      };
    case 'in_results':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-500',
        dot: 'bg-yellow-500 shadow-lg shadow-yellow-500/30',
        label: '📌 In Results',
      };
    case 'not_found':
      return {
        bg: 'bg-red-50',
        border: 'border-red-500',
        dot: 'bg-red-500 shadow-lg shadow-red-500/40',
        label: '❌ Not Found',
      };
  }
};

export const RankingsPage = () => {
  // Mock data - replace with real DataForSEO API calls
  const [keywords] = useState<KeywordRanking[]>([
    { id: '1', keyword: 'plumber near me', currentRank: 1, previousRank: 2, searchVolume: 8900, trend: 'up' },
    { id: '2', keyword: 'emergency plumbing', currentRank: 3, previousRank: 4, searchVolume: 5600, trend: 'up' },
    { id: '3', keyword: 'residential plumbing', currentRank: 5, previousRank: 5, searchVolume: 3200, trend: 'stable' },
    { id: '4', keyword: 'water heater repair', currentRank: 8, previousRank: 7, searchVolume: 2100, trend: 'down' },
    { id: '5', keyword: 'pipe repair services', currentRank: 12, previousRank: 10, searchVolume: 1800, trend: 'down' },
  ]);

  const [geoLocations] = useState<GeoLocation[]>([
    { id: '1', city: 'Denver', state: 'CO', rank: 1, traffic: 240 },
    { id: '2', city: 'Boulder', state: 'CO', rank: 1, traffic: 120 },
    { id: '3', city: 'Fort Collins', state: 'CO', rank: 1, traffic: 95 },
    { id: '4', city: 'Colorado Springs', state: 'CO', rank: 2, traffic: 180 },
    { id: '5', city: 'Aurora', state: 'CO', rank: 3, traffic: 130 },
    { id: '6', city: 'Littleton', state: 'CO', rank: 1, traffic: 80 },
  ]);

  const [aiResults] = useState<AIPlatformResult[]>([
    { id: '1', platform: 'ChatGPT', keyword: 'best plumber denver', status: 'first' },
    { id: '2', platform: 'ChatGPT', keyword: 'emergency plumbing services', status: 'in_results' },
    { id: '3', platform: 'ChatGPT', keyword: '24/7 plumbing repair', status: 'not_found' },
    { id: '4', platform: 'Perplexity', keyword: 'local plumber recommendations', status: 'first' },
    { id: '5', platform: 'Perplexity', keyword: 'water heater installation', status: 'in_results' },
    { id: '6', platform: 'Google Gemini', keyword: 'plumbing near me', status: 'first' },
  ]);

  const topRankings = keywords.filter((k) => k.currentRank <= 5).length;
  const aiFirstResults = aiResults.filter((r) => r.status === 'first').length;
  const #1Locations = geoLocations.filter((g) => g.rank === 1).length;

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
          Rankings
        </h2>
        <p className="text-gray-600 mt-2">Track keyword positions, local rankings, and AI presence</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top 5 Keywords */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Top 5 Keywords</p>
              <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                {topRankings}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Geo #1 Positions */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">#1 in Locations</p>
              <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                {#1Locations}/{geoLocations.length}
              </p>
            </div>
            <MapPin className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* AI #1 Results */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">AI #1 Results</p>
              <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                {aiFirstResults}
              </p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Keyword Rankings */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-red-500" />
            Keyword Rankings
          </h3>
          <p className="text-sm text-gray-600 mt-1">Green = Rank #1, Yellow/Orange = Top 5, Red = 10+</p>
        </div>

        <div className="space-y-4 p-6">
          {keywords.map((kw) => {
            const rankColor = getRankColor(kw.currentRank);
            const gradient = getRankGradient(kw.currentRank);

            return (
              <div
                key={kw.id}
                className={`p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors ${rankColor.bg}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{kw.keyword}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Volume: {kw.searchVolume.toLocaleString()} monthly searches
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-2xl font-bold ${rankColor.text}`}>{kw.currentRank}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {kw.trend === 'up' && <span className="text-green-600">↑ Up</span>}
                      {kw.trend === 'down' && <span className="text-red-600">↓ Down</span>}
                      {kw.trend === 'stable' && <span className="text-gray-600">→ Stable</span>}
                    </div>
                  </div>
                </div>

                {/* Ranking Bar */}
                <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${gradient} rounded-full transition-all duration-300`}
                    style={{
                      width: `${Math.max((100 - (kw.currentRank - 1) * 8), 10)}%`,
                    }}
                  />
                </div>

                {/* Ranking Scale */}
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Rank 1</span>
                  <span>Top 5</span>
                  <span>10+</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Geo Rankings */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            Local Rankings by Location
          </h3>
          <p className="text-sm text-gray-600 mt-1">Where you rank #1 for your primary keywords</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {geoLocations.map((geo) => {
            const rankColor = getRankColor(geo.rank);
            const gradient = getRankGradient(geo.rank);

            return (
              <div
                key={geo.id}
                className={`p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md ${rankColor.bg}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {geo.city}, {geo.state}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {geo.traffic.toLocaleString()} monthly searches
                    </p>
                  </div>
                  <div className={`text-sm font-bold px-2 py-1 rounded-full ${rankColor.text} bg-white`}>
                    {geo.rank === 1 ? '🥇 #1' : `#${geo.rank}`}
                  </div>
                </div>

                {/* Ranking Bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${gradient}`} style={{ width: `${geo.rank === 1 ? 100 : 60}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Platform Presence */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            AI Platform Rankings
          </h3>
          <p className="text-sm text-gray-600 mt-1">Your presence in ChatGPT, Perplexity, and Google Gemini results</p>
        </div>

        <div className="space-y-3 p-6">
          {/* Group by Platform */}
          {['ChatGPT', 'Perplexity', 'Google Gemini'].map((platform) => {
            const platformResults = aiResults.filter((r) => r.platform === platform);

            return (
              <div key={platform}>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">{platform}</h4>
                <div className="space-y-2 ml-4">
                  {platformResults.map((result) => {
                    const statusColor = getAIStatusColor(result.status);

                    return (
                      <div
                        key={result.id}
                        className={`p-3 rounded-lg border-2 ${statusColor.border} ${statusColor.bg} flex items-center justify-between transition-all hover:shadow-md`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${statusColor.dot}`} />
                          <span className="text-gray-900 font-medium">{result.keyword}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-600 bg-white px-2 py-1 rounded">
                          {statusColor.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-cyan-300 rounded-lg p-6">
        <div className="flex gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h4 className="font-bold text-gray-900">Data Source</h4>
            <p className="text-sm text-gray-700 mt-1">
              Rankings are updated daily using DataForSEO API. Local rankings show your performance in major metros.
              AI rankings are checked weekly across top platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
