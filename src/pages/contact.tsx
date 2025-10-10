import { useState } from "react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  MapPin,
  Clock,
  Send,
  CheckCircle,
  HelpCircle,
  Bug,
  Lightbulb
} from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "general",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to your backend
    toast({
      title: "Message sent successfully!",
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", subject: "", category: "general", message: "" });
  };

  const contactMethods = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email Support",
      description: "Get help via email",
      detail: "support@cryptostrategy.pro",
      action: "Send Email"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Live Chat",
      description: "Chat with our team",
      detail: "Available 24/7",
      action: "Start Chat"
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Phone Support",
      description: "Speak with an expert",
      detail: "+1 (555) 123-4567",
      action: "Call Now"
    }
  ];

  const categories = [
    { value: "general", label: "General Inquiry", icon: <HelpCircle className="h-4 w-4" /> },
    { value: "technical", label: "Technical Support", icon: <Bug className="h-4 w-4" /> },
    { value: "billing", label: "Billing Question", icon: <Mail className="h-4 w-4" /> },
    { value: "feature", label: "Feature Request", icon: <Lightbulb className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-background to-muted/20">
        <div className="container px-4 mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-orange-500 mr-2" />
            <Badge variant="secondary" className="text-lg px-4 py-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30">
              Contact Support
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Get in <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Have questions about our platform, need technical support, or want to share feedback? 
            Our team is here to help you succeed in your crypto trading journey.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center group hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:border-orange-500/30">
                <CardContent className="p-6">
                  <div className="crypto-gradient w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{method.title}</h3>
                  <p className="text-muted-foreground mb-4">{method.description}</p>
                  <p className="font-medium text-orange-500 mb-4">{method.detail}</p>
                  <Button variant="outline" className="hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors">
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="mr-2 h-5 w-5" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief description of your inquiry"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please provide details about your inquiry..."
                      className="min-h-32"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info & FAQ */}
            <div className="space-y-8">
              {/* Office Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Our Office
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Proud Profits</h4>
                    <p className="text-muted-foreground">
                      123 Financial District<br />
                      San Francisco, CA 94105<br />
                      United States
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Monday - Friday: 9:00 AM - 6:00 PM PST</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Answers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">How fast do you respond?</h4>
                    <p className="text-sm text-muted-foreground">
                      We aim to respond to all inquiries within 24 hours during business days.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Do you offer phone support?</h4>
                    <p className="text-sm text-muted-foreground">
                      Yes! Phone support is available for Pro and Enterprise customers.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Can I get a demo?</h4>
                    <p className="text-sm text-muted-foreground">
                      Absolutely! Contact us to schedule a personalized demo of our platform.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-400" />
                  <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
                  <p className="text-muted-foreground">
                    Our dedicated support team is available around the clock to help you succeed.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}