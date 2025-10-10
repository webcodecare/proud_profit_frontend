import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";

export default function AdvancedAlertsSimple() {
  const { user } = useAuth();

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
                <Bell className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Advanced Alert System</h1>
              </div>
              <Badge variant="outline" className="text-emerald-400">
                Multi-Channel Alerts
              </Badge>
            </div>
          </header>

          {/* Alert Content */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Email Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Price Alerts</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Signal Alerts</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Market News</span>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SMS Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    SMS Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Critical Signals</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Price Movements</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Account Alerts</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Telegram Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Telegram Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Live Signals</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Portfolio Updates</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Daily Summary</span>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <span className="font-medium">BTC Price Alert</span>
                      <p className="text-sm text-muted-foreground">Price reached $70,000</p>
                    </div>
                    <Badge variant="outline">5 min ago</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <span className="font-medium">ETH Buy Signal</span>
                      <p className="text-sm text-muted-foreground">Strong buy signal detected</p>
                    </div>
                    <Badge variant="outline">15 min ago</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div>
                      <span className="font-medium">Portfolio Update</span>
                      <p className="text-sm text-muted-foreground">Daily performance summary</p>
                    </div>
                    <Badge variant="outline">1 hour ago</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}