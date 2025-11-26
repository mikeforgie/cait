'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Loader2 } from 'lucide-react';

interface SyncControlsProps {
  clientId: string;
}

export function SyncControls({ clientId }: SyncControlsProps) {
  const [syncingGA4, setSyncingGA4] = useState(false);
  const [syncingRankings, setSyncingRankings] = useState(false);
  const [ga4Result, setGA4Result] = useState<string>('');
  const [rankingsResult, setRankingsResult] = useState<string>('');

  const handleSyncGA4 = async () => {
    setSyncingGA4(true);
    setGA4Result('');

    try {
      const response = await fetch('/api/attribution/sync-ga4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, days: 7 }),
      });

      const data = await response.json();

      if (response.ok) {
        setGA4Result(` Synced ${data.results.traffic} traffic changes, ${data.results.aiTraffic} AI traffic sources`);
      } else {
        setGA4Result(` Error: ${data.error}`);
      }
    } catch (error) {
      setGA4Result(' Failed to sync GA4 data');
    } finally {
      setSyncingGA4(false);
    }
  };

  const handleCheckRankings = async () => {
    setSyncingRankings(true);
    setRankingsResult('');

    try {
      const response = await fetch('/api/rankings/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      const data = await response.json();

      if (response.ok) {
        setRankingsResult(` Checked ${data.checked} keywords, ${data.significantChanges} significant changes`);
      } else {
        setRankingsResult(` Error: ${data.error}`);
      }
    } catch (error) {
      setRankingsResult(' Failed to check rankings');
    } finally {
      setSyncingRankings(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Results Data</CardTitle>
        <CardDescription>Manually sync traffic and ranking data for attribution analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* GA4 Sync */}
        <div className="space-y-2">
          <Button
            onClick={handleSyncGA4}
            disabled={syncingGA4}
            variant="outline"
            className="w-full"
          >
            {syncingGA4 ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing GA4 Data...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync GA4 Traffic & AI Sources
              </>
            )}
          </Button>
          {ga4Result && (
            <p className={`text-xs ${ga4Result.startsWith('') ? 'text-green-600' : 'text-red-600'}`}>
              {ga4Result}
            </p>
          )}
        </div>

        {/* Rankings Check */}
        <div className="space-y-2">
          <Button
            onClick={handleCheckRankings}
            disabled={syncingRankings}
            variant="outline"
            className="w-full"
          >
            {syncingRankings ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Rankings...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Check Keyword Rankings
              </>
            )}
          </Button>
          {rankingsResult && (
            <p className={`text-xs ${rankingsResult.startsWith('') ? 'text-green-600' : 'text-red-600'}`}>
              {rankingsResult}
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-neutral-50 p-3 text-xs text-neutral-600">
          <p className="font-medium mb-1">9 About Data Syncing:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>GA4 sync fetches traffic data from last 7 days</li>
            <li>Ranking checks use DataForSEO API (requires credentials)</li>
            <li>Results feed the attribution timeline automatically</li>
            <li>Set up automated daily checks in settings (coming soon)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
