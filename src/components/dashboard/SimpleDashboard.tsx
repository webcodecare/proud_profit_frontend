import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Settings, 
  Plus, 
  X, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  BarChart3,
  PieChart,
  LineChart,
  Bell,
  Target
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';

// Widget Components
import PriceWidget from './widgets/PriceWidget';
import PortfolioWidget from './widgets/PortfolioWidget';
import SignalsWidget from './widgets/SignalsWidget';
import AlertsWidget from './widgets/AlertsWidget';
import MarketOverviewWidget from './widgets/MarketOverviewWidget';
import TradingPerformanceWidget from './widgets/TradingPerformanceWidget';
import NewsWidget from './widgets/NewsWidget';
import WatchlistWidget from './widgets/WatchlistWidget';

interface Widget {
  id: string;
  type: string;
  title: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  settings: Record<string, any>;
  enabled: boolean;
}

interface DashboardLayout {
  id?: string;
  userId: string;
  name: string;
  widgets: Widget[];
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const AVAILABLE_WIDGETS = [
  {
    type: 'price',
    title: 'Price Tracker',
    icon: DollarSign,
    description: 'Real-time cryptocurrency prices with alerts',
    defaultSize: 'medium',
    defaultSettings: { ticker: 'BTCUSDT', showChart: true }
  },
  {
    type: 'portfolio',
    title: 'Portfolio Overview',
    icon: PieChart,
    description: 'Your portfolio balance and performance',
    defaultSize: 'large',
    defaultSettings: { showAllocation: true, showPnL: true }
  },
  {
    type: 'signals',
    title: 'Trading Signals',
    icon: TrendingUp,
    description: 'Latest buy/sell signals and recommendations',
    defaultSize: 'medium',
    defaultSettings: { limit: 5, autoRefresh: true }
  },
  {
    type: 'alerts',
    title: 'Active Alerts',
    icon: Bell,
    description: 'Your price alerts and notifications',
    defaultSize: 'small',
    defaultSettings: { showOnlyActive: true }
  },
  {
    type: 'market-overview',
    title: 'Market Overview',
    icon: BarChart3,
    description: 'Market trends and top movers',
    defaultSize: 'large',
    defaultSettings: { categories: ['Major', 'DeFi'], limit: 10 }
  },
  {
    type: 'trading-performance',
    title: 'Trading Performance',
    icon: LineChart,
    description: 'Your trading statistics and performance metrics',
    defaultSize: 'large',
    defaultSettings: { timeframe: '30d', showChart: true }
  },
  {
    type: 'news',
    title: 'Crypto News',
    icon: Activity,
    description: 'Latest cryptocurrency news and updates',
    defaultSize: 'medium',
    defaultSettings: { sources: ['general'], limit: 5 }
  },
  {
    type: 'watchlist',
    title: 'Watchlist',
    icon: Target,
    description: 'Your favorite cryptocurrencies to monitor',
    defaultSize: 'medium',
    defaultSettings: { showCharts: false, compactView: true }
  }
];

export default function SimpleDashboard() {
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout | null>(null);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard layout
  const { data: layout, isLoading } = useQuery({
    queryKey: ['/api/dashboard/layout'],
    queryFn: () => apiRequest('GET', '/api/dashboard/layout'),
  });

  // Save dashboard layout
  const saveLayoutMutation = useMutation({
    mutationFn: (layout: DashboardLayout) => 
      apiRequest('POST', '/api/dashboard/layout', layout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/layout'] });
      toast({
        title: "Dashboard Saved",
        description: "Your dashboard layout has been saved",
      });
    },
  });

  useEffect(() => {
    if (layout) {
      setDashboardLayout(layout);
    } else {
      // Create default layout
      const defaultLayout: DashboardLayout = {
        userId: 'demo-user',
        name: 'Default Dashboard',
        isDefault: true,
        widgets: [
          {
            id: 'widget-1',
            type: 'price',
            title: 'BTC Price',
            position: 0,
            size: 'medium',
            settings: { ticker: 'BTCUSDT', showChart: true },
            enabled: true
          },
          {
            id: 'widget-2',
            type: 'portfolio',
            title: 'Portfolio',
            position: 1,
            size: 'large',
            settings: { showAllocation: true, showPnL: true },
            enabled: true
          },
          {
            id: 'widget-3',
            type: 'signals',
            title: 'Trading Signals',
            position: 2,
            size: 'medium',
            settings: { limit: 5, autoRefresh: true },
            enabled: true
          }
        ]
      };
      setDashboardLayout(defaultLayout);
    }
  }, [layout]);

  const addWidget = () => {
    if (!selectedWidgetType || !dashboardLayout) return;

    const widgetConfig = AVAILABLE_WIDGETS.find(w => w.type === selectedWidgetType);
    if (!widgetConfig) return;

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: selectedWidgetType,
      title: widgetConfig.title,
      position: dashboardLayout.widgets.length,
      size: widgetConfig.defaultSize as 'small' | 'medium' | 'large',
      settings: widgetConfig.defaultSettings,
      enabled: true
    };

    setDashboardLayout({
      ...dashboardLayout,
      widgets: [...dashboardLayout.widgets, newWidget]
    });

    setIsAddWidgetOpen(false);
    setSelectedWidgetType('');

    toast({
      title: "Widget Added",
      description: `${widgetConfig.title} widget has been added to your dashboard`,
    });
  };

