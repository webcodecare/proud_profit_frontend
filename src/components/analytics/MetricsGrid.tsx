import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface Metric {
  label: string;
  value: string;
  trend: string;
  color: string;
}

interface MetricsGridProps {
  metrics: Metric[];
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="p-3 sm:p-4">
          <CardContent className="p-0">
            <div className="text-xs sm:text-sm text-muted-foreground truncate">{metric.label}</div>
            <div className={`text-lg sm:text-xl font-bold ${metric.color} mt-1`}>
              {metric.value}
            </div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 text-green-400 mr-1" />
              <span className="text-xs text-green-400">Active</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}