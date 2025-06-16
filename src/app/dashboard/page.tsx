'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.id) {
      router.replace('/auth/signin');
      return;
    }

    if (session.user.role === 'candidate') {
      router.replace('/candidate/dashboard');
    } else if (session.user.role === 'professional') {
      router.replace('/professional/dashboard');
    } else {
      router.replace('/auth/setup');
    }
  }, [status, session, router]);

  return <LoadingSpinner message="Loading dashboard..." />;
}
