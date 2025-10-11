import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Settings, ExternalLink, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewsWidgetProps {
  widget: any;
  onUpdateSettings: (settings: Record<string, any>) => void;
  onRemove: () => void;
  onToggleEnabled: () => void;
}

export default function NewsWidget({ widget, onUpdateSettings }: NewsWidgetProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(widget.settings);

  const saveSettings = () => {
    onUpdateSettings(localSettings);
    setIsSettingsOpen(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'breaking': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      'market': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'tech': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      'regulation': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      'defi': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'nft': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  };

  // Mock news data
  const mockNews = [
    {
      id: '1',
      title: 'Bitcoin ETF Sees Record Inflows This Week',
      summary: 'Institutional adoption continues as Bitcoin ETFs attract significant capital...',
      category: 'market',
      source: 'CryptoNews',
      publishedAt: new Date(Date.now() - 30 * 60000).toISOString(),
      url: '#'
    },
    {
      id: '2',
      title: 'Ethereum 2.0 Staking Rewards Increase',
      summary: 'Network upgrades lead to higher staking yields for validators...',
      category: 'tech',
      source: 'EthHub',
      publishedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      url: '#'
    },
    {
      id: '3',
      title: 'DeFi Protocol Launches New Yield Farming Program',
      summary: 'Users can now earn enhanced rewards through liquidity provision...',
      category: 'defi',
      source: 'DeFiPulse',
      publishedAt: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
      url: '#'
    },
    {
      id: '4',
      title: 'Regulatory Clarity Expected for Crypto Markets',
      summary: 'Government officials hint at comprehensive framework for digital assets...',
      category: 'regulation',
      source: 'RegulatoryWatch',
      publishedAt: new Date(Date.now() - 6 * 60 * 60000).toISOString(),
      url: '#'
    },
    {
      id: '5',
      title: 'Major NFT Marketplace Announces New Features',
      summary: 'Enhanced trading tools and royalty management coming soon...',
      category: 'nft',
      source: 'NFTInsider',
      publishedAt: new Date(Date.now() - 8 * 60 * 60000).toISOString(),
      url: '#'
    }
  ];

  const filteredNews = mockNews
    .filter(article => localSettings.sources.includes('general') || localSettings.sources.includes(article.category))
    .slice(0, localSettings.limit);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Crypto News
        </CardTitle>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
              <Settings className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>News Widget Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Number of articles to show</Label>
                <Input
                  type="number"
                  min="3"
                  max="10"
                  value={localSettings.limit}
                  onChange={(e) => setLocalSettings({...localSettings, limit: parseInt(e.target.value) || 5})}
                />
              </div>
              <div>
                <Label>News Sources</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['general', 'market', 'tech', 'regulation', 'defi', 'nft'].map(source => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={source}
                        checked={localSettings.sources.includes(source)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setLocalSettings({
                              ...localSettings,
                              sources: [...localSettings.sources, source]
                            });
                          } else {
                            setLocalSettings({
                              ...localSettings,
                              sources: localSettings.sources.filter((s: string) => s !== source)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={source} className="text-sm capitalize">{source}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveSettings}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-4">
        {filteredNews.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div>No news available</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNews.map((article) => (
              <div key={article.id} className="space-y-2 pb-3 border-b border-border last:border-b-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className={`${getCategoryColor(article.category)} text-xs`}>
                    {article.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(article.publishedAt)}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm leading-tight mb-1">
                    {article.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {article.summary}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {article.source}
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}