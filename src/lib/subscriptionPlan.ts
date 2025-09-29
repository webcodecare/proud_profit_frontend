// Subscription Plan Definitions and Feature Controls
export interface SubscriptionFeatures {
  // Chart Features
  maxTickers: number; // -1 for unlimited
  advancedCharts: boolean;
  realTimeData: boolean;
  historicalData: boolean;
  customTimeframes: boolean;
  
  // Signal Features
  maxSignalsPerDay: number; // -1 for unlimited
  buySellSignals: boolean;
  advancedSignals: boolean;
  customAlerts: boolean;
  webhookAlerts: boolean;
  
  // Analytics Features
  heatmapAnalyzer: boolean;
  cycleForecasting: boolean;
  volatilityAnalysis: boolean;
  technicalIndicators: boolean;
  portfolioTracking: boolean;
  
  // Communication Features
  emailNotifications: boolean;
  smsNotifications: boolean;
  telegramAlerts: boolean;
  discordWebhooks: boolean;
  
  // Premium Features
  prioritySupport: boolean;
  advancedBacktesting: boolean;
  apiAccess: boolean;
  whitelabelAccess: boolean;
  customStrategies: boolean;
}

export interface SubscriptionPlanConfig {
  id: string;
  name: string;
  tier: "free" | "basic" | "premium" | "pro" | "elite";
  monthlyPrice: number;
  yearlyPrice: number;
  features: SubscriptionFeatures;
  description: string;
  color: "slate" | "blue" | "orange" | "gold" | "purple";
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
  {
    id: "free",
    name: "Free Tier",
    tier: "free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Get started with basic crypto analytics",
    color: "slate",
    features: {
      maxTickers: 3,
      advancedCharts: false,
      realTimeData: true,
      historicalData: false,
      customTimeframes: false,
      maxSignalsPerDay: 5,
      buySellSignals: true,
      advancedSignals: false,
      customAlerts: false,
      webhookAlerts: false,
      heatmapAnalyzer: false,
      cycleForecasting: false,
      volatilityAnalysis: false,
      technicalIndicators: false,
      portfolioTracking: false,
      emailNotifications: true,
      smsNotifications: false,
      telegramAlerts: false,
      discordWebhooks: false,
      prioritySupport: false,
      advancedBacktesting: false,
      apiAccess: false,
      whitelabelAccess: false,
      customStrategies: false,
    },
  },
  {
    id: "basic",
    name: "Basic Plan",
    tier: "basic",
    monthlyPrice: 2999, // $29.99
    yearlyPrice: 29999, // $299.99 
    description: "Essential tools for serious traders",
    color: "blue",
    features: {
      maxTickers: 5,
      advancedCharts: false,
      realTimeData: true,
      historicalData: false,
      customTimeframes: false,
      maxSignalsPerDay: 50,
      buySellSignals: true,
      advancedSignals: false,
      customAlerts: true,
      webhookAlerts: false,
      heatmapAnalyzer: false, // BASIC PLAN CANNOT ACCESS HEATMAP ANALYZER
      cycleForecasting: false,
      volatilityAnalysis: false,
      technicalIndicators: false,
      portfolioTracking: false,
      emailNotifications: true,
      smsNotifications: false,
      telegramAlerts: false,
      discordWebhooks: false,
      prioritySupport: false,
      advancedBacktesting: false,
      apiAccess: false,
      whitelabelAccess: false,
      customStrategies: false,
    },
  },
  {
    id: "premium",
    name: "Premium Plan",
    tier: "premium",
    monthlyPrice: 5999, // $59.99
    yearlyPrice: 59999, // $599.99
    description: "Advanced analytics for professional traders",
    color: "orange",
    isPopular: true,
    features: {
      maxTickers: 25,
      advancedCharts: true,
      realTimeData: true,
      historicalData: true,
      customTimeframes: true,
      maxSignalsPerDay: 200,
      buySellSignals: true,
      advancedSignals: true,
      customAlerts: true,
      webhookAlerts: true,
      heatmapAnalyzer: true,
      cycleForecasting: true,
      volatilityAnalysis: true,
      technicalIndicators: true,
      portfolioTracking: true,
      emailNotifications: true,
      smsNotifications: true,
      telegramAlerts: true,
      discordWebhooks: true,
      prioritySupport: true,
      advancedBacktesting: true,
      apiAccess: false,
      whitelabelAccess: false,
      customStrategies: true,
    },
  },
  {
    id: "pro",
    name: "Pro Plan",
    tier: "pro",
    monthlyPrice: 9999, // $99.99
    yearlyPrice: 99999, // $999.99
    description: "Complete toolkit for institutional traders",
    color: "gold",
    features: {
      maxTickers: -1, // unlimited
      advancedCharts: true,
      realTimeData: true,
      historicalData: true,
      customTimeframes: true,
      maxSignalsPerDay: -1, // unlimited
      buySellSignals: true,
      advancedSignals: true,
      customAlerts: true,
      webhookAlerts: true,
      heatmapAnalyzer: true,
      cycleForecasting: true,
      volatilityAnalysis: true,
      technicalIndicators: true,
      portfolioTracking: true,
      emailNotifications: true,
      smsNotifications: true,
      telegramAlerts: true,
      discordWebhooks: true,
      prioritySupport: true,
      advancedBacktesting: true,
      apiAccess: true,
      whitelabelAccess: false,
      customStrategies: true,
    },
  },
  {
    id: "elite",
    name: "Elite Plan",
    tier: "elite",
    monthlyPrice: 19999, // $199.99
    yearlyPrice: 199999, // $1999.99
    description: "White-label solution for trading firms",
    color: "purple",
    features: {
      maxTickers: -1, // unlimited
      advancedCharts: true,
      realTimeData: true,
      historicalData: true,
      customTimeframes: true,
      maxSignalsPerDay: -1, // unlimited
      buySellSignals: true,
      advancedSignals: true,
      customAlerts: true,
      webhookAlerts: true,
      heatmapAnalyzer: true,
      cycleForecasting: true,
      volatilityAnalysis: true,
      technicalIndicators: true,
      portfolioTracking: true,
      emailNotifications: true,
      smsNotifications: true,
      telegramAlerts: true,
      discordWebhooks: true,
      prioritySupport: true,
      advancedBacktesting: true,
      apiAccess: true,
      whitelabelAccess: true,
      customStrategies: true,
    },
  },
];

