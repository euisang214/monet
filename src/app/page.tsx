'use client';

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "Who are the professionals on Monet?",
      answer: "Our professionals are current employees at top firms in investment banking and consulting, verified through professional credentials and company email domains."
    },
    {
      question: "What happens after I book a chat?",
      answer: "Once the professional confirms a time, you'll receive an automated calendar invite and Zoom link. After the session, you'll get written feedback from the professional — and if the conversation went well, the professional may refer you to another professional at their firm."
    },
    {
      question: "How do referrals work?",
      answer: "If you speak with a professional and you accept an offer at their firm, they receive an offer bonus, creating a natural incentive for professionals to help you succeed. All offer acceptances will be verified to maintain mutual integrity."
    },
    {
      question: "How is payment handled?",
      answer: "All payments are processed securely via Stripe. We take a 15% platform fee to cover operations and ensure ongoing quality."
    },
    {
      question: "Is there a cap on how many referrals a professional can make?",
      answer: "Yes. To maintain the integrity of the referral system, each professional is capped to three referrals a month–prioritizing quality over volume."
    },
    {
      question: "What industries does Monet currently cover?",
      answer: "We are currently focused on investment banking and consulting but plan to expand into adjacent industries based on demand."
    },
    {
      question: "Can I sign up if I'm in school?",
      answer: "Yes! All of our candidates are current students or recent graduates preparing for internships and full-time recruiting."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                About
              </Link>
              <Link 
                href="/how-it-works" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                How It Works
              </Link>
              <Link 
                href="/auth/signin" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Unlock Careers Over
            <span className="text-indigo-600"> Coffee</span>
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
            Book 1:1 chats with top professionals.
          </p>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get real advice. Build real connections.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/candidate/search"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Book Your First Chat →
            </Link>
            <Link 
              href="/auth/signup"
              className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Professionals? Earn by mentoring →
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* For Students */}
            <div className="text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">For Students</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 text-xl mt-1">✅</span>
                  <p className="text-gray-700 text-lg">
                    Instantly book paid 1:1 chats with verified professionals in your target field
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 text-xl mt-1">✅</span>
                  <p className="text-gray-700 text-lg">
                    Receive written feedback from a professional after each session
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 text-xl mt-1">✅</span>
                  <p className="text-gray-700 text-lg">
                    Tap into a powerful, growing network — connect with professionals who can refer you and expand your access to top opportunities
                  </p>
                </div>
              </div>
            </div>

            {/* For Professionals */}
            <div className="text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">For Professionals</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 text-xl mt-1">✅</span>
                  <p className="text-gray-700 text-lg">
                    Set your own chat fee and get paid per session
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 text-xl mt-1">✅</span>
                  <p className="text-gray-700 text-lg">
                    Earn an offer bonus when a candidate you mentored accepts an offer
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-500 text-xl mt-1">✅</span>
                  <p className="text-gray-700 text-lg">
                    Refer candidates to professionals and earn perpetual referral bonuses as they chat
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Seamless Booking & Payments</h3>
              <p className="text-gray-600">
                Stripe-powered, secure checkout for all chats
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Professionals</h3>
              <p className="text-gray-600">
                Professionals are curated by industry, company, and role
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparent Incentives</h3>
              <p className="text-gray-600">
                Offer bonuses + referral rewards = aligned success for both sides
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Everything you need to know about getting started</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
                >
                  <h3 className="text-lg font-bold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-all duration-500 ease-out ${
                        expandedFAQ === index ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div
                  className={`transition-all duration-700 ease-out ${
                    expandedFAQ === index 
                      ? 'max-h-96 opacity-100 transform translate-y-0' 
                      : 'max-h-0 opacity-0 transform -translate-y-2'
                  } overflow-hidden`}
                  style={{
                    transitionTimingFunction: expandedFAQ === index 
                      ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Spring-like expand
                      : 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Smooth collapse
                  }}
                >
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to turn conversations into opportunities?
          </h2>
          <Link 
            href="/candidate/search"
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Get Started →
          </Link>
        </div>
      </div>

      {/* Development Links - Remove in production */}
      <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">Development Dashboard Links</h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/candidate/dashboard"
            className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
          >
            View Candidate Dashboard
          </Link>
          <Link 
            href="/professional/dashboard"
            className="bg-green-100 text-green-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
          >
            View Professional Dashboard
          </Link>
        </div>
        <p className="text-xs text-yellow-700 mt-2 text-center">
          These links will be removed in production when authentication is implemented
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 Monet. Built with Next.js, MongoDB, and Stripe.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}