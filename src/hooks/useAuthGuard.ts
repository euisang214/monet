'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardOptions {
  requiredRole?: 'candidate' | 'professional';
  requireProfileComplete?: boolean;
  redirectTo?: {
    noAuth?: string;
    noRole?: string;
    wrongRole?: string;
    incompleteProfile?: string;
  };
}

interface AuthGuardReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCorrectRole: boolean;
  user: any;
}

export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const {
    requiredRole,
    requireProfileComplete = true,
    redirectTo = {
      noAuth: '/auth/signin',
      noRole: '/auth/setup',
      wrongRole: requiredRole === 'candidate' ? '/professional/dashboard' : '/candidate/dashboard',
      incompleteProfile: requiredRole === 'candidate' ? '/auth/setup/candidate' : '/auth/setup/professional'
    }
  } = options;

  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user?.id;
  const hasCorrectRole = !requiredRole || session?.user?.role === requiredRole;
  const hasCompleteProfile = !requireProfileComplete || session?.user?.profileComplete;

  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (!isAuthenticated) {
      router.push(redirectTo.noAuth!);
      return;
    }

    // Check if role is set
    if (!session.user?.role) {
      router.push(redirectTo.noRole!);
      return;
    }

    // Check role requirement
    if (requiredRole && !hasCorrectRole) {
      router.push(redirectTo.wrongRole!);
      return;
    }

    // Check profile completion
    if (requireProfileComplete && !hasCompleteProfile) {
      router.push(redirectTo.incompleteProfile!);
      return;
    }
  }, [
    isLoading, 
    isAuthenticated, 
    hasCorrectRole, 
    hasCompleteProfile, 
    router, 
    session,
    redirectTo,
    requiredRole,
    requireProfileComplete
  ]);

  return {
    isLoading,
    isAuthenticated: isAuthenticated && hasCorrectRole && hasCompleteProfile,
    hasCorrectRole,
    user: session?.user
  };
}