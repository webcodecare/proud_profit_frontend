import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Bell,
  Database,
  Shield
} from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "User Management",
      description: "Manage user accounts and permissions",
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "System Settings",
      description: "Configure platform settings",
      icon: Settings,
      href: "/admin/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-50"
    },
    {
      title: "Analytics",
      description: "View platform analytics and reports",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Notifications",
      description: "Manage system notifications",
      icon: Bell,
      href: "/admin/notifications",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Tickers",
      description: "Manage cryptocurrency tickers",
      icon: Database,
      href: "/admin/tickers",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Permissions",
      description: "Configure role-based permissions",
      icon: Shield,
      href: "/admin/permissions",
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start space-y-2 w-full hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={`p-2 rounded-lg ${action.bgColor}`}>
                      <Icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-medium text-sm">{action.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}