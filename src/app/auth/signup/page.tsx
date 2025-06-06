'use client';

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/ui/Navigation";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to signin page since we now use OAuth
    router.push('/auth/signin');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="public" />
      
      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Redirecting to Sign In
          </h1>
          <p className="text-gray-600 mb-6">
            We've streamlined our signup process. You'll sign in with Google or LinkedIn and then choose your account type.
          </p>
          <Link 
            href="/auth/signin"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors inline-block"
          >
            Continue to Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}