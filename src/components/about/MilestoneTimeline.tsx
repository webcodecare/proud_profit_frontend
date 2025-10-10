import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface Milestone {
  year: string;
  event: string;
  description: string;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 to-orange-600"></div>
      <div className="space-y-8">
        {milestones.map((milestone, index) => (
          <div key={index} className="relative flex items-start">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {milestone.year}
            </div>
            <Card className="ml-8 flex-1">
              <CardContent className="p-6">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-orange-500 mr-2" />
                  <h3 className="text-lg font-semibold">{milestone.event}</h3>
                </div>
                <p className="text-muted-foreground">{milestone.description}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}