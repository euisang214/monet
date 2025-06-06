'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EnhancedProDashboard from '@/app/components/EnhancedProDashboard';

export default function ProfessionalDashboardPage() {
  const { isAuthenticated, isLoading } = useAuthGuard({ 
    requiredRole: 'professional',
    requireProfileComplete: true 
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useAuthGuard
  }

  return <EnhancedProDashboard />;
}