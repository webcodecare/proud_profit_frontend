import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Award, Crown, Medal, Bell, Briefcase, BarChart3, Gamepad, Bitcoin, Flame } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  iconType: string;
  iconColor: string;
  points: number;
  requirement: {
    type: string;
    target: number;
  };
  isActive: boolean;
  rarity: string;
  createdAt: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

interface AchievementCardProps {
  achievement: Achievement;
}

export default function AchievementCard({ achievement }: AchievementCardProps) {
  const getIconComponent = (iconType: string, color: string = "gold") => {
    const iconClass = `h-4 w-4 sm:h-6 sm:w-6 text-${color === 'gold' ? 'yellow' : color}-500`;
    
    switch (iconType) {
      case 'trophy':
        return <Trophy className={iconClass} />;
      case 'star':
        return <Star className={iconClass} />;
      case 'target':
        return <Target className={iconClass} />;
      case 'badge':
        return <Award className={iconClass} />;
      case 'crown':
        return <Crown className={iconClass} />;
      case 'medal':
        return <Medal className={iconClass} />;
      case 'bell':
        return <Bell className={iconClass} />;
      case 'briefcase':
        return <Briefcase className={iconClass} />;
      case 'chart':
        return <BarChart3 className={iconClass} />;
      case 'gamepad':
        return <Gamepad className={iconClass} />;
      case 'bitcoin':
        return <Bitcoin className={iconClass} />;
      case 'flame':
        return <Flame className={iconClass} />;
      default:
        return <Trophy className={iconClass} />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'uncommon': return 'bg-green-100 text-green-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all hover:shadow-lg p-3 sm:p-4 ${
        achievement.isUnlocked 
          ? 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800' 
          : 'border-gray-200'
      }`}
    >
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {getIconComponent(achievement.iconType, achievement.iconColor)}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-lg truncate">{achievement.name}</CardTitle>
              <CardDescription className="text-xs sm:text-sm line-clamp-2">
                {achievement.description}
              </CardDescription>
            </div>
          </div>
          {achievement.isUnlocked && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-1 shrink-0">
              ✓ <span className="hidden sm:inline">Unlocked</span>
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 mt-2 flex-wrap">
          <Badge className={`${getRarityColor(achievement.rarity)} text-xs`}>
            {achievement.rarity}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {achievement.points} pts
          </Badge>
          <Badge variant="outline" className="text-xs">
            {achievement.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span>Progress</span>
            <span>{achievement.progress}%</span>
          </div>
          <Progress 
            value={achievement.progress} 
            className={`h-2 ${
              achievement.isUnlocked 
                ? 'bg-green-100' 
                : 'bg-gray-100'
            }`}
          />
          
          {achievement.isUnlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              <span className="hidden sm:inline">Unlocked on </span>
              {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
          
          {!achievement.isUnlocked && (
            <p className="text-xs text-muted-foreground mt-2">
              <span className="hidden sm:inline">Target: </span>
              {achievement.requirement.target} {achievement.requirement.type.replace('_', ' ')}
            </p>
          )}
        </div>
      </CardContent>
      
      {achievement.isUnlocked && (
        <div className="absolute top-2 right-2">
          <Trophy className="h-3 w-3 sm:h-5 sm:w-5 text-yellow-500" />
        </div>
      )}
    </Card>
  );
}