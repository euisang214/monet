'use client';

import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { log } from 'console';

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
  user: Session['user'] | undefined;
}

export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const {
    requiredRole,
    requireProfileComplete = false, // we don't require users to fully complete their profiles to navigate the website
    redirectTo = {
      noAuth: '/auth/signin',
      noRole: '/auth/setup',
      wrongRole: requiredRole === 'candidate' ? '/professional/dashboard' : '/candidate/dashboard'
      // incompleteProfile handled dynamically based on current role
    }
  } = options;

  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user?.id;
  const hasCorrectRole = !requiredRole || session?.user?.role === requiredRole;
  const hasCompleteProfile = !requireProfileComplete || !!session?.user?.profileComplete;

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
      const incomplete =
        redirectTo.incompleteProfile ||
        `/auth/setup/${session.user?.role ?? 'candidate'}`;
      router.push(incomplete);
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