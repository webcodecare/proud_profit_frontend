import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';

interface SignalWithMood {
  id: string;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: string;
  timestamp: string;
  timeframe?: string;
  source: string;
  note?: string;
  mood: {
    emoji: string;
    sentiment: string;
    strength: number;
    description: string;
  };
}

const SIGNAL_MOODS = {
  buy: [
    { emoji: '🚀', sentiment: 'Very Bullish', strength: 5, description: 'Strong upward momentum' },
    { emoji: '📈', sentiment: 'Bullish', strength: 4, description: 'Positive trend detected' },
    { emoji: '💚', sentiment: 'Optimistic', strength: 3, description: 'Favorable conditions' },
    { emoji: '🟢', sentiment: 'Cautious Buy', strength: 2, description: 'Mild positive signal' },
    { emoji: '⚡', sentiment: 'Quick Buy', strength: 4, description: 'Fast momentum signal' },
  ],
  sell: [
    { emoji: '🔴', sentiment: 'Bearish', strength: 4, description: 'Downward pressure' },
    { emoji: '📉', sentiment: 'Very Bearish', strength: 5, description: 'Strong selling signal' },
    { emoji: '⚠️', sentiment: 'Warning', strength: 3, description: 'Risk alert detected' },
    { emoji: '💔', sentiment: 'Breakdown', strength: 5, description: 'Support level broken' },
    { emoji: '🔻', sentiment: 'Cautious Sell', strength: 2, description: 'Mild negative signal' },
  ]
};

const getSignalMood = (signal: any): SignalWithMood['mood'] => {
  const signalType = signal.signalType.toLowerCase() as 'buy' | 'sell';
  const moods = SIGNAL_MOODS[signalType];
  
  // Determine mood based on various factors
  let moodIndex = 0;
  
  // Factor in price level (higher prices = more excitement for buy, more caution for sell)
  const price = parseFloat(signal.price);
  if (price > 70000) moodIndex += 1; // High price levels
  if (price < 30000) moodIndex += 1; // Low price levels
  
  // Factor in timeframe (longer timeframes = stronger signals)
  if (signal.timeframe) {
    if (['1W', '1D'].includes(signal.timeframe)) moodIndex += 2;
    else if (['12h', '4h'].includes(signal.timeframe)) moodIndex += 1;
  }
  
  // Factor in source reliability
  if (signal.source === 'tradingview_webhook') moodIndex += 1;
  if (signal.source === 'manual_admin') moodIndex += 2;
  
  // Ensure index is within bounds
  moodIndex = Math.min(moodIndex, moods.length - 1);
  
  return moods[moodIndex];
};

const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const signalTime = new Date(timestamp);
  const diffMs = now.getTime() - signalTime.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const SignalCard = ({ signal }: { signal: SignalWithMood }) => {
  const isRecent = new Date().getTime() - new Date(signal.timestamp).getTime() < 5 * 60 * 1000; // 5 minutes

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card className={`hover:shadow-lg transition-all duration-300 ${
        isRecent ? 'ring-2 ring-primary/20 bg-primary/5' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <motion.span 
                className="text-3xl"
                animate={{ rotate: isRecent ? [0, 10, -10, 0] : 0 }}
                transition={{ duration: 0.5, repeat: isRecent ? Infinity : 0, repeatDelay: 2 }}
              >
                {signal.mood.emoji}
              </motion.span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg">{signal.ticker}</span>
                  <Badge variant={signal.signalType === 'buy' ? 'default' : 'destructive'}>
                    {signal.signalType.toUpperCase()}
                  </Badge>
                  {signal.timeframe && (
                    <Badge variant="outline" className="text-xs">
                      {signal.timeframe}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">${signal.price}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 mb-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: i < signal.mood.strength ? 1 : 0.3 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Sparkles 
                      className={`w-3 h-3 ${
                        i < signal.mood.strength 
                          ? signal.signalType === 'buy' ? 'text-green-500' : 'text-red-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-xs font-medium">{signal.mood.sentiment}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground italic">
              {signal.mood.description}
            </p>
            {signal.note && (
              <p className="text-xs bg-muted/50 rounded-md p-2">
                {signal.note}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{getTimeAgo(signal.timestamp)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span className="capitalize">{signal.source.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isRecent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1"
        >
          <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
            NEW
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default function SignalMoodBoard() {
  const [moodSignals, setMoodSignals] = useState<SignalWithMood[]>([]);

  const { data: signals, isLoading } = useQuery({
    queryKey: ['/api/public/signals'],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  useEffect(() => {
    if (signals && Array.isArray(signals)) {
      const signalsWithMood = signals.slice(0, 12).map((signal: any) => ({
        ...signal,
        mood: getSignalMood(signal)
      }));
      setMoodSignals(signalsWithMood);
    }
  }, [signals]);

  // Overall market sentiment
  const marketSentiment = () => {
    if (moodSignals.length === 0) return { emoji: '😐', label: 'Neutral' };
    
    const buySignals = moodSignals.filter(s => s.signalType === 'buy').length;
    const sellSignals = moodSignals.filter(s => s.signalType === 'sell').length;
    const avgStrength = moodSignals.reduce((acc, s) => acc + s.mood.strength, 0) / moodSignals.length;
    
    if (buySignals > sellSignals && avgStrength > 3.5) {
      return { emoji: '🔥', label: 'Very Bullish Market' };
    } else if (buySignals > sellSignals) {
      return { emoji: '😊', label: 'Bullish Market' };
    } else if (sellSignals > buySignals && avgStrength > 3.5) {
      return { emoji: '❄️', label: 'Very Bearish Market' };
    } else if (sellSignals > buySignals) {
      return { emoji: '😟', label: 'Bearish Market' };
    } else {
      return { emoji: '😐', label: 'Mixed Signals' };
    }
  };

  const sentiment = marketSentiment();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Signal Mood Board</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-32 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Signal Mood Board</span>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <motion.span 
              className="text-2xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {sentiment.emoji}
            </motion.span>
            <div className="text-right">
              <p className="text-sm font-medium">{sentiment.label}</p>
              <p className="text-xs text-muted-foreground">
                {moodSignals.length} active signals
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="popLayout">
          {moodSignals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <div className="text-4xl mb-2">🔍</div>
              <p>No recent signals detected</p>
              <p className="text-sm">Mood board will update with new trading signals</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {moodSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}