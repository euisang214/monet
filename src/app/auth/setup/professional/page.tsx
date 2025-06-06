'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
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
}

const INDUSTRIES = [
  'Investment Banking',
  'Management Consulting', 
  'Private Equity',
  'Hedge Funds',
  'Technology',
  'Finance',
  'Healthcare',
  'Real Estate',
  'Other'
];

const COMMON_EXPERTISE = [
  'Interview Prep', 'Resume Review', 'Career Strategy', 'Networking',
  'Investment Banking', 'Management Consulting', 'Private Equity',
  'Software Engineering', 'Product Management', 'Data Science',
  'Financial Modeling', 'Valuation', 'Due Diligence', 'Client Relations'
];

export default function ProfessionalProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfessionalProfile>({
    title: '',
    company: '',
    industry: '',
    yearsExperience: 0,
    sessionRateCents: 5000, // $50 default
    bio: '',
    expertise: []
  });
  const [newExpertise, setNewExpertise] = useState('');

  const { isAuthenticated, isLoading } = useAuthGuard({
    requiredRole: 'professional',
    requireProfileComplete: false
  });

  useEffect(() => {
    if (isAuthenticated && session?.user?.id) {
      fetchExistingProfile();
    }
  }, [isAuthenticated, session]);

  const fetchExistingProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const result = await apiRequest(`/api/auth/profile/${session.user.id}`);
      if (result.success && result.data) {
        setProfile(prev => ({
          ...prev,
          ...result.data
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = (updates: Partial<ProfessionalProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const addExpertise = (skill: string) => {
    if (skill && !profile.expertise.includes(skill)) {
      updateProfile({ expertise: [...profile.expertise, skill] });
    }
    setNewExpertise('');
  };

  const removeExpertise = (skill: string) => {
    updateProfile({ expertise: profile.expertise.filter(s => s !== skill) });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!profile.title || !profile.company || !profile.industry || !profile.bio) {
      alert('Please fill in all required fields');
      return;
    }

    if (profile.sessionRateCents < 1000) {
      alert('Session rate must be at least $10');
      return;
    }

    setLoading(true);
    
    try {
      const result = await apiRequest('/api/auth/complete-profile', {
        method: 'POST',
        body: JSON.stringify({
          userId: session?.user?.id,
          role: 'professional',
          ...profile
        })
      });
      
      if (result.success) {
        // Check if Stripe onboarding is needed
        if (result.data?.stripeOnboardingUrl) {
          // Redirect to Stripe onboarding
          window.location.href = result.data.stripeOnboardingUrl;
        } else {
          // Redirect to professional dashboard
          router.push('/professional/dashboard');
        }
      } else {
        alert(result.error || 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = profile.title && profile.company && profile.industry && 
                   profile.bio.length >= 50 && profile.sessionRateCents >= 1000;

  if (isLoading) {
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
            <span className="text-sm text-gray-500">Almost done!</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full w-3/4"></div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Professional Profile</h1>
            <p className="text-gray-600">Tell us about your experience and set your mentoring rate</p>
          </div>

          <div className="space-y-6">
            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => updateProfile({ title: e.target.value })}
                    placeholder="Senior Associate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => updateProfile({ company: e.target.value })}
                    placeholder="Goldman Sachs"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <select
                    value={profile.industry}
                    onChange={(e) => updateProfile({ industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    value={profile.yearsExperience}
                    onChange={(e) => updateProfile({ yearsExperience: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Session Rate */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Rate</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate per 30-minute session *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={profile.sessionRateCents / 100}
                    onChange={(e) => updateProfile({ sessionRateCents: (parseFloat(e.target.value) || 0) * 100 })}
                    min="10"
                    max="500"
                    step="5"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Most professionals charge $50-$150 per session. You keep ~90% after platform fees.
                </p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Bio</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell candidates about your background *
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => updateProfile({ bio: e.target.value })}
                  placeholder="Tell candidates about your background, expertise, and what you can help them with..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                  required
                />
                <div className="mt-2 flex justify-between items-center">
                  <div className={`text-sm ${profile.bio.length < 50 ? 'text-red-500' : 'text-gray-500'}`}>
                    {profile.bio.length}/500 characters {profile.bio.length < 50 && '(minimum 50)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Expertise */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas of Expertise</h3>
              
              {/* Quick Add Buttons */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Quick add common skills:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_EXPERTISE.filter(skill => !profile.expertise.includes(skill)).slice(0, 8).map(skill => (
                    <button
                      key={skill}
                      onClick={() => addExpertise(skill)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Expertise Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newExpertise}
                  onChange={(e) => setNewExpertise(e.target.value)}
                  placeholder="Add custom expertise..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addExpertise(newExpertise);
                    }
                  }}
                />
                <button
                  onClick={() => addExpertise(newExpertise)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                >
                  Add
                </button>
              </div>

              {/* Selected Expertise */}
              {profile.expertise.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Your expertise areas:</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.expertise.map(skill => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-md flex items-center gap-2"
                      >
                        {skill}
                        <button
                          onClick={() => removeExpertise(skill)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Earnings Preview */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Earnings Preview</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>• <strong>Per session:</strong> ${((profile.sessionRateCents * 0.9) / 100).toFixed(0)} (after platform fees)</p>
                <p>• <strong>10 sessions/month:</strong> ${((profile.sessionRateCents * 0.9 * 10) / 100).toFixed(0)}</p>
                <p>• <strong>Plus:</strong> Referral bonuses and offer bonuses on top!</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ease-out ${
                canSubmit && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Setting Up Profile...' : 'Complete Profile & Start Earning'}
            </button>
            <p className="text-sm text-gray-500 text-center mt-2">
              Next: Set up payments with Stripe to receive your earnings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}