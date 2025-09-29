import React from "react";
import { BarChart3, Shield, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent } from "../ui/card";

function Choose() {
      const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Real-time Signals",
      description: "Get instant buy/sell alerts from our advanced algorithms",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Analytics",
      description: "200-week heatmaps and cycle forecasting tools",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Professional Grade",
      description: "Enterprise-level security and reliability",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Real-time data processing and instant notifications",
    },
  ];
  const cardBackgrounds = [
    "bg-gradient-to-br from-slate-800/30 to-blue-800/30",
    "bg-gradient-to-br from-slate-800/30 to-slate-700/30",
    "bg-gradient-to-br from-green-800/30 to-emerald-800/30",
    "bg-gradient-to-br from-red-800/30 to-red-700/30",
  ];

    return (
        <section className="py-12 sm:py-16 bg-muted/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-8 ">
            <div className="container mx-auto px-4">
                <div className="text-center mb-8 sm:mb-12">
                    <div className="flex flex-col items-center mb-4">
                        <img 
                            src="/proud-profits-logo.png" 
                            alt="Proud Profits" 
                            className="h-16 sm:h-20 object-contain mb-4"
                        />
                        <h2 className="text-4xl font-bold text-white">
                            Why Choose{" "}
                            <span className="bg-gradient-to-r from-[#4A9FE7] to-[#FF6B47] bg-clip-text text-transparent">
                                Us?
                            </span>
                        </h2>
                    </div>
                    <p className="text-lg lg:text-xl text-muted-foreground">Professional tools designed for serious traders</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className={`backdrop-blur-sm rounded-2xl p-6 border border-white/20 transition-all
            ${cardBackgrounds[index % cardBackgrounds.length]
                                }
            ${index === 0
                                    ? "hover:border-orange-500/50"
                                    : index === 1
                                        ? "hover:border-blue-500/50"
                                        : index === 2
                                            ? "hover:border-emerald-500/50"
                                            : "hover:border-red-500/50"
                                }`}
                        >
                            <CardContent className="p-6 text-center">
                                <div className="text-primary mb-4 flex justify-center">{feature.icon}</div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Choose