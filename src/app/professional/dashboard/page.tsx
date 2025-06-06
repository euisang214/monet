'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import EnhancedProDashboard from '@/app/components/EnhancedProDashboard';

export default function ProfessionalDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      // Not authenticated, redirect to signin
      router.push('/auth/signin');
      return;
    }

    if (!session.user?.role) {
      // No role set, redirect to setup
      router.push('/auth/setup');
      return;
    }

    if (session.user.role !== 'professional') {
      // Wrong role, redirect to candidate dashboard
      router.push('/candidate/dashboard');
      return;
    }

    if (!session.user.profileComplete) {
      // Profile not complete, redirect to setup
      router.push('/auth/setup/professional');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.id || session.user.role !== 'professional') {
    return null; // Will redirect
  }

  return <EnhancedProDashboard />;
}