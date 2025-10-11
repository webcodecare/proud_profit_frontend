import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Target, Award } from "lucide-react";

interface ProgressSummaryProps {
  unlockedCount: number;
  totalPoints: number;
  userLevel: number;
  totalAchievements: number;
}

export default function ProgressSummary({ unlockedCount, totalPoints, userLevel, totalAchievements }: ProgressSummaryProps) {
  const summaryItems = [
    {
      icon: <Trophy className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-yellow-500" />,
      value: unlockedCount,
      label: "Unlocked"
    },
    {
      icon: <Star className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-500" />,
      value: totalPoints,
      label: "Total Points"
    },
    {
      icon: <Target className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-500" />,
      value: `Level ${userLevel}`,
      label: "Current Level"
    },
    {
      icon: <Award className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-purple-500" />,
      value: totalAchievements,
      label: "Total Available"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
      {summaryItems.map((item, index) => (
        <Card key={index} className="p-3 sm:p-4">
          <CardContent className="p-0 text-center">
            {item.icon}
            <div className="text-lg sm:text-2xl font-bold">{item.value}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}