import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import AdvancedPortfolio from '@/components/advanced/AdvancedPortfolio';
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export default function AdvancedPortfolioPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-0 md:ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                <h1 className="text-lg sm:text-2xl font-bold">Advanced Portfolio</h1>
              </div>
              <Badge variant="outline" className="text-emerald-400 text-xs sm:text-sm">
                Professional Analytics
              </Badge>
            </div>
          </header>

          {/* Portfolio Content */}
          <div className="p-3 sm:p-6">
            <SubscriptionGuard feature="portfolioManagement">
              <AdvancedPortfolio />
            </SubscriptionGuard>
          </div>
        </div>
      </div>
    </div>
  );
}