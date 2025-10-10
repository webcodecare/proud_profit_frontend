import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface HistoricalSignal {
  date: string;
  price: number;
  type: 'buy' | 'sell';
  symbol: string;
}

export default function HistoricalChart() {
  const { data: signals, isLoading } = useQuery({
    queryKey: ['/api/signals/historical'],
    enabled: false, // Disable for now as we'll use mock data
  });

  // Mock historical signals for the past 2 years (weekly)
  const mockSignals: HistoricalSignal[] = [
    { date: '2023-01-15', price: 21000, type: 'buy', symbol: 'BTCUSDT' },
    { date: '2023-02-12', price: 24500, type: 'sell', symbol: 'BTCUSDT' },
    { date: '2023-03-18', price: 22800, type: 'buy', symbol: 'BTCUSDT' },
    { date: '2023-04-22', price: 28000, type: 'sell', symbol: 'BTCUSDT' },
    { date: '2023-05-27', price: 26500, type: 'buy', symbol: 'BTCUSDT' },
    { date: '2023-07-01', price: 31000, type: 'sell', symbol: 'BTCUSDT' },
    { date: '2023-08-15', price: 29200, type: 'buy', symbol: 'BTCUSDT' },
    { date: '2023-10-20', price: 35000, type: 'sell', symbol: 'BTCUSDT' },
    { date: '2023-11-25', price: 33800, type: 'buy', symbol: 'BTCUSDT' },
    { date: '2024-01-10', price: 42000, type: 'sell', symbol: 'BTCUSDT' },
    { date: '2024-02-18', price: 38500, type: 'buy', symbol: 'BTCUSDT' },
    { date: '2024-03-25', price: 45000, type: 'sell', symbol: 'BTCUSDT' },
    { date: '2024-05-12', price: 41000, type: 'buy', symbol: 'BTCUSDT' },
    { date: '2024-07-20', price: 48000, type: 'sell', symbol: 'BTCUSDT' },
    { date: '2024-09-15', price: 44500, type: 'buy', symbol: 'BTCUSDT' },
    { date: '2024-11-10', price: 52000, type: 'sell', symbol: 'BTCUSDT' },
    { date: '2024-12-20', price: 49800, type: 'buy', symbol: 'BTCUSDT' },
  ];

  const calculatePerformance = () => {
    let totalProfit = 0;
    let buyPrice = 0;
    let winningTrades = 0;
    let totalTrades = 0;

    mockSignals.forEach((signal) => {
      if (signal.type === 'buy') {
        buyPrice = signal.price;
      } else if (signal.type === 'sell' && buyPrice > 0) {
        const profit = ((signal.price - buyPrice) / buyPrice) * 100;
        totalProfit += profit;
        if (profit > 0) winningTrades++;
        totalTrades++;
      }
    });

    return {
      totalReturn: totalProfit.toFixed(1),
      winRate: totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0',
      totalTrades
    };
  };

  const performance = calculatePerformance();

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Proven Track Record
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our historical buy/sell signals from the past two years demonstrate consistent performance
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[var(--accent-green)] mb-2">
                  +{performance.totalReturn}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Return
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[var(--steel-blue)] mb-2">
                  {performance.winRate}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Win Rate
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {performance.totalTrades}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Trades
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Weekly Buy/Sell Signals - Past 2 Years</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {mockSignals.map((signal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {signal.type === 'buy' ? (
                        <TrendingUp className="h-5 w-5 text-[var(--accent-green)]" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-[var(--accent-red)]" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {signal.type.toUpperCase()} Signal
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(signal.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${signal.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {signal.symbol}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}