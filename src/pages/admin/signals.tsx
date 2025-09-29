import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SessionManager } from "@/lib/sessionManager";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Activity, 
  Plus, 
  Send,
  TrendingUp,
  TrendingDown,
  Clock,
  Filter
} from "lucide-react";

interface Signal {
  id: string;
  userId: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: string;
  timestamp: string;
  source: string;
  note?: string;
  createdAt: string;
}

interface SignalForm {
  ticker: string;
  signalType: "buy" | "sell";
  price: number;
  timeframe: string;
  note: string;
}

export default function AdminSignals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const [isSignalDialogOpen, setIsSignalDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all");
  const [filterTicker, setFilterTicker] = useState("all");
  const [signalForm, setSignalForm] = useState<SignalForm>({
    ticker: "",
    signalType: "buy",
    price: 0,
    timeframe: "1H",
    note: "",
  });

  const authToken = SessionManager.getToken();

  const { data: signalsResponse, isLoading: isLoadingSignals } = useQuery({
    queryKey: ["/api/admin/signals"],
    queryFn: async () => {
      const response = await fetch("/api/admin/signals?limit=100", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch signals");
      return await response.json();
    },
  });

  const signals = signalsResponse?.signals || [];

  const { data: tickers } = useQuery({
    queryKey: ["/api/admin/tickers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/tickers", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch tickers");
      return await response.json();
    },
  });

  const createSignalMutation = useMutation({
    mutationFn: async (signal: SignalForm) => {
      const signalData = {
        symbol: signal.ticker,
        signalType: signal.signalType,
        price: signal.price,
        timeframe: signal.timeframe,
        notes: signal.note || null
      };
      
      const response = await fetch("/api/admin/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(signalData),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error:", response.status, errorData);
        throw new Error(`Failed to create signal: ${response.status} ${errorData}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/signals"] });
      setSignalForm({ ticker: "", signalType: "buy", price: 0, timeframe: "1H", note: "" });
      setIsSignalDialogOpen(false);
      toast({ title: "Signal created successfully" });
    },
    onError: (error: any) => {
      console.error("Signal creation error:", error);
      toast({ 
        title: "Failed to create signal", 
        description: error.message || "Please check your inputs and try again",
        variant: "destructive" 
      });
    },
  });

  const filteredSignals = signals?.filter((signal: Signal) => {
    const typeMatch = filterType === "all" || signal.signalType === filterType;
    const tickerMatch = filterTicker === "all" || signal.ticker === filterTicker;
    return typeMatch && tickerMatch;
  });

  const signalStats = {
    total: signals?.length || 0,
    buy: signals?.filter((s: Signal) => s.signalType === "buy").length || 0,
    sell: signals?.filter((s: Signal) => s.signalType === "sell").length || 0,
    today: signals?.filter((s: Signal) => 
      new Date(s.timestamp).toDateString() === new Date().toDateString()
    ).length || 0,
  };

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
                <Activity className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Signal Logs</h1>
              </div>
              <Dialog open={isSignalDialogOpen} onOpenChange={setIsSignalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="crypto-gradient text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Create Signal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Trading Signal</DialogTitle>
                    <DialogDescription>
                      Manually inject a trading signal to all subscribers
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticker">Ticker</Label>
                      <Select
                        value={signalForm.ticker}
                        onValueChange={(value) => setSignalForm({ ...signalForm, ticker: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ticker" />
                        </SelectTrigger>
                        <SelectContent>
                          {tickers?.map((ticker: any) => (
                            <SelectItem key={ticker.id} value={ticker.symbol}>
                              {ticker.symbol} - {ticker.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signalType">Signal Type</Label>
                      <Select
                        value={signalForm.signalType}
                        onValueChange={(value: "buy" | "sell") => 
                          setSignalForm({ ...signalForm, signalType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy</SelectItem>
                          <SelectItem value="sell">Sell</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={signalForm.price || ""}
                        onChange={(e) => setSignalForm({ ...signalForm, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeframe">Timeframe</Label>
                      <Select
                        value={signalForm.timeframe}
                        onValueChange={(value) => setSignalForm({ ...signalForm, timeframe: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30M">30 Minutes</SelectItem>
                          <SelectItem value="1H">1 Hour</SelectItem>
                          <SelectItem value="4H">4 Hours</SelectItem>
                          <SelectItem value="8H">8 Hours</SelectItem>
                          <SelectItem value="12H">12 Hours</SelectItem>
                          <SelectItem value="1D">1 Day</SelectItem>
                          <SelectItem value="1W">1 Week</SelectItem>
                          <SelectItem value="1M">1 Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note">Note (Optional)</Label>
                      <Input
                        id="note"
                        value={signalForm.note}
                        onChange={(e) => setSignalForm({ ...signalForm, note: e.target.value })}
                        placeholder="Additional information..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSignalDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log("Creating signal with data:", signalForm);
                        createSignalMutation.mutate(signalForm);
                      }}
                      disabled={createSignalMutation.isPending || !signalForm.ticker || !signalForm.price}
                      className="crypto-gradient text-white"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Signal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Signals Content */}
          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Signals</p>
                      <p className="text-2xl font-bold">{signalStats.total}</p>
                    </div>
                    <Activity className="h-8 w-8 text-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Buy Signals</p>
                      <p className="text-2xl font-bold text-emerald-400">{signalStats.buy}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sell Signals</p>
                      <p className="text-2xl font-bold text-red-400">{signalStats.sell}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today</p>
                      <p className="text-2xl font-bold text-blue-400">{signalStats.today}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="mr-2 h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="space-y-2">
                    <Label>Signal Type</Label>
                    <Select value={filterType} onValueChange={(value: "all" | "buy" | "sell") => setFilterType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ticker</Label>
                    <Select value={filterTicker} onValueChange={setFilterTicker}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tickers</SelectItem>
                        {tickers?.map((ticker: any) => (
                          <SelectItem key={ticker.id} value={ticker.symbol}>
                            {ticker.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signals Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSignals ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading signals...
                        </TableCell>
                      </TableRow>
                    ) : filteredSignals?.map((signal: Signal) => (
                      <TableRow key={signal.id}>
                        <TableCell className="font-semibold">{signal.ticker}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={signal.signalType === "buy" ? "default" : "destructive"}
                            className={signal.signalType === "buy" ? "bg-emerald-500" : "bg-red-500"}
                          >
                            {signal.signalType === "buy" ? (
                              <><TrendingUp className="mr-1 h-3 w-3" /> BUY</>
                            ) : (
                              <><TrendingDown className="mr-1 h-3 w-3" /> SELL</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">${signal.price}</TableCell>
                        <TableCell>{new Date(signal.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{signal.source}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {signal.note || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}