'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EnhancedCandidateDashboard from '@/app/components/EnhancedCandidateDashboard';

export default function CandidateDashboardPage() {
  const { isAuthenticated, isLoading } = useAuthGuard({ 
    requiredRole: 'candidate',
    requireProfileComplete: true 
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useAuthGuard
  }

  return <EnhancedCandidateDashboard />;
}