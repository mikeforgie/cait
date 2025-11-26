'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Link as LinkIcon, FileText, Zap, Wrench } from 'lucide-react';

interface AttributionTimelineProps {
  clientId: string;
  actions: any[];
  rankings: any[];
}

export function AttributionTimeline({ clientId, actions, rankings }: AttributionTimelineProps) {
  // Combine and sort actions and rankings by date
  const timelineItems = [
    ...actions.map(action => ({
      type: 'action',
      date: new Date(action.executed_at),
      data: action,
    })),
    ...rankings.map(ranking => ({
      type: 'ranking',
      date: new Date(ranking.measured_at),
      data: ranking,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15);

  const getActionIcon = (category: string) => {
    switch (category) {
      case 'off_page': return <LinkIcon className="h-4 w-4" />;
      case 'content': return <FileText className="h-4 w-4" />;
      case 'technical': return <Wrench className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'off_page': return 'text-purple-600 bg-purple-100';
      case 'content': return 'text-blue-600 bg-blue-100';
      case 'on_page': return 'text-green-600 bg-green-100';
      case 'technical': return 'text-orange-600 bg-orange-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attribution Timeline</CardTitle>
          <CardDescription>Actions and results over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-neutral-600">
            <p>No actions or rankings data yet.</p>
            <p className="text-sm mt-2">Log your first action above to start tracking attribution!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attribution Timeline</CardTitle>
        <CardDescription>Recent actions and ranking changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineItems.map((item, idx) => (
            <div key={idx} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`rounded-full p-2 ${
                  item.type === 'action'
                    ? getCategoryColor(item.data.action_category)
                    : 'text-neutral-600 bg-neutral-100'
                }`}>
                  {item.type === 'action' ? (
                    getActionIcon(item.data.action_category)
                  ) : (
                    item.data.position_change > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )
                  )}
                </div>
                {idx < timelineItems.length - 1 && (
                  <div className="w-px h-full bg-neutral-200 mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    {item.type === 'action' ? (
                      <>
                        <p className="font-medium text-sm">
                          {item.data.action_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {item.data.target_url}
                        </p>
                        {item.data.action_details?.description && (
                          <p className="text-xs text-neutral-500 mt-1">
                            {item.data.action_details.description}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-sm">
                          {item.data.keyword}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-neutral-600">
                            Position: {item.data.position}
                          </span>
                          {item.data.position_change !== 0 && (
                            <Badge variant={item.data.position_change > 0 ? 'default' : 'destructive'} className="text-xs">
                              {item.data.position_change > 0 ? '+' : ''}{item.data.position_change}
                            </Badge>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500">
                    {item.date.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
