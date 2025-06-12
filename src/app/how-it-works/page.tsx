'use client';
import Link from "next/link";
import { useState } from "react";
import Navigation from "@/components/ui/Navigation";

export default function HowItWorksPage() {
  const [activeView, setActiveView] = useState<'candidates' | 'professionals'>('candidates');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="public" currentPage="how-it-works" />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            How It Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Simple, transparent steps to unlock career opportunities through meaningful connections.
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveView('candidates')}
              className={`px-6 py-3 rounded-md font-semibold transition-all duration-500 ease-out ${
                activeView === 'candidates'
                  ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              1️⃣ For Candidates
            </button>
            <button
              onClick={() => setActiveView('professionals')}
              className={`px-6 py-3 rounded-md font-semibold transition-all duration-500 ease-out ${
                activeView === 'professionals'
                  ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              2️⃣ For Professionals
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 transition-all duration-700 ease-out" style={{
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}>
          {activeView === 'candidates' && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">For Candidates</h2>
                <p className="text-gray-600 text-lg">Your step-by-step journey to career success</p>
              </div>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start space-x-6 p-6 bg-indigo-50 rounded-lg">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Browse professionals by firm, role, and industry.</h3>
                    <p className="text-gray-600">Search our curated network of professionals from top firms. Filter by company, role, and industry to find the perfect mentor for your career goals.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-6 p-6 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Book paid 1:1 coffee chats directly through the platform.</h3>
                    <p className="text-gray-600">Secure your session with instant booking and payment. Professional rates are transparent, and you&apos;ll receive confirmation within 24 hours.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-6 p-6 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Meet via verified Zoom sessions — no informal backchannels.</h3>
                    <p className="text-gray-600">Professional, structured video calls with calendar integration. Every session is documented and follows our quality standards.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-6 p-6 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Receive actionable written feedback after each chat.</h3>
                    <p className="text-gray-600">Get detailed, structured feedback on your interview skills, resume, and career positioning. Use these insights to improve for future opportunities.</p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start space-x-6 p-6 bg-yellow-50 rounded-lg">
                  <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Build relationships and gain access to referral opportunities.</h3>
                    <p className="text-gray-600">Strong sessions can lead to internal referrals, follow-up conversations, and access to opportunities that aren&apos;t publicly posted.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'professionals' && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">For Professionals</h2>
                <p className="text-gray-600 text-lg">Monetize your expertise while building the next generation of talent</p>
              </div>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start space-x-6 p-6 bg-indigo-50 rounded-lg">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Get paid for each completed session.</h3>
                    <p className="text-gray-600">Set your own rates and receive instant payments after each session. Our platform handles all payment processing and ensures you&apos;re compensated fairly for your time.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-6 p-6 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Provide written feedback to help candidates improve.</h3>
                    <p className="text-gray-600">Share structured feedback that helps candidates grow. Your insights directly impact their career trajectory and build your reputation as a mentor.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-6 p-6 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Refer candidates where appropriate — and earn referral rewards.</h3>
                    <p className="text-gray-600">When you refer strong candidates to other professionals or roles, you earn referral bonuses. Plus, if a candidate you mentored gets hired at your firm, you receive an offer bonus.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-6 p-6 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Grow your network and contribute to building a stronger, more inclusive pipeline of talent.</h3>
                    <p className="text-gray-600">Connect with other professionals, expand your industry network, and help create pathways for diverse talent to enter competitive industries.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Ready to get started?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {activeView === 'candidates' ? (
              <>
                <Link 
                  href="/candidate/search"
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out"
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  Browse Professionals →
                </Link>
                <button
                  onClick={() => setActiveView('professionals')}
                  className="text-indigo-600 hover:text-indigo-800 hover:scale-105 px-8 py-3 text-lg font-semibold underline transition-all duration-300 ease-out"
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  Are you a professional?
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/auth/signup"
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out"
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  Join as a Mentor →
                </Link>
                <button
                  onClick={() => setActiveView('candidates')}
                  className="text-indigo-600 hover:text-indigo-800 hover:scale-105 px-8 py-3 text-lg font-semibold underline transition-all duration-300 ease-out"
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  Are you a candidate?
                </button>
              </>
            )}
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