import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { hasAccess } from '@/lib/subscriptionUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Crown, Lock, ArrowUp } from 'lucide-react';

interface ProOnlyGuardProps {
  children: React.ReactNode;
  featureName?: string;
}

export default function ProOnlyGuard({ children, featureName = "Pro Feature" }: ProOnlyGuardProps) {
  const { user } = useAuth();
  const userTier = user?.subscriptionTier || 'free';
  
  // Check if user has pro access
  const hasProAccess = hasAccess(userTier, 'moodBoard'); // Using moodBoard as proxy for pro features
  
  // Log for debugging
  console.log(`🎯 PRO GUARD CHECK: userTier=${userTier}, hasProAccess=${hasProAccess}`);
  
  if (!hasProAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full">
                  <Crown className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">
                {featureName}
              </CardTitle>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Requires:</span>
                <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold">
                  PRO PLAN
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                This feature is exclusively available for Pro plan subscribers. 
                Upgrade now to unlock advanced analytics and premium features.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>Your current plan:</span>
                <Badge variant="outline" className="capitalize">
                  {userTier}
                </Badge>
              </div>
              
              <Link href="/subscription">
                <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro Plan
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </Link>
              
              <div className="pt-4 border-t">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Return to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}