import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Shield, Database } from "lucide-react";

interface AdminStatsProps {
  totalUsers: number;
  totalSignals: number;
  adminUsers: number;
  activeSessions: number;
}

export default function AdminStats({ 
  totalUsers, 
  totalSignals, 
  adminUsers, 
  activeSessions 
}: AdminStatsProps) {
  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Trading Signals",
      value: totalSignals.toString(),
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Admin Users",
      value: adminUsers.toString(),
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Active Sessions",
      value: activeSessions.toString(),
      icon: Database,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                Live count
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}