  const removeWidget = (widgetId: string) => {
    if (!dashboardLayout) return;

    const updatedWidgets = dashboardLayout.widgets
      .filter(w => w.id !== widgetId)
      .map((widget, index) => ({ ...widget, position: index }));

    setDashboardLayout({
      ...dashboardLayout,
      widgets: updatedWidgets
    });

    toast({
      title: "Widget Removed",
      description: "Widget has been removed from your dashboard",
    });
  };

  const updateWidgetSettings = (widgetId: string, settings: Record<string, any>) => {
    if (!dashboardLayout) return;

    const updatedWidgets = dashboardLayout.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, settings: { ...widget.settings, ...settings } } : widget
    );

    setDashboardLayout({
      ...dashboardLayout,
      widgets: updatedWidgets
    });
  };

  const toggleWidgetEnabled = (widgetId: string) => {
    if (!dashboardLayout) return;

    const updatedWidgets = dashboardLayout.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
    );

    setDashboardLayout({
      ...dashboardLayout,
      widgets: updatedWidgets
    });
  };

  const saveDashboard = () => {
    if (dashboardLayout) {
      saveLayoutMutation.mutate(dashboardLayout);
    }
  };

  const renderWidget = (widget: Widget) => {
    const commonProps = {
      widget,
      onUpdateSettings: (settings: Record<string, any>) => updateWidgetSettings(widget.id, settings),
      onRemove: () => removeWidget(widget.id),
      onToggleEnabled: () => toggleWidgetEnabled(widget.id)
    };

    switch (widget.type) {
      case 'price':
        return <PriceWidget {...commonProps} />;
      case 'portfolio':
        return <PortfolioWidget {...commonProps} />;
      case 'signals':
        return <SignalsWidget {...commonProps} />;
      case 'alerts':
        return <AlertsWidget {...commonProps} />;
      case 'market-overview':
        return <MarketOverviewWidget {...commonProps} />;
      case 'trading-performance':
        return <TradingPerformanceWidget {...commonProps} />;
      case 'news':
        return <NewsWidget {...commonProps} />;
      case 'watchlist':
        return <WatchlistWidget {...commonProps} />;
      default:
        return (
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="text-center text-muted-foreground">
                Unknown widget type: {widget.type}
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-1 md:col-span-2';
      case 'large': return 'col-span-1 md:col-span-3';
      default: return 'col-span-1 md:col-span-2';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <p className="text-muted-foreground">
            Customize your personal trading insights with widgets
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Widget</DialogTitle>
                <DialogDescription>
                  Choose a widget to add to your dashboard
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Widget Type</Label>
                  <Select value={selectedWidgetType} onValueChange={setSelectedWidgetType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select widget type" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_WIDGETS.map(widget => (
                        <SelectItem key={widget.type} value={widget.type}>
                          <div className="flex items-center gap-2">
                            <widget.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{widget.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {widget.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddWidgetOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addWidget} disabled={!selectedWidgetType}>
                    Add Widget
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={saveDashboard} disabled={saveLayoutMutation.isPending}>
            <Settings className="h-4 w-4 mr-2" />
            Save Layout
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      {dashboardLayout && dashboardLayout.widgets && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dashboardLayout.widgets
            .sort((a, b) => a.position - b.position)
            .map((widget) => (
              <div key={widget.id} className={getSizeClass(widget.size)}>
                <div className="relative group h-full">
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <div className="h-6 w-6 flex items-center justify-center">
                        <Switch 
                          checked={widget.enabled} 
                          onCheckedChange={() => toggleWidgetEnabled(widget.id)}
                          className="h-3 w-6"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => removeWidget(widget.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {widget.enabled ? renderWidget(widget) : (
                    <Card className="h-full opacity-50">
                      <CardContent className="p-4 flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          <div className="font-medium">{widget.title}</div>
                          <div className="text-sm">Widget disabled</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {dashboardLayout && dashboardLayout.widgets && dashboardLayout.widgets.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Widgets Added</h3>
            <p className="text-muted-foreground mb-4">
              Start building your personalized trading dashboard by adding widgets
            </p>
            <Button onClick={() => setIsAddWidgetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Widget
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}