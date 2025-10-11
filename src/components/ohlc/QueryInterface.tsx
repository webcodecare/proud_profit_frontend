import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, RefreshCw } from "lucide-react";

interface QueryInterfaceProps {
  symbol: string;
  setSymbol: (value: string) => void;
  interval: string;
  setInterval: (value: string) => void;
  limit: number;
  setLimit: (value: number) => void;
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
  queryParams: string;
  availableTickers: any[];
  intervals: Array<{value: string, label: string}>;
  handleQuery: () => void;
  refetch: () => void;
  isLoading: boolean;
}

export default function QueryInterface({
  symbol, setSymbol, interval, setInterval, limit, setLimit,
  startTime, setStartTime, endTime, setEndTime, queryParams,
  availableTickers, intervals, handleQuery, refetch, isLoading
}: QueryInterfaceProps) {
  return (
    <Card className="p-3 sm:p-4">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-sm sm:text-base">OHLC Data Query</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Query historical OHLC data with cache-first strategy and Binance fallback
        </p>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="symbol" className="text-xs sm:text-sm">Symbol</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTickers?.filter((t: any) => t.enabled).map((ticker: any) => (
                  <SelectItem key={ticker.symbol} value={ticker.symbol}>
                    {ticker.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="interval" className="text-xs sm:text-sm">Interval</Label>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervals.map(int => (
                  <SelectItem key={int.value} value={int.value}>
                    {int.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="limit" className="text-xs sm:text-sm">Limit (max 5000)</Label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Math.min(5000, parseInt(e.target.value) || 100))}
              min="1"
              max="5000"
              className="text-xs sm:text-sm"
            />
          </div>
          
          <div className="sm:col-span-2 lg:col-span-1">
            <Label htmlFor="startTime" className="text-xs sm:text-sm">Start Time (Optional)</Label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="text-xs sm:text-sm"
            />
          </div>
          
          <div className="sm:col-span-2 lg:col-span-1">
            <Label htmlFor="endTime" className="text-xs sm:text-sm">End Time (Optional)</Label>
            <Input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="text-xs sm:text-sm"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleQuery} disabled={isLoading} className="flex-1 sm:flex-none text-xs sm:text-sm">
            {isLoading ? (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            )}
            Query OHLC Data
          </Button>
          
          <Button variant="outline" onClick={() => refetch()} className="flex-1 sm:flex-none text-xs sm:text-sm">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* API URL Display */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-xs font-mono break-all">
            GET /api/ohlc{queryParams}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}