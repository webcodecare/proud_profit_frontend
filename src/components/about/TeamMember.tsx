import { Card, CardContent } from "@/components/ui/card";

interface TeamMemberProps {
  name: string;
  role: string;
  bio: string;
  icon: React.ReactNode;
}

export default function TeamMember({ name, role, bio, icon }: TeamMemberProps) {
  return (
    <Card className="text-center hover:shadow-lg transition-shadow">
      <CardContent className="p-8">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-orange-500 font-medium mb-3">{role}</p>
        <p className="text-muted-foreground text-sm">{bio}</p>
      </CardContent>
    </Card>
  );
}