import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  statusCode?: number;
  response?: any;
  error?: string;
}

export default function ApiTester() {
  const { toast } = useToast();
  const [authToken, setAuthToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Login credentials
  const [loginEmail, setLoginEmail] = useState('admin@proudprofits.com');
  const [loginPassword, setLoginPassword] = useState('admin123');

  // Ticker test data
  const [tickerSymbol, setTickerSymbol] = useState('BTCUSDT');
  const [tickerDescription, setTickerDescription] = useState('Bitcoin');

  // Signal test data
  const [signalData, setSignalData] = useState({
    symbol: 'BTCUSDT',
    timeframe: '4H',
    signalType: 'buy',
    price: '45000.50',
    entryPrice: '45000.50',
    stopLoss: '44000.00',
    takeProfit: '47000.00',
    confidence: 85,
    notes: 'Test signal from admin panel'
  });

  const API_BASE = 'https://crypto-kings-backend.vercel.app';

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const handleLogin = async () => {
    setLoading(true);
    const testResult: TestResult = {
      endpoint: 'POST /api/auth/login',
      status: 'pending'
    };

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        setAuthToken(data.token);
        setIsLoggedIn(true);
        localStorage.setItem('auth_token', data.token);
        
        testResult.status = 'success';
        testResult.statusCode = response.status;
        testResult.response = data;
        
        toast({
          title: "Login Successful",
          description: `Logged in as ${data.user.email} (Role: ${data.user.role})`
        });
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      testResult.status = 'error';
      testResult.error = error.message;
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    }

    addResult(testResult);
    setLoading(false);
  };

  const testGetTickers = async () => {
    setLoading(true);
    const testResult: TestResult = {
      endpoint: 'GET /api/admin/tickers',
      status: 'pending'
    };

    try {
      const response = await fetch(`${API_BASE}/api/admin/tickers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        testResult.status = 'success';
        testResult.statusCode = response.status;
        testResult.response = data;
        
        toast({
          title: "Success",
          description: `Retrieved ${data.tickers?.length || 0} tickers from database`
        });
      } else {
        throw new Error(data.message || 'Failed to fetch tickers');
      }
    } catch (error: any) {
      testResult.status = 'error';
      testResult.error = error.message;
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }

    addResult(testResult);
    setLoading(false);
  };

  const testCreateTicker = async () => {
    setLoading(true);
    const testResult: TestResult = {
      endpoint: 'POST /api/admin/tickers',
      status: 'pending'
    };

    try {
      const response = await fetch(`${API_BASE}/api/admin/tickers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: tickerSymbol,
          description: tickerDescription,
          category: 'cryptocurrency',
          is_enabled: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        testResult.status = 'success';
        testResult.statusCode = response.status;
        testResult.response = data;
        
        toast({
          title: "Ticker Created in Supabase!",
          description: `${tickerSymbol} successfully stored in database`
        });
      } else {
        throw new Error(data.message || 'Failed to create ticker');
      }
    } catch (error: any) {
      testResult.status = 'error';
      testResult.error = error.message;
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }

    addResult(testResult);
    setLoading(false);
  };

  const testCreateSignal = async () => {
    setLoading(true);
    const testResult: TestResult = {
      endpoint: 'POST /api/admin/signals',
      status: 'pending'
    };

    try {
      const response = await fetch(`${API_BASE}/api/admin/signals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: signalData.symbol,
          timeframe: signalData.timeframe,
          signal_type: signalData.signalType,
          price: parseFloat(signalData.price),
          entry_price: parseFloat(signalData.entryPrice),
          stop_loss: parseFloat(signalData.stopLoss),
          take_profit: parseFloat(signalData.takeProfit),
          confidence: signalData.confidence,
          source: 'manual',
          notes: signalData.notes,
          is_active: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        testResult.status = 'success';
        testResult.statusCode = response.status;
        testResult.response = data;
        
        toast({
          title: "Signal Created in Supabase!",
          description: `${signalData.signalType.toUpperCase()} signal for ${signalData.symbol} stored in database`
        });
      } else {
        throw new Error(data.message || 'Failed to create signal');
      }
    } catch (error: any) {
      testResult.status = 'error';
      testResult.error = error.message;
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }

    addResult(testResult);
    setLoading(false);
  };

  const testGetPlans = async () => {
    setLoading(true);
    const testResult: TestResult = {
      endpoint: 'GET /api/subscription/plans',
      status: 'pending'
    };

    try {
      const response = await fetch(`${API_BASE}/api/subscription/plans`);
      const data = await response.json();

      if (response.ok) {
        testResult.status = 'success';
        testResult.statusCode = response.status;
        testResult.response = data;
        
        toast({
          title: "Success",
          description: `Retrieved ${data.plans?.length || 0} subscription plans from database`
        });
      } else {
        throw new Error(data.message || 'Failed to fetch plans');
      }
    } catch (error: any) {
      testResult.status = 'error';
      testResult.error = error.message;
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }

    addResult(testResult);
    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin API Tester</h1>
        <p className="text-muted-foreground">Test backend API endpoints and verify Supabase data storage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Section */}
        <Card>
          <CardHeader>
            <CardTitle>1. Admin Login</CardTitle>
            <CardDescription>Login to get authentication token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@proudprofits.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="admin123"
              />
            </div>
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login as Admin
            </Button>
            {isLoggedIn && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                ✅ Logged in successfully! Token stored.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticker Tests */}
        <Card>
          <CardHeader>
            <CardTitle>2. Test Tickers (Read)</CardTitle>
            <CardDescription>Fetch existing tickers from Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGetTickers} 
              disabled={!isLoggedIn || loading}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get All Tickers
            </Button>
            {!isLoggedIn && (
              <p className="text-sm text-muted-foreground mt-2">⚠️ Login first</p>
            )}
          </CardContent>
        </Card>

        {/* Create Ticker */}
        <Card>
          <CardHeader>
            <CardTitle>3. Test Create Ticker (Write)</CardTitle>
            <CardDescription>Add new ticker to Supabase database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tickerSymbol">Symbol</Label>
              <Input
                id="tickerSymbol"
                value={tickerSymbol}
                onChange={(e) => setTickerSymbol(e.target.value.toUpperCase())}
                placeholder="BTCUSDT"
              />
            </div>
            <div>
              <Label htmlFor="tickerDescription">Description</Label>
              <Input
                id="tickerDescription"
                value={tickerDescription}
                onChange={(e) => setTickerDescription(e.target.value)}
                placeholder="Bitcoin"
              />
            </div>
            <Button 
              onClick={testCreateTicker} 
              disabled={!isLoggedIn || loading}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Ticker in Supabase
            </Button>
            {!isLoggedIn && (
              <p className="text-sm text-muted-foreground">⚠️ Login first</p>
            )}
          </CardContent>
        </Card>

        {/* Create Signal */}
        <Card>
          <CardHeader>
            <CardTitle>4. Test Create Signal (Write)</CardTitle>
            <CardDescription>Add trading signal to Supabase database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="signalSymbol">Symbol</Label>
                <Input
                  id="signalSymbol"
                  value={signalData.symbol}
                  onChange={(e) => setSignalData({...signalData, symbol: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="signalTimeframe">Timeframe</Label>
                <Input
                  id="signalTimeframe"
                  value={signalData.timeframe}
                  onChange={(e) => setSignalData({...signalData, timeframe: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="entryPrice">Entry Price</Label>
                <Input
                  id="entryPrice"
                  value={signalData.entryPrice}
                  onChange={(e) => setSignalData({...signalData, entryPrice: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="stopLoss">Stop Loss</Label>
                <Input
                  id="stopLoss"
                  value={signalData.stopLoss}
                  onChange={(e) => setSignalData({...signalData, stopLoss: e.target.value})}
                />
              </div>
            </div>
            <Button 
              onClick={testCreateSignal} 
              disabled={!isLoggedIn || loading}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Signal in Supabase
            </Button>
            {!isLoggedIn && (
              <p className="text-sm text-muted-foreground">⚠️ Login first</p>
            )}
          </CardContent>
        </Card>

        {/* Get Plans */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>5. Test Subscription Plans (Public)</CardTitle>
            <CardDescription>Fetch subscription plans (no auth required)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGetPlans} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Subscription Plans
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Test Results</CardTitle>
              <Button variant="outline" size="sm" onClick={clearResults}>
                Clear Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success' ? 'bg-green-50 border-green-200' :
                    result.status === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {result.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                        <span className="font-semibold">{result.endpoint}</span>
                        {result.statusCode && (
                          <span className={`text-sm px-2 py-1 rounded ${
                            result.statusCode === 200 || result.statusCode === 201 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.statusCode}
                          </span>
                        )}
                      </div>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-2">Error: {result.error}</p>
                      )}
                      {result.response && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                            View Response
                          </summary>
                          <pre className="mt-2 p-3 bg-white rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.response, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>Step 1:</strong> Click "Login as Admin" with the provided credentials</p>
          <p><strong>Step 2:</strong> Test "Get All Tickers" to see existing data from Supabase</p>
          <p><strong>Step 3:</strong> Test "Create Ticker" to add new data to Supabase database</p>
          <p><strong>Step 4:</strong> Test "Create Signal" to verify trading signals storage</p>
          <p><strong>Step 5:</strong> Ask your backend developer to verify the data in Supabase dashboard</p>
          <p className="pt-2"><strong>✅ If all tests show green checkmarks, your Supabase integration is fully functional!</strong></p>
        </CardContent>
      </Card>
    </div>
  );
}
