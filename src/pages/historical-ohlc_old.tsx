import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Search, 
  RefreshCw, 
  Download,
  Activity
} from "lucide-react";

interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface OHLCResponse {
  symbol: string;
  interval: string;
  data: OHLCData[];
  count: number;
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

interface Ticker {
  id: string;
  symbol: string;
  description: string;
  isEnabled: boolean;
}

const INTERVALS = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' }
];

const LIMITS = [
  { value: '50', label: '50 candles' },
  { value: '100', label: '100 candles' },
  { value: '200', label: '200 candles' },
  { value: '500', label: '500 candles' },
  { value: '1000', label: '1000 candles' }
];

export default function HistoricalOHLCPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [selectedInterval, setSelectedInterval] = useState('1d');
  const [selectedLimit, setSelectedLimit] = useState('100');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  // Fetch available tickers
  const { data: tickers = [] } = useQuery<Ticker[]>({
    queryKey: ['/api/public/market/symbols'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/public/market/symbols');
        // Transform the response to match our Ticker interface
        return response.symbols.map((symbolData: any) => ({
          id: typeof symbolData === 'string' ? symbolData : symbolData.symbol,
          symbol: typeof symbolData === 'string' ? symbolData : symbolData.symbol,
          description: typeof symbolData === 'string' ? `${symbolData} Trading Pair` : symbolData.description || `${symbolData.symbol} Trading Pair`,
          isEnabled: true
        }));
      } catch (error) {
        // Fallback to admin tickers if public endpoint fails
        try {
          return await apiRequest('/api/admin/tickers');
        } catch (fallbackError) {
          // Final fallback to hardcoded symbols
          const hardcodedSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT'];
          return hardcodedSymbols.map(symbol => ({
            id: symbol,
            symbol,
            description: `${symbol} Trading Pair`,
            isEnabled: true
          }));
        }
      }
    }
  });

  // Fetch OHLC data with pagination
  const { data: ohlcResponse, isLoading, refetch } = useQuery<OHLCResponse>({
    queryKey: ['/api/public/market/ohlc', selectedSymbol, selectedInterval, selectedLimit, currentPage],
    queryFn: () => apiRequest(`/api/public/market/ohlc/${selectedSymbol}?interval=${selectedInterval}&limit=${selectedLimit}&page=${currentPage}`),
    enabled: !!selectedSymbol,
    onSuccess: (data) => {
      if (data && data.totalPages) {
        setTotalPages(data.totalPages);
      }
    }
  });

  const ohlcData = ohlcResponse?.data || [];

  const filteredTickers = tickers.filter((ticker: Ticker) =>
    ticker.symbol && ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateStats = () => {
    if (!ohlcData.length) return null;

    const latest = ohlcData[0];
    const previous = ohlcData[1];
    
    const change = previous ? latest.close - previous.close : 0;
    const changePercent = previous ? ((change / previous.close) * 100) : 0;
    
    const high24h = Math.max(...ohlcData.slice(0, 24).map(d => d.high));
    const low24h = Math.min(...ohlcData.slice(0, 24).map(d => d.low));
    const volume24h = ohlcData.slice(0, 24).reduce((sum, d) => sum + d.volume, 0);

    return {
      currentPrice: latest.close,
      change,
      changePercent,
      high24h,
      low24h,
      volume24h
    };
  };

  const stats = calculateStats();

  const exportToCSV = () => {
    if (!ohlcData.length) {
      toast({
        title: "No Data",
        description: "No OHLC data to export",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Time', 'Open', 'High', 'Low', 'Close', 'Volume'];
    const csvContent = [
      headers.join(','),
      ...ohlcData.map(row => [
        row.time,
        row.open,
        row.high,
        row.low,
        row.close,
        row.volume
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSymbol}_${selectedInterval}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `OHLC data exported for ${selectedSymbol}`,
    });
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    if (selectedInterval.includes('m') || selectedInterval.includes('h')) {
      return date.toLocaleString();
    }
    return date.toLocaleDateString();
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedSymbol, selectedInterval, selectedLimit]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar className="hidden lg:block lg:w-64" />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Header */}
          <Header 
            title="Historical OHLC Data" 
            subtitle="Access historical price and volume data for technical analysis"
          >
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="mr-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={!ohlcData.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </Header>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {/* Controls Section */}
            <Card>
              <CardHeader>
                <CardTitle>Data Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol-search">Select Symbol</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="symbol-search"
                          placeholder="Search symbols..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredTickers.map((ticker) => (
                            <SelectItem key={ticker.symbol} value={ticker.symbol}>
                              {ticker.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interval">Time Interval</Label>
                    <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVALS.map((interval) => (
                          <SelectItem key={interval.value} value={interval.value}>
                            {interval.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limit">Data Points</Label>
                    <Select value={selectedLimit} onValueChange={setSelectedLimit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIMITS.map((limit) => (
                          <SelectItem key={limit.value} value={limit.value}>
                            {limit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={() => refetch()} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Activity className="h-4 w-4 mr-2" />
                      )}
                      Load Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Current Price
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${formatNumber(stats.currentPrice)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Latest close</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      24h Change
                    </CardTitle>
                    {stats.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stats.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.changePercent >= 0 ? '+' : ''}{formatNumber(stats.changePercent)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${formatNumber(stats.change)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      24h High
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${formatNumber(stats.high24h)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Highest price</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      24h Low
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ${formatNumber(stats.low24h)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Lowest price</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* OHLC Data Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>OHLC Data ({ohlcData.length} records)</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="font-mono">{selectedSymbol}</Badge>
                    <Badge variant="secondary">{selectedInterval}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading OHLC data...</p>
                  </div>
                ) : ohlcData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>No OHLC data available</p>
                    <p className="text-sm mt-2">Try adjusting your parameters or check the symbol</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Mobile Card View */}
                    <div className="lg:hidden p-4 space-y-4">
                      {ohlcData.slice(0, 20).map((data, index) => (
                        <Card key={index} className="p-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{formatTime(data.time)}</span>
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Open:</span>
                                <span className="ml-2 font-medium">${formatNumber(data.open)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">High:</span>
                                <span className="ml-2 font-medium text-green-600">${formatNumber(data.high)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Low:</span>
                                <span className="ml-2 font-medium text-red-600">${formatNumber(data.low)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Close:</span>
                                <span className="ml-2 font-medium">${formatNumber(data.close)}</span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground pt-2 border-t">
                              Volume: {formatNumber(data.volume, 0)}
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      {ohlcData.length > 20 && (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            Showing first 20 of {ohlcData.length} records
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use desktop view or export CSV to see all data
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-medium text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Time
                              </div>
                            </th>
                            <th className="text-right p-4 font-medium text-muted-foreground">Open</th>
                            <th className="text-right p-4 font-medium text-muted-foreground">High</th>
                            <th className="text-right p-4 font-medium text-muted-foreground">Low</th>
                            <th className="text-right p-4 font-medium text-muted-foreground">Close</th>
                            <th className="text-right p-4 font-medium text-muted-foreground">Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ohlcData.map((data, index) => (
                            <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-4">
                                <div className="text-sm font-medium">
                                  {formatTime(data.time)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  #{index + 1}
                                </div>
                              </td>
                              <td className="p-4 text-right font-mono">
                                ${formatNumber(data.open)}
                              </td>
                              <td className="p-4 text-right font-mono text-green-600">
                                ${formatNumber(data.high)}
                              </td>
                              <td className="p-4 text-right font-mono text-red-600">
                                ${formatNumber(data.low)}
                              </td>
                              <td className="p-4 text-right font-mono">
                                ${formatNumber(data.close)}
                              </td>
                              <td className="p-4 text-right font-mono text-muted-foreground">
                                {formatNumber(data.volume, 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Pagination Controls */}
                {ohlcResponse && ohlcResponse.totalPages && ohlcResponse.totalPages > 1 && (
                  <div className="px-4 py-4 border-t">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Page {ohlcResponse.currentPage || 1} of {ohlcResponse.totalPages} 
                        {ohlcResponse.totalCount && (
                          <span> • {ohlcResponse.totalCount} total records</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage <= 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}