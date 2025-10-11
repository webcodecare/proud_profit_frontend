import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Sparkles, ArrowRight, Activity } from 'lucide-react';

interface SignalMood {
  id: string;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: string;
  timestamp: string;
  timeframe?: string;
  mood: {
    emoji: string;
    sentiment: string;
    strength: number;
  };
}

const MOOD_MAP = {
  buy: [
    { emoji: '🚀', sentiment: 'Very Bullish', strength: 5 },
    { emoji: '📈', sentiment: 'Bullish', strength: 4 },
    { emoji: '💚', sentiment: 'Optimistic', strength: 3 },
    { emoji: '🟢', sentiment: 'Cautious Buy', strength: 2 },
    { emoji: '⚡', sentiment: 'Quick Buy', strength: 4 },
  ],
  sell: [
    { emoji: '🔴', sentiment: 'Bearish', strength: 4 },
    { emoji: '📉', sentiment: 'Very Bearish', strength: 5 },
    { emoji: '⚠️', sentiment: 'Warning', strength: 3 },
    { emoji: '💔', sentiment: 'Breakdown', strength: 5 },
    { emoji: '🔻', sentiment: 'Cautious Sell', strength: 2 },
  ]
};

const getQuickMood = (signal: any): SignalMood['mood'] => {
  const signalType = signal.signalType.toLowerCase() as 'buy' | 'sell';
  const moods = MOOD_MAP[signalType];
  const randomIndex = Math.floor(Math.random() * moods.length);
  return moods[randomIndex];
};

export default function MoodBoardWidget() {
  const [moodSignals, setMoodSignals] = useState<SignalMood[]>([]);

  const { data: signals, isLoading } = useQuery({
    queryKey: ['/api/signals'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  useEffect(() => {
    if (signals) {
      const recentSignals = signals.slice(0, 6).map((signal: any) => ({
        ...signal,
        mood: getQuickMood(signal)
      }));
      setMoodSignals(recentSignals);
    }
  }, [signals]);

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const signalTime = new Date(timestamp);
    const diffMs = now.getTime() - signalTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const overallMood = () => {
    if (moodSignals.length === 0) return { emoji: '😐', label: 'Neutral' };
    const buySignals = moodSignals.filter(s => s.signalType === 'buy').length;
    const sellSignals = moodSignals.filter(s => s.signalType === 'sell').length;
    
    if (buySignals > sellSignals) {
      return { emoji: '😊', label: 'Bullish Mood' };
    } else if (sellSignals > buySignals) {
      return { emoji: '😟', label: 'Bearish Mood' };
    } else {
      return { emoji: '😐', label: 'Mixed Signals' };
    }
  };

  const mood = overallMood();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Signal Mood</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Signal Mood</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <motion.span 
              className="text-xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {mood.emoji}
            </motion.span>
            <Badge variant="outline" className="text-xs">
              {mood.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {moodSignals.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent signals</p>
            </div>
          ) : (
            moodSignals.slice(0, 4).map((signal) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-xl">{signal.mood.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{signal.ticker}</span>
                    <Badge 
                      variant={signal.signalType === 'buy' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {signal.signalType.toUpperCase()}
                    </Badge>
                    {signal.timeframe && (
                      <Badge variant="outline" className="text-xs">
                        {signal.timeframe}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      ${parseFloat(signal.price).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(signal.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {moodSignals.length > 0 && (
          <div className="pt-4 border-t mt-4">
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link href="/mood-board" className="flex items-center space-x-2">
                <span>View Full Mood Board</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}