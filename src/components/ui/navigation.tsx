'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";

interface NavigationProps {
  variant?: 'public' | 'candidate' | 'professional';
  showDashboardLink?: boolean;
  currentPage?: string;
}

export default function Navigation({ 
  variant = 'public', 
  showDashboardLink = false,
  currentPage 
}: NavigationProps) {
  const { data: session } = useSession();

  const renderPublicLinks = () => (
    <>
      <Link 
        href="/about" 
        className={`text-gray-600 hover:text-gray-900 hover:scale-105 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-out ${
          currentPage === 'about' ? 'text-gray-900 font-semibold' : ''
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        About
      </Link>
      <Link 
        href="/how-it-works" 
        className={`text-gray-600 hover:text-gray-900 hover:scale-105 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-out ${
          currentPage === 'how-it-works' ? 'text-gray-900 font-semibold' : ''
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        How It Works
      </Link>
    </>
  );

  const renderAuthLinks = () => {
    if (session?.user) {
      // Authenticated user
      return (
        <div className="flex items-center space-x-4">
          {showDashboardLink && (
            <Link 
              href={variant === 'candidate' ? '/candidate/dashboard' : '/professional/dashboard'}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </Link>
          )}
          
          {variant === 'candidate' && (
            <Link 
              href="/candidate/search"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Browse Professionals
            </Link>
          )}
          
          {variant === 'professional' && (
            <Link 
              href="/candidate/search"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Browse Candidates
            </Link>
          )}

          <div className="flex items-center space-x-2">
            <img 
              src={session.user.image || undefined} 
              alt={session.user.name || 'User'} 
              className="w-8 h-8 rounded-full"
            />
            <span className="text-gray-600">{session.user.name}</span>
          </div>
        </div>
      );
    } else {
      // Unauthenticated user
      return (
        <>
          <Link 
            href="/auth/signin" 
            className={`text-gray-600 hover:text-gray-900 hover:scale-105 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-out ${
              currentPage === 'signin' ? 'text-gray-900 font-semibold' : ''
            }`}
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            Login
          </Link>
          <Link 
            href="/auth/signup" 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            Sign Up
          </Link>
        </>
      );
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                Monet
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {variant === 'public' && renderPublicLinks()}
            {renderAuthLinks()}
          </div>
        </div>
      </div>
    </nav>
  );
}