import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import { sendNotificationsForSignal } from '@/services/notificationService';
import { Mail, MessageSquare, Send, Bell } from 'lucide-react';

export default function TestNotifications() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    ticker: 'BTCUSDT',
    price: 45000,
    signalType: 'buy' as 'buy' | 'sell',
    timeframe: '1H',
    note: 'Test signal from notification tester'
  });

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing notification with data:', testData);
      
      const results = await sendNotificationsForSignal(testData);
      
      toast({
        title: "✅ Test Notifications Sent!",
        description: `Sent ${results?.length || 0} notifications to users`,
      });
    } catch (error) {
      console.error('Test notification error:', error);
      toast({
        title: "❌ Test Failed",
        description: error instanceof Error ? error.message : 'Failed to send test notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        
        <div className="ml-0 md:ml-64 flex-1">
          <header className="bg-card border-b border-border p-6">
            <h1 className="text-2xl font-bold">🧪 Test Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Test the notification system with custom signal data
            </p>
          </header>

          <main className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🔧 Notification Channels Configured</CardTitle>
                <CardDescription>All channels are ready to send notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                    <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Email</h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300">SMTP Ready</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                    <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">SMS</h3>
                    <p className="text-xs text-green-700 dark:text-green-300">Twilio Ready</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                    <Send className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Telegram</h3>
                    <p className="text-xs text-purple-700 dark:text-purple-300">Bot Ready</p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg text-center">
                    <Bell className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">Push</h3>
                    <p className="text-xs text-orange-700 dark:text-orange-300">Browser Ready</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Signal Data</CardTitle>
                <CardDescription>Configure test signal to send notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ticker Symbol</Label>
                    <Input
                      value={testData.ticker}
                      onChange={(e) => setTestData({ ...testData, ticker: e.target.value })}
                      placeholder="e.g., BTCUSDT"
                    />
                  </div>
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      value={testData.price}
                      onChange={(e) => setTestData({ ...testData, price: parseFloat(e.target.value) })}
                      placeholder="e.g., 45000"
                    />
                  </div>
                  <div>
                    <Label>Signal Type</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={testData.signalType}
                      onChange={(e) => setTestData({ ...testData, signalType: e.target.value as 'buy' | 'sell' })}
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                  <div>
                    <Label>Timeframe</Label>
                    <Input
                      value={testData.timeframe}
                      onChange={(e) => setTestData({ ...testData, timeframe: e.target.value })}
                      placeholder="e.g., 1H, 4H, 1D"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Note (Optional)</Label>
                    <Input
                      value={testData.note}
                      onChange={(e) => setTestData({ ...testData, note: e.target.value })}
                      placeholder="Additional message..."
                    />
                  </div>
                </div>

                <Button
                  onClick={handleTestNotification}
                  disabled={loading}
                  className="w-full crypto-gradient text-white"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test Notifications
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-yellow-900 dark:text-yellow-100">⚠️ Important Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                <p><strong>1. User Settings Required:</strong> Notifications will only be sent to users who have:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Enabled notification preferences in user_settings table</li>
                  <li>Valid contact information (email, phone, telegram chat ID)</li>
                </ul>
                <p><strong>2. Check Console:</strong> Open browser DevTools → Console to see notification attempts</p>
                <p><strong>3. Database Check:</strong> Notifications require users in the database with proper settings</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
