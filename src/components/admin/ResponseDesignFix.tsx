import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Small modular components for responsive admin pages

export function AdminStats({ title, value, icon: Icon, trend }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: string;
}) {
  return (
    <Card className="p-3 sm:p-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-lg sm:text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminTableCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="overflow-x-auto">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
      {children}
    </div>
  );
}

export function MobileResponsiveButton({ children, ...props }: any) {
  return (
    <Button
      className="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
      {...props}
    >
      {children}
    </Button>
  );
}

export function StatusBadge({ status, size = "sm" }: { 
  status: 'active' | 'inactive' | 'pending' | 'enabled' | 'disabled'; 
  size?: 'sm' | 'md';
}) {
  const variants = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    inactive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    enabled: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    disabled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };

  return (
    <Badge 
      className={`${variants[status]} ${size === 'sm' ? 'text-xs px-1 py-0' : 'text-sm px-2 py-1'}`}
      variant="outline"
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}