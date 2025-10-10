import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Target, Zap } from "lucide-react";

interface TradingStatsProps {
  userTier: string;
}

export default function TradingStats({ userTier }: TradingStatsProps) {
  // Mock trading stats based on user tier for demo
  const stats = {
    free: {
      totalSignals: 8,
      accuracy: "N/A",
      profit: "N/A", 
      alertsUsed: 3
    },
    basic: {
      totalSignals: 15,
      accuracy: "72%",
      profit: "+4.2%",
      alertsUsed: 12
    },
    premium: {
      totalSignals: 28,
      accuracy: "78%", 
      profit: "+12.8%",
      alertsUsed: 24
    },
    pro: {
      totalSignals: 45,
      accuracy: "84%",
      profit: "+18.3%",
      alertsUsed: 45
    }
  };

  const currentStats = stats[userTier as keyof typeof stats] || stats.free;

  const statItems = [
    {
      title: "Total Signals",
      value: currentStats.totalSignals.toString(),
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Accuracy",
      value: currentStats.accuracy,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Profit/Loss",
      value: currentStats.profit,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Alerts Used",
      value: currentStats.alertsUsed.toString(),
      icon: Zap,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-3 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </div>
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className={`text-lg sm:text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              {userTier === "free" && stat.value === "N/A" && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Upgrade for stats
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}