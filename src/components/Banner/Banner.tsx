import { ArrowRight, Play } from "lucide-react"

function Banner() {
    return (
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 crypto-gradient opacity-20"></div>
            <div className="relative container mx-auto px-4 py-12 sm:py-16 lg:py-24">
                <div className="grid lg:grid-cols-1 gap-8 lg:gap-12 items-center">
                    <div className="text-center">
                        <div className="flex flex-col items-center mb-6">
                            <img 
                                src="/proud-profits-logo.png" 
                                alt="Proud Profits" 
                                className="h-20 sm:h-24 lg:h-32 object-contain mb-6"
                            />
                            <h1 className="text-4xl lg:text-5xl font-bold text-white">
                                Professional{" "}
                                <span className="bg-gradient-to-r from-[#4A9FE7] to-[#FF6B47] bg-clip-text text-transparent">
                                    Crypto
                                </span>
                                <br />
                                Trading Signals
                            </h1>
                        </div>
                        <p className="text-xl text-white/80 mb-8 leading-relaxed">
                            Advanced Bitcoin analytics with real-time trading signals, risk management, and AI-powered market
                            forecasting for maximum trading performance.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button className="bg-gradient-to-r from-[#4A9FE7] to-[#FF6B47] text-white px-8 py-4 rounded-full font-semibold hover:from-[#2E86C1] hover:to-[#E55A3C] transition-all flex items-center justify-center">
                                Start Trading <ArrowRight className="ml-2 w-5 h-5" />
                            </button>
                            <button className="border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all flex items-center justify-center">
                                <Play className="mr-2 w-5 h-5" /> Watch Demo
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 lg:gap-6 pt-6 lg:pt-8">
                            <div className="text-center">
                                <div className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#4A9FE7' }}>87%</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Win Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl sm:text-2xl lg:text-3xl font-bold">12,847</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Active Traders</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#FF6B47' }}>+234%</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Avg ROI</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Banner