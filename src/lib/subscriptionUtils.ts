export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: "elite";
  monthlyPrice: number;
  yearlyPrice?: number;
  features: string[];
  maxSignals: number;
  maxTickers: number;
  isActive: boolean;
}

export interface FeatureAccess {
  // Core Features
  basicSignals: boolean;
  premiumSignals: boolean;
  realTimeAlerts: boolean;

  // Dashboard Features
  trading_dashboard: boolean;

  // Chart Features
  basicCharts: boolean;
  advancedCharts: boolean;
  heatmapAnalysis: boolean;
  cycleForecasting: boolean;
  tradingPlayground: boolean;

  // Alert Features
  emailAlerts: boolean;
  smsAlerts: boolean;
  telegramAlerts: boolean;
  pushNotifications: boolean;
  advancedAlerts: boolean;
  multiChannelAlerts: boolean;

  // Ticker Limits
  maxTickers: number;
  maxSignalsPerMonth: number;

  // Analytics Features
  advancedAnalytics: boolean;
  historicalData: boolean;
  liveStreaming: boolean;

  // Admin Features
  adminAccess: boolean;

  // Premium Features
  apiAccess: boolean;
  prioritySupport: boolean;
  customIndicators: boolean;
  whiteLabel: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<string, FeatureAccess> = {
  // Free tier - basic access
  free: {
    // Core Features - Basic access
    basicSignals: true,
    premiumSignals: false,
    realTimeAlerts: true,

    // Dashboard Features - Basic access
    trading_dashboard: true,

    // Chart Features - Basic access
    basicCharts: true,
    advancedCharts: false,
    heatmapAnalysis: false,
    cycleForecasting: false,
    tradingPlayground: true,

    // Alert Features - Basic access
    emailAlerts: true,
    smsAlerts: false,
    telegramAlerts: false,
    pushNotifications: true,
    advancedAlerts: false,
    multiChannelAlerts: false,

    // Ticker Limits - Limited
    maxTickers: 3,
    maxSignalsPerMonth: 50,

    // Analytics Features - Basic
    advancedAnalytics: false,
    historicalData: true,
    liveStreaming: false,

    // Admin Features
    adminAccess: false,

    // Premium Features - No access
    apiAccess: false,
    prioritySupport: false,
    customIndicators: false,
    whiteLabel: false,
  },

  // Basic tier
  basic: {
    // Core Features
    basicSignals: true,
    premiumSignals: true,
    realTimeAlerts: true,

    // Dashboard Features
    trading_dashboard: true,

    // Chart Features
    basicCharts: true,
    advancedCharts: true,
    heatmapAnalysis: false,
    cycleForecasting: false,
    tradingPlayground: true,

    // Alert Features
    emailAlerts: true,
    smsAlerts: true,
    telegramAlerts: false,
    pushNotifications: true,
    advancedAlerts: false,
    multiChannelAlerts: false,

    // Ticker Limits
    maxTickers: 10,
    maxSignalsPerMonth: 200,

    // Analytics Features
    advancedAnalytics: false,
    historicalData: true,
    liveStreaming: false,

    // Admin Features
    adminAccess: false,

    // Premium Features
    apiAccess: false,
    prioritySupport: false,
    customIndicators: false,
    whiteLabel: false,
  },

  // Premium tier
  premium: {
    // Core Features
    basicSignals: true,
    premiumSignals: true,
    realTimeAlerts: true,

    // Dashboard Features
    trading_dashboard: true,

    // Chart Features
    basicCharts: true,
    advancedCharts: true,
    heatmapAnalysis: true,
    cycleForecasting: true,
    tradingPlayground: true,

    // Alert Features
    emailAlerts: true,
    smsAlerts: true,
    telegramAlerts: true,
    pushNotifications: true,
    advancedAlerts: true,
    multiChannelAlerts: false,

    // Ticker Limits
    maxTickers: 25,
    maxSignalsPerMonth: 500,

    // Analytics Features
    advancedAnalytics: true,
    historicalData: true,
    liveStreaming: true,

    // Admin Features
    adminAccess: false,

    // Premium Features
    apiAccess: false,
    prioritySupport: true,
    customIndicators: true,
    whiteLabel: false,
  },

  // Pro tier - advanced access
  pro: {
    // Core Features - FULL ACCESS
    basicSignals: true,
    premiumSignals: true,
    realTimeAlerts: true,

    // Dashboard Features - FULL ACCESS
    trading_dashboard: true,

    // Chart Features - FULL ACCESS
    basicCharts: true,
    advancedCharts: true,
    heatmapAnalysis: true,
    cycleForecasting: true,
    tradingPlayground: true,

    // Alert Features - FULL ACCESS
    emailAlerts: true,
    smsAlerts: true,
    telegramAlerts: true,
    pushNotifications: true,
    advancedAlerts: true,
    multiChannelAlerts: true,

    // Ticker Limits - HIGH LIMITS
    maxTickers: -1, // Unlimited
    maxSignalsPerMonth: -1, // Unlimited

    // Analytics Features - FULL ACCESS
    advancedAnalytics: true,
    historicalData: true,
    liveStreaming: true,

    // Admin Features
    adminAccess: false,

    // Premium Features - MOST ACCESS
    apiAccess: true,
    prioritySupport: true,
    customIndicators: true,
    whiteLabel: false, // Only Elite has white label
  },

  // Elite tier - full access to everything
  elite: {
    // Core Features - FULL ACCESS
    basicSignals: true,
    premiumSignals: true,
    realTimeAlerts: true,

    // Dashboard Features - FULL ACCESS
    trading_dashboard: true,

    // Chart Features - FULL ACCESS
    basicCharts: true,
    advancedCharts: true,
    heatmapAnalysis: true,
    cycleForecasting: true,
    tradingPlayground: true,

    // Alert Features - FULL ACCESS
    emailAlerts: true,
    smsAlerts: true,
    telegramAlerts: true,
    pushNotifications: true,
    advancedAlerts: true,
    multiChannelAlerts: true,

    // Ticker Limits - UNLIMITED
    maxTickers: -1, // Unlimited
    maxSignalsPerMonth: -1, // Unlimited

    // Analytics Features - FULL ACCESS
    advancedAnalytics: true,
    historicalData: true,
    liveStreaming: true,

    // Admin Features
    adminAccess: false,

    // Premium Features - FULL ACCESS
    apiAccess: true,
    prioritySupport: true,
    customIndicators: true,
    whiteLabel: true,
  },
};

export function getFeatureAccess(
  subscriptionTier: string | null = "free"
): FeatureAccess {
  // Return appropriate feature access based on subscription tier
  if (subscriptionTier === "elite") {
    return SUBSCRIPTION_FEATURES.elite;
  } else if (subscriptionTier === "pro") {
    return SUBSCRIPTION_FEATURES.pro;
  } else if (subscriptionTier === "premium") {
    return SUBSCRIPTION_FEATURES.premium;
  } else if (subscriptionTier === "basic") {
    return SUBSCRIPTION_FEATURES.basic;
  } else {
    return SUBSCRIPTION_FEATURES.free; // Default to free tier
  }
}

export function hasAccess(
  userTier: string | null = "free",
  requiredFeature: keyof FeatureAccess
): boolean {
  // Get feature access for user's tier
  const access = getFeatureAccess(userTier);
  const hasFeature = Boolean(access[requiredFeature]);

  return hasFeature;
}

export function getUpgradeMessage(feature: string): string {
  const upgradeMessages: Record<string, string> = {
    premiumSignals: "Upgrade to Elite plan to access premium trading signals",
    advancedCharts: "Upgrade to Elite plan to unlock advanced chart features",
    heatmapAnalysis: "Upgrade to Elite plan to view 200-week heatmap analysis",
    cycleForecasting: "Upgrade to Elite plan to access cycle forecasting",
    smsAlerts: "Upgrade to Elite plan to enable SMS alerts",
    telegramAlerts: "Upgrade to Elite plan to enable Telegram notifications",
    advancedAlerts: "Upgrade to Elite plan to create advanced alert conditions",
    advancedAnalytics: "Upgrade to Elite plan to unlock advanced analytics",
    apiAccess: "Upgrade to Elite plan to access API features",
    customIndicators: "Upgrade to Elite plan to create custom indicators",
    whiteLabel: "Upgrade to Elite plan for white-label solutions",
    realTimeAlerts: "Upgrade to Elite plan to access real-time alerts",
    trading_dashboard: "Upgrade to Elite plan to access the trading dashboard",
    basicSignals: "Upgrade to Elite plan to access trading signals",
  };

  return (
    upgradeMessages[feature] || "Upgrade to Elite plan to access this feature"
  );
}

export function getPlanBadgeColor(tier: string | null | undefined): string {
  const colors: Record<string, string> = {
    elite:
      "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold",
    none: "bg-gray-500 text-white",
  };

  return tier === "elite" ? colors.elite : colors.none;
}
