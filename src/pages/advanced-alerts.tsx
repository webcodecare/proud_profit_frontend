import React, { Suspense } from 'react';
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import AlertSystem from '@/components/advanced/AlertSystem';
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

// Loading component for better UX
function AlertSystemSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="h-6 bg-muted rounded w-24"></div>
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdvancedAlertsPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Show initial loading screen to prevent black flash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />
          <div className="ml-0 md:ml-64 flex-1">
            <header className="bg-card border-b border-border p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                  <h1 className="text-lg sm:text-2xl font-bold">Advanced Alert System</h1>
                </div>
                <Badge variant="outline" className="text-emerald-400 text-xs sm:text-sm">
                  Multi-Channel Alerts
                </Badge>
              </div>
            </header>
            <div className="p-3 sm:p-6">
              <AlertSystemSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-6 w-6 text-[#4A90A4]" />
                <h1 className="text-2xl font-bold">Advanced Alert System</h1>
              </div>
              <Badge variant="outline" className="text-emerald-400">
                Multi-Channel Alerts
              </Badge>
            </div>
          </header>

          {/* Alert System Content with Suspense */}
          <div className="p-6">
            <SubscriptionGuard feature="multiChannelAlerts">
              <Suspense fallback={<AlertSystemSkeleton />}>
                <AlertSystem />
              </Suspense>
            </SubscriptionGuard>
          </div>
        </div>
      </div>
    </div>
  );
}