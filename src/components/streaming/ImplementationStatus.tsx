import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Settings } from 'lucide-react';

interface ImplementationStatusProps {
  features: Array<{
    feature: string;
    status: 'implemented' | 'partial' | 'not-implemented' | 'optional';
    description: string;
    component?: string;
  }>;
}

export default function ImplementationStatus({ features }: ImplementationStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'optional':
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      implemented: 'bg-green-500/10 text-green-500 border-green-500/20',
      partial: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'not-implemented': 'bg-red-500/10 text-red-500 border-red-500/20',
      optional: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };

    const labels = {
      implemented: 'Implemented',
      partial: 'Partial',
      'not-implemented': 'Not Implemented',
      optional: 'Optional',
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Implementation Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="space-y-2 p-3 border border-border/50 rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                {getStatusIcon(feature.status)}
                <h4 className="font-medium">{feature.feature}</h4>
              </div>
              {getStatusBadge(feature.status)}
            </div>
            
            <p className="text-sm text-muted-foreground pl-6">
              {feature.description}
            </p>
            
            {feature.component && (
              <div className="pl-6">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {feature.component}
                </code>
              </div>
            )}
          </div>
        ))}
        
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Status</span>
            <Badge 
              variant="outline"
              className="bg-green-500/10 text-green-500 border-green-500/20"
            >
              {features.filter(f => f.status === 'implemented').length} / {features.length} Complete
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}