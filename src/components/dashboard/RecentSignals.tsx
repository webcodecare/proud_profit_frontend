import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SignalsTable, { SignalData } from "./SignalsTable";

interface Signal {
  id: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: string;
  timestamp: string;
  timeframe?: string;
  source?: string;
  note?: string;
}

interface RecentSignalsProps {
  signals: Signal[];
  isLoading: boolean;
}

export default function RecentSignals({ signals, isLoading }: RecentSignalsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const tableData: SignalData[] = signals.map((signal) => ({
    id: signal.id,
    ticker: signal.ticker,
    signalType: signal.signalType,
    price: parseFloat(signal.price) || 0,
    timeframe: signal.timeframe,
    timestamp: signal.timestamp,
    source: signal.source,
    note: signal.note,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signals</CardTitle>
      </CardHeader>
      <CardContent>
        <SignalsTable signals={tableData} />
      </CardContent>
    </Card>
  );
}
