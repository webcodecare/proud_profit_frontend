import Navigation from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Share2,
  AlertTriangle,
  CheckCircle,
  FileText,
  ArrowLeft
} from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: <Database className="h-5 w-5" />,
      content: [
        "Account information (email, name, preferences)",
        "Trading preferences and alert settings",
        "Usage data and platform interactions",
        "Device and browser information",
        "Payment information (processed securely by third parties)"
      ]
    },
    {
      id: "information-use",
      title: "How We Use Your Information", 
      icon: <Eye className="h-5 w-5" />,
      content: [
        "Provide and improve our trading services",
        "Send trading signals and market alerts",
        "Customize your platform experience",
        "Process payments and subscriptions",
        "Comply with legal requirements"
      ]
    },
    {
      id: "information-sharing",
      title: "Information Sharing",
      icon: <Share2 className="h-5 w-5" />,
      content: [
        "We do not sell your personal information",
        "Third-party service providers (payment processors, email services)",
        "Legal compliance when required by law",
        "Business transfers with user notification",
        "Aggregated, anonymized data for analytics"
      ]
    },
    {
      id: "data-security",
      title: "Data Security",
      icon: <Lock className="h-5 w-5" />,
      content: [
        "Industry-standard encryption (AES-256)",
        "Secure HTTPS connections for all data transmission",
        "Regular security audits and vulnerability assessments",
        "Limited access controls and employee training",
        "Incident response procedures"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-background to-muted/20">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary mr-2" />
              <Badge variant="secondary" className="text-lg px-4 py-1">
                Privacy Policy
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your Privacy <span className="crypto-gradient bg-clip-text text-transparent">
                Matters
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Learn how we collect, use, and protect your personal information
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <span>Last updated: January 1, 2025</span>
              <span>•</span>
              <span>Effective: January 1, 2025</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* Introduction */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  At Proud Profits, we are committed to protecting your privacy and ensuring the security 
                  of your personal information. This Privacy Policy explains how we collect, use, disclose, 
                  and safeguard your information when you use our cryptocurrency trading platform and services.
                </p>
              </CardContent>
            </Card>

            {/* Main Sections */}
            <div className="space-y-8">
              {sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {section.icon}
                      <span className="ml-2">{section.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="mr-2 h-5 w-5" />
                    Your Rights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Access your personal data</li>
                    <li>• Correct inaccurate information</li>
                    <li>• Delete your account and data</li>
                    <li>• Export your data</li>
                    <li>• Opt-out of marketing communications</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Cookies & Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Essential cookies for platform functionality</li>
                    <li>• Analytics cookies for service improvement</li>
                    <li>• Preference cookies for user experience</li>
                    <li>• No third-party advertising cookies</li>
                    <li>• You can manage cookie preferences</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* International Transfers */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>International Data Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Your information may be transferred to and processed in countries other than your own. 
                  We ensure appropriate safeguards are in place to protect your data during such transfers, 
                  including:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Standard contractual clauses approved by regulatory authorities</li>
                  <li>• Adequacy decisions for countries with equivalent protection</li>
                  <li>• Certification schemes and codes of conduct</li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-4">Questions About Privacy?</h3>
                <p className="text-muted-foreground mb-6">
                  If you have any questions about this Privacy Policy or our data practices, 
                  please don't hesitate to contact us.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button asChild className="crypto-gradient text-white">
                    <Link href="/contact">
                      Contact Us
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="mailto:privacy@cryptostrategy.pro">
                      privacy@cryptostrategy.pro
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Footer Note */}
            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                This Privacy Policy may be updated from time to time. We will notify you of any 
                material changes by posting the new Privacy Policy on this page and updating the 
                "Last updated" date. Your continued use of our services after such modifications 
                constitutes acceptance of the updated Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}