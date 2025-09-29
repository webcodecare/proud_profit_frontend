import { Bitcoin } from 'lucide-react';
import MarketWidget from '../widgets/MarketWidget';

function LiveMarketData() {
    const cryptoSymbols = [
        {
            symbol: "BTCUSDT",
            name: "Bitcoin",
            icon: <Bitcoin className="h-6 w-6 text-orange-500" />,
        },
        {
            symbol: "ETHUSDT",
            name: "Ethereum",
            icon: (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    E
                </div>
            ),
        },
        {
            symbol: "SOLUSDT",
            name: "Solana",
            icon: (
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    S
                </div>
            ),
        },
        {
            symbol: "ADAUSDT",
            name: "Cardano",
            icon: (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    A
                </div>
            ),
        },
    ];

    return (
        <section className="py-12 sm:py-16 bg-muted/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 lg:mb-4">
                        Live Market Data
                    </h2>
                    <p className="text-lg lg:text-xl text-muted-foreground">
                        Real-time cryptocurrency prices and market statistics
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cryptoSymbols.map((crypto, index) => (
                        <MarketWidget
                            key={index}
                            symbol={crypto.symbol}
                            name={crypto.name}
                            icon={crypto.icon}
                            className="hover:scale-105 transition-transform"
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default LiveMarketData