// Subscription utility functions
export class SubscriptionManager {
  static getPlanConfig(tier: string): SubscriptionPlanConfig | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.tier === tier);
  }

  static getFeatures(tier: string): SubscriptionFeatures {
    const plan = this.getPlanConfig(tier);
    return plan?.features || SUBSCRIPTION_PLANS[0].features; // fallback to free
  }

  static hasFeature(userTier: string, feature: keyof SubscriptionFeatures): boolean {
    const features = this.getFeatures(userTier);
    return features[feature] as boolean;
  }

  static canAccessTicker(userTier: string, currentTickerCount: number): boolean {
    const features = this.getFeatures(userTier);
    return features.maxTickers === -1 || currentTickerCount < features.maxTickers;
  }

  static canCreateSignal(userTier: string, dailySignalCount: number): boolean {
    const features = this.getFeatures(userTier);
    return features.maxSignalsPerDay === -1 || dailySignalCount < features.maxSignalsPerDay;
  }

  static getUpgradeMessage(feature: keyof SubscriptionFeatures): string {
    const messages: Record<keyof SubscriptionFeatures, string> = {
      maxTickers: "Upgrade to access more tickers",
      advancedCharts: "Upgrade to unlock advanced chart features",
      realTimeData: "Upgrade for real-time data access",
      historicalData: "Upgrade to access historical data",
      customTimeframes: "Upgrade for custom timeframe options",
      maxSignalsPerDay: "Upgrade to receive more daily signals",
      buySellSignals: "Upgrade to access buy/sell signals",
      advancedSignals: "Upgrade for advanced signal analytics",
      customAlerts: "Upgrade to create custom alerts",
      webhookAlerts: "Upgrade for webhook integration",
      heatmapAnalyzer: "Upgrade to access heatmap analyzer",
      cycleForecasting: "Upgrade for cycle forecasting tools",
      volatilityAnalysis: "Upgrade for volatility analysis",
      technicalIndicators: "Upgrade to access technical indicators",
      portfolioTracking: "Upgrade for portfolio tracking",
      emailNotifications: "Upgrade for email notifications",
      smsNotifications: "Upgrade for SMS alerts",
      telegramAlerts: "Upgrade for Telegram notifications",
      discordWebhooks: "Upgrade for Discord integration",
      prioritySupport: "Upgrade for priority customer support",
      advancedBacktesting: "Upgrade for advanced backtesting",
      apiAccess: "Upgrade for API access",
      whitelabelAccess: "Upgrade for white-label solution",
      customStrategies: "Upgrade for custom strategy builder",
    };

    return messages[feature] || "Upgrade for premium features";
  }

  static getPlanBadgeColor(tier: string): string {
    const plan = this.getPlanConfig(tier);
    if (!plan) return "slate";

    const colorMap = {
      slate: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      orange: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };

    return colorMap[plan.color] || colorMap.slate;
  }
}