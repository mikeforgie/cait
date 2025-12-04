'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Link as LinkIcon, FileText, Zap } from 'lucide-react';

interface PageAttributionViewProps {
  clientId: string;
  targetUrl: string;
}

export function PageAttributionView({ clientId, targetUrl }: PageAttributionViewProps) {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageActions();
  }, [targetUrl]);

  const fetchPageActions = async () => {
    try {
      const response = await fetch(
        `/api/attribution/page-actions?clientId=${clientId}&targetUrl=${encodeURIComponent(targetUrl)}`
      );
      const data = await response.json();
      setActions(data.actions || []);
    } catch (error) {
      console.error('Failed to fetch page actions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Page Attribution</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-neutral-600">Loading attribution data...</div>
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Why This Page Improved</CardTitle>
        <CardDescription>{targetUrl}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">
            Actions that may have contributed to this page's ranking improvement:
          </p>

          {actions.map((action, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-neutral-50">
              <div className="rounded-full p-2 bg-white border">
                <LinkIcon className="h-4 w-4 text-neutral-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {action.action_type.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  {new Date(action.executed_at).toLocaleDateString()} · {action.action_category}
                </p>
                {action.action_details?.backlinkUrl && (
                  <p className="text-xs text-neutral-500 mt-1">
                    From: {action.action_details.backlinkUrl}
                  </p>
                )}
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-900">Attribution Analysis</p>
            <p className="text-xs text-blue-700 mt-1">
              {actions.length} action{actions.length !== 1 ? 's' : ''} performed on this page in the last 6 months.
              Correlation analysis suggests these activities contributed to the ranking improvement.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
