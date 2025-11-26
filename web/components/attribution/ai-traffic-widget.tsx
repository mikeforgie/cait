'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, TrendingUp } from 'lucide-react';

interface AITrafficWidgetProps {
  clientId: string;
}

export function AITrafficWidget({ clientId }: AITrafficWidgetProps) {
  const [aiTraffic, setAiTraffic] = useState<Array<{ platform: string; users: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAITraffic();
  }, [clientId]);

  const fetchAITraffic = async () => {
    try {
      const response = await fetch(`/api/attribution/ai-traffic?clientId=${clientId}`);
      const data = await response.json();
      setAiTraffic(data.summary || []);
    } catch (error) {
      console.error('Failed to fetch AI traffic:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      chatgpt: '>',
      perplexity: '=.',
      claude: '<¯',
      gemini: '=Ž',
      searchgpt: '=',
      you_com: '<',
    };
    return icons[platform] || '>';
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      chatgpt: 'ChatGPT',
      perplexity: 'Perplexity',
      claude: 'Claude',
      gemini: 'Gemini',
      searchgpt: 'SearchGPT',
      you_com: 'You.com',
    };
    return names[platform] || platform;
  };

  const totalAIUsers = aiTraffic.reduce((sum, item) => sum + item.users, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">AI Platform Traffic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-neutral-600 text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (aiTraffic.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Platform Traffic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-neutral-600 text-sm py-4">
            <p>No AI traffic detected yet</p>
            <p className="text-xs mt-1">Traffic from ChatGPT, Perplexity, etc. will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Platform Traffic
          </CardTitle>
          <Badge variant="secondary">{totalAIUsers} users</Badge>
        </div>
        <CardDescription className="text-xs">Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {aiTraffic.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getPlatformIcon(item.platform)}</span>
                <span className="text-sm font-medium">{getPlatformName(item.platform)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">{item.users} users</span>
                {item.users > 0 && <TrendingUp className="h-3 w-3 text-green-600" />}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
