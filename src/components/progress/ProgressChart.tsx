import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ProgressData {
  date: string;
  totalTrades: number;
  winRate: number;
  profit: number;
  level: number;
}

interface ProgressChartProps {
  data: ProgressData[];
  className?: string;
}

export default function ProgressChart({ data, className }: ProgressChartProps) {
  const maxProfit = Math.max(...data.map(d => d.profit));
  const maxTrades = Math.max(...data.map(d => d.totalTrades));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Progress Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 40}
                x2="400"
                y2={i * 40}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="1"
              />
            ))}
            
            {/* Profit line */}
            <motion.path
              d={`M ${data.map((d, i) => 
                `${(i / (data.length - 1)) * 380 + 10},${200 - (d.profit / maxProfit) * 160}`
              ).join(' L ')}`}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            
            {/* Win rate line */}
            <motion.path
              d={`M ${data.map((d, i) => 
                `${(i / (data.length - 1)) * 380 + 10},${200 - (d.winRate / 100) * 160}`
              ).join(' L ')}`}
              fill="none"
              stroke="hsl(var(--destructive))"
              strokeWidth="2"
              strokeDasharray="5,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
            />
            
            {/* Data points */}
            {data.map((d, i) => (
              <motion.circle
                key={i}
                cx={(i / (data.length - 1)) * 380 + 10}
                cy={200 - (d.profit / maxProfit) * 160}
                r="4"
                fill="hsl(var(--primary))"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 + 1, duration: 0.3 }}
              />
            ))}
          </svg>
          
          {/* Legend */}
          <div className="absolute top-2 right-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-0.5 bg-primary"></div>
              <span>Profit</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-0.5 bg-destructive border-dashed border border-destructive"></div>
              <span>Win Rate</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}