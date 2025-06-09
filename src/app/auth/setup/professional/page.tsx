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
  workEmail: string;
  linkedinUrl: string;
}

const INDUSTRIES = [
  'Investment Banking',
  'Management Consulting', 
  'Private Equity',
  'Hedge Funds',
  'Technology',
  'Healthcare',
  'Real Estate',
  'Asset Management',
  'Venture Capital',
  'Corporate Finance',
  'Strategy Consulting',
  'Operations Consulting'
];

const EXPERTISE_OPTIONS = [
  'Investment Banking',
  'M&A',
  'Financial Modeling',
  'Management Consulting',
  'Case Interviews',
  'Strategy',
  'Private Equity',
  'LBO Modeling',
  'Due Diligence',
  'Hedge Funds',
  'Quantitative Research',
  'Trading',
  'Technology',
  'Software Engineering',
  'Product Management',
  'Data Science',
  'Healthcare',
  'Biotech',
  'Real Estate',
  'REIT Analysis',
  'Interview Prep',
  'Resume Review',
  'Career Coaching',
  'Leadership',
  'Networking'
];

export default function ProfessionalProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newExpertise, setNewExpertise] = useState('');
  
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

  const addExpertise = (expertise: string) => {
    if (expertise && !profile.expertise.includes(expertise)) {
      updateProfile({ 
        expertise: [...profile.expertise, expertise] 
      });
    }
  };

  const removeExpertise = (expertise: string) => {
    updateProfile({ 
      expertise: profile.expertise.filter(e => e !== expertise) 
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
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const validateLinkedInUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
    return linkedinPattern.test(url);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!profile.title || !profile.company || !profile.industry || !profile.bio) {
      alert('Please fill in all required fields (Title, Company, Industry, Bio)');
      return;
    }

    if (profile.bio.length < 50) {
      alert('Please write a bio of at least 50 characters to help candidates understand your background');
      return;
    }

    if (profile.sessionRateCents < 1000) {
      alert('Minimum session rate is $10');
      return;
    }

    if (profile.expertise.length === 0) {
      alert('Please select at least one area of expertise');
      return;
    }

    // Validate optional fields format
    if (profile.workEmail && !validateWorkEmail(profile.workEmail)) {
      alert('Please enter a valid work email address');
      return;
    }

    if (profile.linkedinUrl && !validateLinkedInUrl(profile.linkedinUrl)) {
      alert('Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/yourname)');
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
        // Check if Stripe onboarding URL was provided
        if (result.data?.stripeOnboardingUrl) {
          // Redirect to Stripe onboarding first
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

  const canSubmit = profile.title && profile.company && profile.industry && profile.bio && profile.expertise.length > 0;

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
            <span className="text-sm text-gray-500">Step 2 of 2</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full w-3/4"></div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Professional Profile</h1>
            <p className="text-gray-600">Share your experience to help candidates and start earning</p>
          </div>

          <div className="space-y-8">
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
                    placeholder="Vice President, Associate Partner, Principal..."
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
                    placeholder="Goldman Sachs, McKinsey, KKR..."
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
                    Years of Experience
                  </label>
                  <select
                    value={profile.yearsExperience}
                    onChange={(e) => updateProfile({ yearsExperience: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0}>0-1 years</option>
                    <option value={2}>2-3 years</option>
                    <option value={4}>4-5 years</option>
                    <option value={6}>6-7 years</option>
                    <option value={8}>8-10 years</option>
                    <option value={11}>11-15 years</option>
                    <option value={16}>15+ years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={profile.workEmail}
                    onChange={(e) => updateProfile({ workEmail: e.target.value })}
                    placeholder="john.doe@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - helps verify your employment for trust and credibility
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
                  <p className="text-xs text-gray-500 mt-1">
                    Helps candidates learn more about your background before booking
                  </p>
                </div>
              </div>
            </div>

            {/* Session Rate */}
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
                    onChange={(e) => updateProfile({ sessionRateCents: (parseFloat(e.target.value) || 0) * 100 })}
                    min="10"
                    max="500"
                    step="5"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Set your rate for 30-minute sessions. Most professionals charge $50-$200 based on seniority.
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <strong>You'll receive:</strong> ${((profile.sessionRateCents * 0.90) / 100).toFixed(2)} after platform fees (10%)
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Bio</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell candidates about yourself *
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => updateProfile({ bio: e.target.value })}
                  placeholder="I'm a VP at Goldman Sachs with 8 years in M&A. Previously worked at Blackstone and graduated from Wharton. I help candidates prepare for banking interviews and understand the industry landscape..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                  maxLength={500}
                  required
                />
                <div className="mt-1 flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Describe your background, experience, and how you can help candidates (min 50 characters)
                  </p>
                  <span className={`text-xs ${profile.bio.length < 50 ? 'text-red-500' : 'text-gray-500'}`}>
                    {profile.bio.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Expertise */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas of Expertise</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select your expertise areas *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {EXPERTISE_OPTIONS.map(expertise => (
                      <label key={expertise} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
                          className="text-indigo-600 focus:ring-indigo-500"
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
              disabled={!canSubmit || loading}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ease-out ${
                canSubmit && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Setting up your account...' : 'Complete Profile & Start Earning'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              You'll be redirected to Stripe to set up payments after completing your profile
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
                  Once you complete your profile, you'll receive payments instantly after each session. 
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