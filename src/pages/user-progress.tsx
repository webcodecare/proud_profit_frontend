import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import UserProgressDashboard from '@/components/progress/UserProgressDashboard';
import AuthGuard from '@/components/auth/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';

export default function UserProgressPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 p-4 sm:p-6 lg:p-8">
          <UserProgressDashboard />
        </div>
      </div>
    </AuthGuard>
  );
}