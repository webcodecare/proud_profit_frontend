import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart3, Bell, TrendingUp, Users } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Sign Up & Connect",
    description: "Join Proud Profits and connect your trading platform for seamless integration",
    icon: <Users className="h-8 w-8 text-[var(--chart-prime-orange)]" />
  },
  {
    step: "02", 
    title: "Receive Signals",
    description: "Get real-time buy/sell alerts powered by our advanced analytics and indicators",
    icon: <Bell className="h-8 w-8 text-[var(--steel-blue)]" />
  },
  {
    step: "03",
    title: "Analyze Markets",
    description: "Use our 200-week heatmap and cycle indicators to understand market conditions",
    icon: <BarChart3 className="h-8 w-8 text-[var(--accent-green)]" />
  },
  {
    step: "04",
    title: "Profit Consistently",
    description: "Follow our proven signals and strategies to achieve consistent trading profits",
    icon: <TrendingUp className="h-8 w-8 text-[var(--accent-red)]" />
  }
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get started with Proud Profits in four simple steps and start making profitable trades today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="absolute top-4 left-4 text-4xl font-bold text-gray-200 dark:text-gray-700 opacity-50">
                  {step.step}
                </div>
                <div className="mt-8 mb-4 flex justify-center">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/auth">
            <Button 
              size="lg" 
              className="bg-[var(--chart-prime-orange)] hover:bg-[var(--chart-prime-orange)]/90 text-white px-8 py-3"
            >
              Start Your Journey Today
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}