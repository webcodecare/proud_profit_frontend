import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  icon: string;
}

interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementUnlockModal({ achievement, isOpen, onClose }: AchievementUnlockModalProps) {
  if (!achievement) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'uncommon': return 'from-green-400 to-green-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-yellow-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getSparkleCount = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 12;
      case 'epic': return 8;
      case 'rare': return 6;
      case 'uncommon': return 4;
      default: return 2;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="text-center space-y-6 p-6"
            >
              {/* Sparkles animation */}
              <div className="relative">
                {Array.from({ length: getSparkleCount(achievement.rarity) }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{ 
                      scale: 0,
                      x: Math.random() * 200 - 100,
                      y: Math.random() * 200 - 100,
                      rotate: 0
                    }}
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: 360,
                    }}
                    transition={{ 
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                  </motion.div>
                ))}
                
                {/* Achievement icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.3
                  }}
                  className={`mx-auto w-24 h-24 rounded-full bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center text-4xl shadow-lg`}
                >
                  {achievement.icon}
                </motion.div>
              </div>

              {/* Achievement unlocked text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-xl font-bold">Achievement Unlocked!</h2>
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </div>
                
                <motion.h3 
                  className="text-2xl font-bold mb-2"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                >
                  {achievement.name}
                </motion.h3>
                
                <p className="text-muted-foreground mb-4">
                  {achievement.description}
                </p>
                
                <div className="flex items-center justify-center gap-4">
                  <Badge className={`${getRarityColor(achievement.rarity)} text-white border-none`}>
                    {achievement.rarity}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">+{achievement.points} XP</span>
                  </div>
                </div>
              </motion.div>

              {/* Action button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <Button onClick={onClose} className="w-full">
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}