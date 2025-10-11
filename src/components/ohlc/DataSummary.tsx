import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Database, Activity } from "lucide-react";

interface OHLCResponse {
  symbol: string;
  interval: string;
  count: number;
  cached: boolean;
  external: boolean;
  data: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    source: 'cache' | 'binance';
  }>;
}

interface DataSummaryProps {
  ohlcResponse: OHLCResponse;
  downloadCSV: () => void;
}

export default function DataSummary({ ohlcResponse, downloadCSV }: DataSummaryProps) {
  const summaryItems = [
    {
      label: "Symbol",
      value: ohlcResponse.symbol,
      color: "text-blue-500"
    },
    {
      label: "Candles",
      value: ohlcResponse.count,
      color: "text-green-500"
    },
    {
      label: "Interval",
      value: ohlcResponse.interval,
      color: "text-purple-500"
    },
    {
      label: "Source",
      value: ohlcResponse.cached ? (
        <div className="flex items-center justify-center text-orange-500">
          <Database className="h-3 w-3 sm:h-5 sm:w-5 mr-1" />
          <span className="hidden sm:inline">Cache</span>
        </div>
      ) : (
        <div className="flex items-center justify-center text-orange-500">
          <Activity className="h-3 w-3 sm:h-5 sm:w-5 mr-1" />
          <span className="hidden sm:inline">Live</span>
        </div>
      ),
      color: "text-orange-500"
    },
    {
      label: "Data Type",
      value: ohlcResponse.external ? 'External' : 'Cached',
      color: "text-pink-500"
    }
  ];

  return (
    <Card className="p-3 sm:p-4">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base">Data Summary</CardTitle>
          <Button variant="outline" size="sm" onClick={downloadCSV} className="text-xs">
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export </span>CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {summaryItems.map((item, index) => (
            <div key={index} className="text-center p-3 border rounded-lg">
              <div className={`text-lg sm:text-2xl font-bold ${item.color}`}>
                {typeof item.value === 'object' ? item.value : item.value}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}