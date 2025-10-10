import { Link } from "wouter";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TeamMember from "@/components/about/TeamMember";
import MilestoneTimeline from "@/components/about/MilestoneTimeline";
import ValueCard from "@/components/about/ValueCard";
import { 
  Target, 
  Users, 
  Zap, 
  Shield, 
  TrendingUp,
  Award,
  ArrowRight,
  Mail,
  Bitcoin,
  CheckCircle
} from "lucide-react";

export default function About() {
  const teamMembers = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      bio: "15+ years in crypto trading and fintech",
      icon: <Target className="h-6 w-6" />
    },
    {
      name: "Sarah Rodriguez",
      role: "Head of Analytics",
      bio: "Former Goldman Sachs quantitative analyst",
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      name: "Michael Park",
      role: "CTO",
      bio: "Blockchain engineer and system architect",
      icon: <Zap className="h-6 w-6" />
    },
    {
      name: "Emma Davis",
      role: "Head of Research",
      bio: "PhD in Economics, crypto market specialist",
      icon: <Award className="h-6 w-6" />
    }
  ];

  const milestones = [
    { year: "2021", event: "Company founded", description: "Started with the vision to democratize crypto trading" },
    { year: "2022", event: "First algorithm launch", description: "Released our proprietary 200-week heatmap analysis" },
    { year: "2023", event: "10,000+ users", description: "Reached our first major user milestone" },
    { year: "2024", event: "Advanced forecasting", description: "Launched cycle prediction and signal automation" },
    { year: "2025", event: "Global expansion", description: "Serving traders in 50+ countries worldwide" }
  ];

  const values = [
    {
      title: "Transparency",
      description: "Open algorithms and clear performance metrics",
      icon: <Shield className="h-8 w-8 text-orange-400" />
    },
    {
      title: "Innovation",
      description: "Cutting-edge analysis tools and real-time insights",
      icon: <Zap className="h-8 w-8 text-orange-500" />
    },
    {
      title: "Community",
      description: "Building together with our trading community",
      icon: <Users className="h-8 w-8 text-orange-400" />
    },
    {
      title: "Excellence", 
      description: "Delivering professional-grade trading solutions",
      icon: <Award className="h-8 w-8 text-orange-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-background to-muted/20">
        <div className="container px-4 mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Bitcoin className="h-8 w-8 text-orange-500 mr-2" />
            <div className="flex flex-col items-center mb-4">
              <img 
                src="/proud-profits-logo.png" 
                alt="Proud Profits" 
                className="h-12 object-contain mb-2"
              />
              <Badge variant="secondary" className="text-lg px-4 py-1 bg-gradient-to-r from-[#4A9FE7]/20 to-[#FF6B47]/20 border-[#4A9FE7]/30">
                About Us
              </Badge>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Empowering <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Smart Trading
            </span> Decisions
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            We're a team of experienced traders, analysts, and engineers dedicated to providing
            professional-grade cryptocurrency trading insights and automation tools.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
              <Link href="/auth">
                <TrendingUp className="mr-2 h-5 w-5" />
                Start Trading
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">
                <Mail className="mr-2 h-5 w-5" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <Card className="mb-16">
            <CardContent className="p-12 text-center">
              <Target className="h-16 w-16 mx-auto mb-6 text-orange-500" />
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                To democratize access to professional-grade cryptocurrency analysis and trading tools.
                We believe every trader deserves access to the same high-quality insights and automation
                that institutional investors use to make informed decisions in the crypto markets.
              </p>
            </CardContent>
          </Card>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex justify-center mb-4">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-muted/20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experienced professionals from finance, technology, and cryptocurrency trading
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                    {member.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                  <p className="text-orange-500 font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Key milestones in building the future of cryptocurrency trading
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start mb-8 last:mb-0">
                <div className="flex-shrink-0 w-20 text-center">
                  <div className="crypto-gradient w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-sm font-semibold">{milestone.year}</div>
                </div>
                <div className="flex-1 ml-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">{milestone.event}</h3>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/20">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-muted-foreground">Active Traders</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$2.5B+</div>
              <div className="text-muted-foreground">Volume Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">89%</div>
              <div className="text-muted-foreground">Signal Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-muted-foreground">Countries Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Trading Smarter?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of traders who trust our analysis and automation tools
                to make better cryptocurrency trading decisions.
              </p>
              <div className="flex justify-center space-x-4">
                <Button asChild size="lg" className="crypto-gradient text-white">
                  <Link href="/auth">
                    Get Started Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/pricing">
                    View Plans
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}