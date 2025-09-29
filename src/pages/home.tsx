import Banner from "@/components/Banner/Banner";
import Features from "@/components/Features/Features";
import Choose from "@/components/Choose/Choose";
import TradingCarousel from "@/components/carousel/carousel";
import WeeklySignalChartSimple from "@/components/charts/WeeklySignalChartSimple";
import TradingViewChart from "@/components/charts/TradingViewChart";
import CTASection from "@/components/CTASection/CTASection";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import LiveMarketData from "@/components/LiveMarketData/LiveMarketData";
import { TestimonialSection } from "@/components/testimonial-section";
import Pricing from "@/components/Pricing/Pricing";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Banner />
      <Choose />
      <Features />
      <Pricing />
      <TradingCarousel />
      <TestimonialSection />
      <LiveMarketData />
      
      {/* Weekly Buy/Sell Signals - Past 2 Years */}
      <section className="py-16" style={{ backgroundColor: '#1d283a' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-slate-200 dark:text-slate-300">
              Weekly Buy/Sell Signals - Past 2 Years
            </h2>
            <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto">
              Track our proven performance with real trading signals
            </p>
          </div>
          <WeeklySignalChartSimple />
        </div>
      </section>

      {/* Buy/Sell Signal Chart */}
      <section className="py-16 bg-slate-800 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <TradingViewChart 
            symbol="BINANCE:BTCUSDT"
            height={700}
            theme="dark"
            interval="1W"
            showToolbar={true}
            title="Bitcoin Buy/Sell Signals - Past 2 Years"
            description="Interactive chart showing our trading algorithm's buy/sell signals with real market data"
          />
        </div>
      </section>
      
      <CTASection />
      <Footer />
    </div>
  );
}