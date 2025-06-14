'use client';

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

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
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/' 
    });
  };

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
              href="/professional/dashboard#candidates"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Browse Candidates
            </Link>
          )}

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <img 
                src={session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name || 'User')}&size=32&background=4f46e5&color=ffffff`} 
                alt={session.user.name || 'User'} 
                className="w-8 h-8 rounded-full"
              />
              <span className="hidden md:inline-block text-sm">{session.user.name}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-600">{session.user.email}</p>
                  {session.user.role && (
                    <p className="text-xs text-indigo-600 capitalize mt-1">{session.user.role}</p>
                  )}
                </div>
                
                <Link
                  href="/profile/edit"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Profile</span>
                  </div>
                </Link>

                <Link
                  href="/profile/switch-role"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Switch Role</span>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleSignOut();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </div>
                </button>
              </div>
            )}
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
      
      {/* Backdrop to close menu when clicking outside */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
}
