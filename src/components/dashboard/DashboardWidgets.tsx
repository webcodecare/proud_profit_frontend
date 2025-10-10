import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Bell, 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Gamepad2
} from "lucide-react";

export default function DashboardWidgets() {
  const widgets = [
    {
      title: "Advanced Alerts",
      description: "Set up custom trading alerts and notifications",
      icon: Bell,
      href: "/advanced-alerts",
      color: "text-blue-600",
      bgColor: "bg-muted/50"
    },
    {
      title: "Multi-Ticker Dashboard",
      description: "Monitor multiple cryptocurrencies at once",
      icon: BarChart3,
      href: "/multi-ticker-dashboard",
      color: "text-green-600",
      bgColor: "bg-muted/50"
    },
    {
      title: "Trading Playground",
      description: "Practice trading with simulated signals",
      icon: Gamepad2,
      href: "/trading-playground",
      color: "text-purple-600",
      bgColor: "bg-muted/50"
    },
    {
      title: "Advanced Portfolio",
      description: "Comprehensive portfolio analysis tools",
      icon: TrendingUp,
      href: "/advanced-portfolio",
      color: "text-orange-600",
      bgColor: "bg-muted/50"
    },
    {
      title: "Preferences",
      description: "Customize your trading experience",
      icon: Settings,
      href: "/preferences",
      color: "text-gray-600",
      bgColor: "bg-muted/50"
    }
  ];

  return (
    <Card className="p-3 sm:p-4">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
          Dashboard Widgets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {widgets.map((widget) => {
            const Icon = widget.icon;
            return (
              <Link key={widget.href} href={widget.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${widget.bgColor}`}>
                        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${widget.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-xs sm:text-sm truncate">{widget.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {widget.description}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-blue-600 font-medium">
                            <span className="hidden sm:inline">Open widget →</span>
                            <span className="sm:hidden">Open →</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}