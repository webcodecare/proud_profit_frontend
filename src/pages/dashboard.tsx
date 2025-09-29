
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AuthGuard from "@/components/auth/AuthGuard";
import SubscriptionDashboard from "@/components/dashboard/SubscriptionDashboard";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />
          
          {/* Main Content */}
          <div className="w-full ml-0 lg:ml-64 flex-1 bg-background">
            {/* Top Bar */}
            <TopBar
              title={`Trading Dashboard - ${user?.subscriptionTier?.toUpperCase() || "FREE"} TIER`}
              onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              showMobileMenu={isMobileMenuOpen}
            />

            {/* Subscription-Based Dashboard */}
            <SubscriptionDashboard />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}