import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Target, Calendar, Star, Award, BarChart3, Activity, Zap, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressChart from './ProgressChart';
import AchievementUnlockModal from './AchievementUnlockModal';
import CustomAchievementEditor from './CustomAchievementEditor';

interface UserProgress {
  id: string;
  userId: string;
  totalTrades: number;
  successfulTrades: number;
  totalProfit: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  platformUsageDays: number;
  signalsReceived: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  level: number;
  experiencePoints: number;
  nextLevelXP: number;
  skillPoints: {
    trading: number;
    analysis: number;
    riskManagement: number;
    research: number;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
}

interface ProgressMilestone {
  id: string;
  title: string;
  description: string;
  type: 'trading' | 'learning' | 'engagement' | 'achievement';
  progress: number;
  target: number;
  reward: string;
  isCompleted: boolean;
  completedAt?: string;
}

export default function UserProgressDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [customAchievements, setCustomAchievements] = useState<any[]>([]);

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/user/progress'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/user/achievements'],
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery({
    queryKey: ['/api/user/milestones'],
  });

  const progress: UserProgress = progressData || {
    id: 'demo-progress',
    userId: 'demo-user',
    totalTrades: 47,
    successfulTrades: 32,
    totalProfit: 2485.67,
    winRate: 68.1,
    currentStreak: 5,
    longestStreak: 12,
    platformUsageDays: 23,
    signalsReceived: 156,
    achievementsUnlocked: 8,
    totalAchievements: 25,
    level: 7,
    experiencePoints: 3420,
    nextLevelXP: 4000,
    skillPoints: {
      trading: 85,
      analysis: 72,
      riskManagement: 65,
      research: 78
    }
  };

  const demoAchievements: Achievement[] = achievements || [
    {
      id: 'first-trade',
      name: 'First Steps',
      description: 'Complete your first trade',
      category: 'trading',
      rarity: 'common',
      points: 100,
      icon: '🎯',
      isUnlocked: true,
      unlockedAt: '2025-01-02T10:30:00Z',
      progress: 1,
      target: 1
    },
    {
      id: 'profitable-week',
      name: 'Profitable Week',
      description: 'Achieve 7 consecutive profitable days',
      category: 'trading',
      rarity: 'uncommon',
      points: 250,
      icon: '📈',
      isUnlocked: true,
      unlockedAt: '2025-01-05T15:45:00Z',
      progress: 7,
      target: 7
    },
    {
      id: 'signal-master',
      name: 'Signal Master',
      description: 'Successfully act on 50 trading signals',
      category: 'analysis',
      rarity: 'rare',
      points: 500,
      icon: '⚡',
      isUnlocked: false,
      progress: 32,
      target: 50
    },
    {
      id: 'diamond-hands',
      name: 'Diamond Hands',
      description: 'Hold a position for 30+ days',
      category: 'patience',
      rarity: 'epic',
      points: 750,
      icon: '💎',
      isUnlocked: false,
      progress: 18,
      target: 30
    },
    {
      id: 'whale-watcher',
      name: 'Whale Watcher',
      description: 'Achieve $10,000+ in total profits',
      category: 'milestone',
      rarity: 'legendary',
      points: 1000,
      icon: '🐋',
      isUnlocked: false,
      progress: 2485,
      target: 10000
    }
  ];

  const demoMilestones: ProgressMilestone[] = milestones || [
    {
      id: 'beginner-trader',
      title: 'Beginner Trader',
      description: 'Complete 10 trades to unlock advanced features',
      type: 'trading',
      progress: 47,
      target: 10,
      reward: 'Advanced chart tools',
      isCompleted: true,
      completedAt: '2025-01-03T12:00:00Z'
    },
    {
      id: 'signal-subscriber',
      title: 'Signal Subscriber',
      description: 'Receive 100 trading signals',
      type: 'engagement',
      progress: 156,
      target: 100,
      reward: 'Premium signal notifications',
      isCompleted: true,
      completedAt: '2025-01-07T09:15:00Z'
    },
    {
      id: 'consistent-trader',
      title: 'Consistent Trader',
      description: 'Maintain 70%+ win rate over 50 trades',
      type: 'trading',
      progress: 47,
      target: 50,
      reward: 'VIP trader badge',
      isCompleted: false
    },
    {
      id: 'platform-veteran',
      title: 'Platform Veteran',
      description: 'Use the platform for 30 consecutive days',
      type: 'engagement',
      progress: 23,
      target: 30,
      reward: 'Veteran user perks',
      isCompleted: false
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'uncommon': return 'bg-green-100 text-green-800 border-green-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trading': return <TrendingUp className="h-4 w-4" />;
      case 'learning': return <Target className="h-4 w-4" />;
      case 'engagement': return <Activity className="h-4 w-4" />;
      case 'achievement': return <Award className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? demoAchievements 
    : demoAchievements.filter(achievement => achievement.category === selectedCategory);

  // Demo progress data for chart
  const progressChartData = [
    { date: '2025-01-01', totalTrades: 5, winRate: 60, profit: 245, level: 1 },
    { date: '2025-01-03', totalTrades: 12, winRate: 67, profit: 580, level: 2 },
    { date: '2025-01-05', totalTrades: 23, winRate: 65, profit: 1250, level: 3 },
    { date: '2025-01-07', totalTrades: 34, winRate: 68, profit: 1890, level: 5 },
    { date: '2025-01-09', totalTrades: 47, winRate: 68.1, profit: 2485, level: 7 },
  ];

  // Simulate achievement unlock
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((progress?.totalTrades || 0) >= 45 && !demoAchievements.find(a => a.id === 'consistent-trader')?.isUnlocked) {
        const achievement = {
          id: 'high-volume-trader',
          name: 'High Volume Trader',
          description: 'Complete 45+ trades',
          category: 'trading',
          rarity: 'rare' as const,
          points: 400,
          icon: '🚀'
        };
        setUnlockedAchievement(achievement);
        setShowUnlockModal(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [progress?.totalTrades]);

  const handleAchievementUnlock = () => {
    setShowUnlockModal(false);
    setUnlockedAchievement(null);
  };

  const handleSaveCustomAchievement = (achievement: any) => {
    setCustomAchievements(prev => {
      const existing = prev.find(a => a.id === achievement.id);
      if (existing) {
        return prev.map(a => a.id === achievement.id ? achievement : a);
      }
      return [...prev, achievement];
    });
  };

  const handleDeleteCustomAchievement = (id: string) => {
    setCustomAchievements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  User Progress Dashboard
                </CardTitle>
                <CardDescription>
                  Track your trading journey and unlock achievements
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">Level {progress?.level || 1}</div>
                <div className="text-sm text-muted-foreground">
                  {progress?.experiencePoints || 0} / {progress?.nextLevelXP || 1000} XP
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={((progress?.experiencePoints || 0) / (progress?.nextLevelXP || 1000)) * 100} 
                className="h-3"
              />
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Progress Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                      <p className="text-2xl font-bold">{progress?.totalTrades || 0}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      {progress?.successfulTrades || 0} successful
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                      <p className="text-2xl font-bold">{progress?.winRate || 0}%</p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    <Progress value={progress?.winRate || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
                      <p className="text-2xl font-bold">${progress?.totalProfit?.toLocaleString() || '0'}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      Current streak: {progress?.currentStreak || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Achievements</p>
                      <p className="text-2xl font-bold">
                        {progress?.achievementsUnlocked || 0}/{progress?.totalAchievements || 0}
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={((progress?.achievementsUnlocked || 0) / (progress?.totalAchievements || 1)) * 100} 
                      className="h-2" 
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Progress Chart */}
          <ProgressChart data={progressChartData} className="mb-6" />

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest achievements and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoAchievements
                    .filter(achievement => achievement.isUnlocked)
                    .slice(0, 3)
                    .map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center space-x-4 p-3 rounded-lg border"
                      >
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.name}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {achievement.unlockedAt && new Date(achievement.unlockedAt).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Boost your progress with these activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Practice Trading (+50 XP)
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyze Market Trends (+25 XP)
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Complete Daily Challenge (+100 XP)
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Set Weekly Goals (+75 XP)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </Button>
            {['trading', 'analysis', 'patience', 'milestone'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={achievement.isUnlocked ? 'border-green-200 bg-green-50/30' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl">{achievement.icon}</div>
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {achievement.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.target}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.target) * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm font-medium text-purple-600">
                          +{achievement.points} XP
                        </span>
                        {achievement.isUnlocked && (
                          <Badge variant="secondary" className="text-green-700 bg-green-100">
                            ✓ Unlocked
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoMilestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={milestone.isCompleted ? 'border-green-200 bg-green-50/30' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(milestone.type)}
                        <div>
                          <h3 className="font-semibold text-lg">{milestone.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                      {milestone.isCompleted && (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Completed
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{milestone.progress}/{milestone.target}</span>
                      </div>
                      <Progress 
                        value={Math.min((milestone.progress / milestone.target) * 100, 100)} 
                        className="h-3"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Reward</p>
                        <p className="text-sm text-muted-foreground">{milestone.reward}</p>
                      </div>
                      {milestone.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed {new Date(milestone.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skill Development</CardTitle>
              <CardDescription>
                Your expertise across different trading disciplines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(progress?.skillPoints || {}).map(([skill, points], index) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold capitalize">
                        {skill.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <span className="text-sm font-bold">{points}/100</span>
                    </div>
                    <Progress value={points} className="h-3" />
                    <div className="text-xs text-muted-foreground">
                      {points < 30 && 'Beginner'}
                      {points >= 30 && points < 60 && 'Intermediate'}
                      {points >= 60 && points < 80 && 'Advanced'}
                      {points >= 80 && 'Expert'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Achievements Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Achievement Creator</CardTitle>
              <CardDescription>
                Create personalized achievements to track your unique trading goals and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomAchievementEditor
                onSave={handleSaveCustomAchievement}
                onDelete={handleDeleteCustomAchievement}
                customAchievements={customAchievements}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Achievement Unlock Modal */}
      <AchievementUnlockModal
        achievement={unlockedAchievement}
        isOpen={showUnlockModal}
        onClose={handleAchievementUnlock}
      />
    </div>
  );
}