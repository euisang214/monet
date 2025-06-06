'use client';

import Link from "next/link";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/ui/Navigation";

export default function SignInPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSocialSignIn = async (provider: 'google' | 'linkedin') => {
    setLoading(provider);
    
    try {
      const result = await signIn(provider, { 
        redirect: false,
        callbackUrl: '/auth/setup' // Redirect to role selection after OAuth
      });
      
      if (result?.ok) {
        // Check if user needs to complete profile setup
        const session = await getSession();
        if (session?.user) {
          // Redirect based on user role or to setup if new user
          router.push('/auth/setup');
        }
      } else if (result?.error) {
        alert('Failed to sign in. Please try again.');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="public" currentPage="signin" />

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your Monet account
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button 
              onClick={() => handleSocialSignIn('google')}
              disabled={loading !== null}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:scale-105 transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'google' ? (
                <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
              ) : (
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-gray-700 font-medium">
                {loading === 'google' ? 'Signing in...' : 'Sign in with Google'}
              </span>
            </button>

            <button 
              onClick={() => handleSocialSignIn('linkedin')}
              disabled={loading !== null}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:scale-105 transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'linkedin' ? (
                <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
              ) : (
                <svg className="w-5 h-5 mr-3" fill="#0A66C2" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              )}
              <span className="text-gray-700 font-medium">
                {loading === 'linkedin' ? 'Signing in...' : 'Sign in with LinkedIn'}
              </span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors duration-200"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Secure OAuth Login</h4>
                <p className="text-sm text-blue-800">
                  We use your Google or LinkedIn profile to verify your identity and auto-populate your professional information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 Monet. Built with Next.js, MongoDB, and Stripe.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}