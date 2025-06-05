'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'professional' | ''>('');
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole === 'candidate') {
      router.push('/auth/signup/candidate');
    } else if (selectedRole === 'professional') {
      router.push('/auth/signup/professional');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
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
              <Link 
                href="/about" 
                className="text-gray-600 hover:text-gray-900 hover:scale-105 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-out"
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
              >
                About
              </Link>
              <Link 
                href="/how-it-works" 
                className="text-gray-600 hover:text-gray-900 hover:scale-105 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-out"
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
              >
                How It Works
              </Link>
              <Link 
                href="/auth/signin" 
                className="text-gray-600 hover:text-gray-900 hover:scale-105 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-out"
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Join Monet
            </h1>
            <p className="text-gray-600">
              Choose your account type to get started
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Candidate Option */}
            <button
              onClick={() => setSelectedRole('candidate')}
              className={`w-full p-6 border-2 rounded-lg text-left transition-all duration-300 ease-out hover:scale-105 ${
                selectedRole === 'candidate'
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                  selectedRole === 'candidate' 
                    ? 'border-indigo-600 bg-indigo-600' 
                    : 'border-gray-300'
                }`}>
                  {selectedRole === 'candidate' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    I'm a Candidate 🎓
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    I'm a student or recent graduate looking to connect with professionals for career advice and opportunities.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">Book coffee chats</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">Get feedback</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md">Build network</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Professional Option */}
            <button
              onClick={() => setSelectedRole('professional')}
              className={`w-full p-6 border-2 rounded-lg text-left transition-all duration-300 ease-out hover:scale-105 ${
                selectedRole === 'professional'
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                  selectedRole === 'professional' 
                    ? 'border-indigo-600 bg-indigo-600' 
                    : 'border-gray-300'
                }`}>
                  {selectedRole === 'professional' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    I'm a Professional 💼
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    I'm an experienced professional who wants to mentor candidates and earn money sharing my expertise.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">Earn per session</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">Offer bonuses</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md">Referral rewards</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ease-out ${
              selectedRole
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            style={{
              transitionTimingFunction: selectedRole ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined
            }}
          >
            Continue →
          </button>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link 
                href="/auth/signin" 
                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors duration-200"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 mt-0.5">💡</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Getting Started</h4>
                <p className="text-sm text-blue-800">
                  Both candidates and professionals go through a quick verification process to ensure quality connections for everyone.
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