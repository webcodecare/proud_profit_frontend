import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Crown, 
  Shield, 
  Star,
  TrendingUp,
  BarChart3,
  Zap,
  Activity
} from "lucide-react";

const demoAccounts = [
  {
    email: "demo@free.com",
    password: "demo123",
    tier: "free",
    name: "Free User",
    description: "Experience the basic features of our trading platform",
    icon: User,
    color: "bg-gray-500",
    features: ["Live Market Data", "Basic Charts", "Limited Signals"]
  },
  {
    email: "demo@premium.com", 
    password: "demo123",
    tier: "premium",
    name: "Premium User",
    description: "Explore advanced analytics and premium features",
    icon: Star,
    color: "bg-blue-500",
    features: ["Advanced Charts", "Premium Signals", "Heatmap Analysis", "Email Alerts"]
  },
  {
    email: "demo@pro.com",
    password: "demo123",
    tier: "pro", 
    name: "Pro User",
    description: "Full access to all professional trading tools",
    icon: Crown,
    color: "bg-purple-500",
    features: ["All Features", "Cycle Forecasting", "API Access", "Priority Support"]
  },
  {
    email: "admin@demo.com",
    password: "admin123",
    tier: "admin",
    name: "Admin Demo",
    description: "Administrative access to platform management",
    icon: Shield,
    color: "bg-red-500", 
    features: ["User Management", "Signal Logs", "System Analytics", "Admin Panel"]
  }
];

export default function Demo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-4">
            🎯 Proud Profits Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience our advanced cryptocurrency trading analytics platform with pre-populated demo accounts. 
            Choose your experience level and explore all features with live data!
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 mx-auto w-fit mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-green-800 dark:text-green-100">Live Market Data</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">Real-time crypto prices</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-800/30">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 mx-auto w-fit mb-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-yellow-800 dark:text-yellow-100">Trading Signals</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">AI-powered buy/sell alerts</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-800/30">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 mx-auto w-fit mb-3">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-blue-800 dark:text-blue-100">Advanced Charts</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">Professional analysis tools</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/30 dark:to-pink-800/30">
            <CardContent className="p-6 text-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 mx-auto w-fit mb-3">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-purple-800 dark:text-purple-100">Analytics</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">Market insights & forecasting</p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Accounts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {demoAccounts.map((account) => {
            const IconComponent = account.icon;
            return (
              <Card key={account.email} className="border-2 hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-xl ${account.color} shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {account.name}
                        <Badge className={`${account.color} text-white border-0`}>
                          {account.tier.toUpperCase()}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400 font-medium">
                        {account.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Login Credentials */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Demo Credentials</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Email</span>
                        <p className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                          {account.email}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Password</span>
                        <p className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                          {account.password}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Available Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {account.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Login Button */}
                  <Link href="/auth">
                    <Button className={`w-full ${account.color} hover:opacity-90 text-white font-semibold shadow-lg`}>
                      Login as {account.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            All demo accounts come pre-loaded with sample trading data and signals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="font-semibold">
                View Pricing Plans
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold">
                Explore Platform
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}