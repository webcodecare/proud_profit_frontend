import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: string;
  component: string;
}

interface FeatureCardProps {
  feature: Feature;
}

export default function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <Card className="p-3 sm:p-4">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {feature.icon}
            <CardTitle className="text-sm sm:text-lg truncate">{feature.title}</CardTitle>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-400 text-xs px-2 py-1">
            {feature.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-muted-foreground text-xs sm:text-sm mb-3 line-clamp-2">
          {feature.description}
        </p>
        <div className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">Component: </span>
          <span className="font-mono text-xs">{feature.component}</span>
        </div>
      </CardContent>
    </Card>
  );
}