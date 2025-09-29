import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useState, useEffect } from "react";
import { 
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Activity,
  DollarSign
} from "lucide-react";

// Layout Components
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

// Modular Dashboard Components
import QuickStats from "@/components/dashboard/QuickStats";
import RecentSignals from "@/components/dashboard/RecentSignals";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import TickerManager from "@/components/dashboard/TickerManager";
import DashboardWidgets from "@/components/dashboard/DashboardWidgets";

interface AlertSignal {
  id: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: string;
  timestamp: string;
  source: string;
  note?: string;
}

export default function DashboardModular() {
  const { user } = useAuth();
  const [recentSignals, setRecentSignals] = useState<AlertSignal[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([
    "BTCUSDT",
    "ETHUSDT",
  ]);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user's recent signals
  const { data: userSignals, isLoading: isLoadingSignals } = useQuery({
    queryKey: ["/api/signals/BTCUSDT"],
    queryFn: async () => {
      const response = await fetch("/api/signals/BTCUSDT?limit=10");
      if (!response.ok) throw new Error("Failed to fetch signals");
      return await response.json();
    },
  });

  // WebSocket for real-time updates
  useWebSocket((message) => {
    if (message.type === "new_signal" && message.signal) {
      setRecentSignals((prev) => [message.signal, ...prev.slice(0, 9)]);
    }
  });

  // Initialize signals data
  useEffect(() => {
    if (userSignals && userSignals.length > 0) {
      setRecentSignals(userSignals);
    } else {
      // Sample signals for demo
      const sampleSignals: AlertSignal[] = [
        {
          id: "signal-1",
          ticker: "BTCUSDT",
          signalType: "buy",
          price: "67500.00",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          source: "TradingView",
          note: "RSI oversold condition",
        },
        {
          id: "signal-2",
          ticker: "ETHUSDT",
          signalType: "sell",
          price: "3200.50",
          timestamp: new Date(Date.now() - 900000).toISOString(),
          source: "Algorithm",
          note: "MACD bearish crossover",
        },
      ];
      setRecentSignals(sampleSignals);
    }
  }, [userSignals]);

  // Handle ticker selection
  const handleTickerToggle = (symbol: string) => {
    setSelectedTickers((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol],
    );
  };

  // Quick stats data
  const quickStats = [
    {
      title: "Signal Accuracy",
      value: "87.5%",
      change: "+2.3% from last week",
      icon: <Target className="w-5 h-5 text-green-600 dark:text-green-400" />,
      trend: "up" as const,
    },
    {
      title: "Active Alerts",
      value: "12",
      change: "3 new today",
      icon: <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      trend: "neutral" as const,
    },
    {
      title: "Avg Response Time",
      value: "0.8s",
      change: "-0.2s improvement",
      icon: <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      trend: "up" as const,
    },
    {
      title: "Portfolio Value",
      value: "$24,582",
      change: "+$1,240 (5.3%)",
      icon: <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      trend: "up" as const,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Welcome back, {user?.firstName || user?.email || "Trader"}! 
                Here's your trading overview.
              </p>
            </div>

            {/* Quick Stats */}
            <QuickStats stats={quickStats} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column - Charts and Analytics */}
              <div className="xl:col-span-2">
                <DashboardTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  selectedTickers={selectedTickers}
                />
              </div>

              {/* Right Column - Sidebar Content */}
              <div className="space-y-6">
                <RecentSignals 
                  signals={recentSignals} 
                  isLoading={isLoadingSignals}
                />
                
                <TickerManager
                  selectedTickers={selectedTickers}
                  onTickerToggle={handleTickerToggle}
                />
                
                <DashboardWidgets />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}