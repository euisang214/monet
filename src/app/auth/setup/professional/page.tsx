'use client';

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { apiRequest } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProfessionalProfile {
  title: string;
  company: string;
  industry: string;
  yearsExperience: number;
  sessionRateCents: number;
  bio: string;
  expertise: string[];
  workEmail: string;
  linkedinUrl: string;
}

const PRESET_EXPERTISE = [
  'Investment Banking',
  'Consulting',
  'Software Engineering',
  'Product Management',
  'Data Science',
  'Finance',
  'Marketing',
  'Sales',
  'Operations',
  'Strategy',
  'Private Equity',
  'Venture Capital',
  'Hedge Funds',
  'Trading',
  'Risk Management',
  'Compliance',
  'Legal',
  'HR',
  'Recruiting'
];

const INDUSTRIES = [
  'technology',
  'finance',
  'consulting', 
  'healthcare',
  'education',
  'government',
  'non-profit',
  'energy',
  'real-estate',
  'retail',
  'manufacturing',
  'media',
  'telecommunications',
  'other'
];

export default function ProfessionalProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [newExpertise, setNewExpertise] = useState('');
    // Key prop removed; form does not require forced rerender
  
  const [profile, setProfile] = useState<ProfessionalProfile>({
    title: '',
    company: '',
    industry: '',
    yearsExperience: 0,
    sessionRateCents: 5000, // $50 default
    bio: '',
    expertise: [],
    workEmail: '',
    linkedinUrl: ''
  });

  const { isAuthenticated, isLoading } = useAuthGuard({
    requiredRole: 'professional',
    requireProfileComplete: false
  });

  // Stable function to fetch existing profile
  const fetchExistingProfile = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const result = await apiRequest<ProfessionalProfile>(
        `/api/auth/profile/${session.user.id}`
      );
      if (result.success && result.data) {
        setProfile(prev => ({
          ...prev,
          ...(result.data as Partial<ProfessionalProfile>),
          expertise: result.data?.expertise || []
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't show error for profile fetch, just log it
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (isAuthenticated && session?.user?.id && status === 'authenticated') {
      fetchExistingProfile();
    }
  }, [isAuthenticated, session?.user?.id, status, fetchExistingProfile]);

  const updateProfile = useCallback((updates: Partial<ProfessionalProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    setError(''); // Clear any previous errors when user starts typing
  }, []);

  const addExpertise = (expertiseItem: string) => {
    if (!profile.expertise.includes(expertiseItem)) {
      updateProfile({
        expertise: [...profile.expertise, expertiseItem]
      });
    }
  };

  const removeExpertise = (expertiseItem: string) => {
    updateProfile({
      expertise: profile.expertise.filter(item => item !== expertiseItem)
    });
  };

  const handleAddCustomExpertise = () => {
    if (newExpertise.trim() && !profile.expertise.includes(newExpertise.trim())) {
      addExpertise(newExpertise.trim());
      setNewExpertise('');
    }
  };

  const validateWorkEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailPattern = /^[^\s@]+@[^\s@]+$/;
    return emailPattern.test(email);
  };

  const validateLinkedInUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
    return linkedinPattern.test(url);
  };

  const handleSubmit = async () => {
    // Clear any previous errors
    setError('');

    // Validate required fields
    if (!profile.title || !profile.company || !profile.industry || !profile.bio) {
      setError('Please fill in all required fields (Title, Company, Industry, Bio)');
      return;
    }

    if (profile.bio.length < 50) {
      setError('Please write a bio of at least 50 characters to help candidates understand your background');
      return;
    }

    if (profile.sessionRateCents < 1000) {
      setError('Minimum session rate is $10');
      return;
    }

    if (profile.expertise.length === 0) {
      setError('Please select at least one area of expertise');
      return;
    }

    // Validate optional fields format
    if (profile.workEmail && !validateWorkEmail(profile.workEmail)) {
      setError('Please enter a valid work email address');
      return;
    }

    if (profile.linkedinUrl && !validateLinkedInUrl(profile.linkedinUrl)) {
      setError('Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/yourname)');
      return;
    }

    // Verify we have a valid session
    if (!session?.user?.id) {
      setError('Session expired. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Submitting professional profile:', { userId: session.user.id, ...profile });
      
      const result = await apiRequest<{ stripeOnboardingUrl?: string }>('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          role: 'professional',
          ...profile
        })
      });
      
      console.log('Profile submission result:', result);
      
      if (result.success) {
        // Check if Stripe onboarding URL was provided
        if (result.data?.stripeOnboardingUrl) {
          console.log('Redirecting to Stripe onboarding:', result.data.stripeOnboardingUrl);
          // Redirect to Stripe onboarding first
          window.location.href = result.data.stripeOnboardingUrl;
        } else {
          // Redirect to professional dashboard
          console.log('Profile completed successfully, redirecting to dashboard');
          router.push('/dashboard');
        }
      } else {
        // API returned an error - preserve form state and show error
        const errorMessage = result.error || 'Failed to save profile. Please try again.';
        console.error('Profile submission failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      // Network or other error - preserve form state and show error
      setError('Failed to save profile. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = profile.title && profile.company && profile.industry && profile.bio && profile.expertise.length > 0 && !loading;

  if (isLoading || status === 'loading') {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                Monet
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={session?.user?.image || undefined} 
                  alt={session?.user?.name || 'User'} 
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-600">{session?.user?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Complete Your Profile</span>
            <span className="text-sm text-gray-500">Step 2 of 2</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full w-3/4"></div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Professional Profile</h1>
            <p className="text-gray-600">
              Share your expertise and start earning from coffee chats
            </p>
          </div>

          <div className="space-y-8">
            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => updateProfile({ title: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => updateProfile({ company: e.target.value })}
                    placeholder="e.g., Google"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={profile.industry}
                    onChange={(e) => updateProfile({ industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(industry => (
                      <option key={industry} value={industry}>
                        {industry.charAt(0).toUpperCase() + industry.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <select
                    value={profile.yearsExperience}
                    onChange={(e) => updateProfile({ yearsExperience: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0}>Less than 1 year</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(year => (
                      <option key={year} value={year}>
                        {year} year{year !== 1 ? 's' : ''}
                      </option>
                    ))}
                    <option value={21}>20+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={profile.workEmail}
                    onChange={(e) => updateProfile({ workEmail: e.target.value })}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Helps verify your professional background
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={profile.linkedinUrl}
                    onChange={(e) => updateProfile({ linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Session Pricing */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Pricing</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Rate (30 minutes)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={profile.sessionRateCents / 100}
                    onChange={(e) => updateProfile({ sessionRateCents: Math.max(10, parseInt(e.target.value) || 50) * 100 })}
                    placeholder="50"
                    min="10"
                    step="5"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Most professionals charge $25-100 per session. You&apos;ll receive 90% after platform fees.
                </p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About You</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => updateProfile({ bio: e.target.value })}
                  placeholder="Tell candidates about your background, expertise, and what they can expect from a session with you..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profile.bio.length}/500 characters • Minimum 50 characters
                </p>
              </div>
            </div>

            {/* Expertise */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas of Expertise</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select your areas of expertise <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {PRESET_EXPERTISE.map(expertise => (
                      <label key={expertise} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.expertise.includes(expertise)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addExpertise(expertise);
                            } else {
                              removeExpertise(expertise);
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{expertise}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add custom expertise
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      placeholder="e.g., ESG Investing, Crypto Trading"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomExpertise()}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomExpertise}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected Expertise Tags */}
                {profile.expertise.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected expertise:</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.expertise.map(expertise => (
                        <span
                          key={expertise}
                          className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full"
                        >
                          {expertise}
                          <button
                            type="button"
                            onClick={() => removeExpertise(expertise)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ease-out ${
                canSubmit
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Setting up your account...' : 'Complete Profile & Start Earning'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              You&apos;ll be redirected to Stripe to set up payments after completing your profile
            </p>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-green-600 mt-0.5">💰</div>
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Start Earning Immediately</h4>
                <p className="text-sm text-green-800">
                  Once you complete your profile, you&apos;ll receive payments instantly after each session.
                  You can also earn referral bonuses by referring candidates to other professionals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}