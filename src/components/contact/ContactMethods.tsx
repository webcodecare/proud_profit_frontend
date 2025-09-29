import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContactMethod {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
  action: string;
}

interface ContactMethodsProps {
  methods: ContactMethod[];
}

export default function ContactMethods({ methods }: ContactMethodsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      {methods.map((method, index) => (
        <Card key={index} className="text-center hover:shadow-lg transition-shadow">
          <CardContent className="p-8">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
              {method.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{method.title}</h3>
            <p className="text-muted-foreground mb-3">{method.description}</p>
            <p className="font-medium mb-4">{method.detail}</p>
            <Button variant="outline" className="w-full">
              {method.action}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}