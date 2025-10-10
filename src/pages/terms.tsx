import Navigation from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  FileText, 
  Scale, 
  AlertTriangle, 
  Shield,
  DollarSign,
  Ban,
  CheckCircle,
  ArrowLeft,
  Gavel
} from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-background to-muted/20">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <Scale className="h-8 w-8 text-primary mr-2" />
              <Badge variant="secondary" className="text-lg px-4 py-1">
                Terms of Service
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Terms of <span className="crypto-gradient bg-clip-text text-transparent">
                Service
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Please read these terms carefully before using our platform
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
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Welcome to Proud Profits. These Terms of Service ("Terms") govern your use of our 
                  cryptocurrency trading platform and services. By accessing or using our services, you 
                  agree to be bound by these Terms.
                </p>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        Important Disclaimer
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cryptocurrency trading involves substantial risk of loss. Our signals and analysis are for 
                        informational purposes only and do not constitute financial advice.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Service Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Proud Profits provides cryptocurrency trading signals, market analysis, and educational content. 
                  Our services include:
                </p>
                <ul className="space-y-2">
                  {[
                    "Real-time trading signals and market alerts",
                    "Technical analysis tools and charts",
                    "200-week heatmap and cycle forecasting",
                    "Market data and price tracking",
                    "Educational content and trading insights"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* User Obligations */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  User Obligations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Account Responsibility</h4>
                    <p className="text-sm text-muted-foreground">
                      You are responsible for maintaining the confidentiality of your account credentials 
                      and for all activities that occur under your account.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Accurate Information</h4>
                    <p className="text-sm text-muted-foreground">
                      You must provide accurate and complete information when creating your account 
                      and keep this information updated.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Compliance</h4>
                    <p className="text-sm text-muted-foreground">
                      You must comply with all applicable laws and regulations in your jurisdiction 
                      when using our services.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prohibited Activities */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ban className="mr-2 h-5 w-5" />
                  Prohibited Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  You may not use our services for any illegal or unauthorized purposes, including but not limited to:
                </p>
                <ul className="space-y-2">
                  {[
                    "Violating any local, state, national, or international law",
                    "Attempting to gain unauthorized access to our systems",
                    "Interfering with or disrupting our services",
                    "Creating multiple accounts to circumvent limitations",
                    "Sharing or reselling our proprietary signals or content"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Ban className="h-4 w-4 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Financial Disclaimer */}
            <Card className="mb-8 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Financial Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                      High Risk Warning
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Trading cryptocurrencies carries a high level of risk and may not be suitable for all investors. 
                      You could lose some or all of your invested capital.
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Our signals are for informational purposes only</li>
                    <li>• Past performance does not guarantee future results</li>
                    <li>• You should not invest more than you can afford to lose</li>
                    <li>• Consider seeking independent financial advice</li>
                    <li>• We are not liable for any trading losses</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Subscription Billing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Monthly or annual billing cycles</li>
                      <li>• Automatic renewal unless cancelled</li>
                      <li>• Pro-rated refunds within 7 days</li>
                      <li>• Price changes with 30-day notice</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Cancellation</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Cancel anytime from account settings</li>
                      <li>• Access continues until period end</li>
                      <li>• No partial refunds for unused time</li>
                      <li>• Data export available upon request</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gavel className="mr-2 h-5 w-5" />
                  Limitation of Liability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  To the maximum extent permitted by law, Proud Profits and its affiliates shall not be 
                  liable for any indirect, incidental, special, consequential, or punitive damages, including 
                  but not limited to trading losses, loss of profits, or loss of data.
                </p>
                <p className="text-sm text-muted-foreground">
                  Our total liability to you for all claims arising from or relating to these Terms or our 
                  services shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <Scale className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-4">Questions About These Terms?</h3>
                <p className="text-muted-foreground mb-6">
                  If you have any questions about these Terms of Service, please contact our legal team.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button asChild className="crypto-gradient text-white">
                    <Link href="/contact">
                      Contact Us
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="mailto:legal@cryptostrategy.pro">
                      legal@cryptostrategy.pro
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Footer Note */}
            <div className="mt-8 p-6 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                These Terms of Service may be updated from time to time. We will notify you of any 
                material changes by posting the new Terms on this page. Your continued use of our 
                services after such modifications constitutes acceptance of the updated Terms.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}