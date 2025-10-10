import { Card, CardContent } from "@/components/ui/card";

interface ValueCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function ValueCard({ title, description, icon }: ValueCardProps) {
  return (
    <Card className="text-center hover:shadow-lg transition-shadow h-full">
      <CardContent className="p-8 flex flex-col justify-between h-full">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-3">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}