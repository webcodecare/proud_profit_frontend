import React from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import PaymentRequiredGuard from "@/components/auth/PaymentRequiredGuard";
import FeatureAccessGuard from "@/components/subscription/FeatureAccessGuard";
import HeatmapCycleAnalyzer from "@/components/charts/HeatmapCycleAnalyzer";

export default function HeatmapAnalysis() {
  const { user } = useAuth();

  return (
    <PaymentRequiredGuard featureName="Heatmap Cycle Analysis">
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />

          {/* Main Content */}
          <div className="w-full ml-0 md:ml-64 flex-1 bg-background">
            {/* Top Bar */}
            <TopBar
              title="Heatmap Cycle Analysis"
              onMobileMenuToggle={() => {}}
              showMobileMenu={false}
            />

            {/* Page Content */}
            <div className="p-3 sm:p-4 md:p-6">
              <FeatureAccessGuard
                requiredTier="pro"
                featureName="Advanced Heatmap Cycle Analysis"
                description="Access comprehensive cycle analysis with 200-week, yearly, and cyclical trend indicators for professional trading insights"
              >
                <HeatmapCycleAnalyzer />
              </FeatureAccessGuard>
            </div>
          </div>
        </div>
      </div>
    </PaymentRequiredGuard>
  );
}