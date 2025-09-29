import React from "react";
import HeatmapCycleAnalyzer from "@/components/charts/HeatmapCycleAnalyzer";

export default function TestHeatmap() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
          Heatmap Cycle Analyzer Test
        </h1>
        <HeatmapCycleAnalyzer />
      </div>
    </div>
  );
}