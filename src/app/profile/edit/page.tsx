'use client';

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { apiRequest } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Navigation from '@/components/ui/Navigation';
import { uploadFile, validateFile } from '@/lib/upload';

interface ProfileData {
  // Common fields
  name: string;
  email: string;
  linkedinUrl: string;
  
  // Candidate fields
  school?: string;
  major?: string;
  minor?: string;
  graduationYear?: string;
  gpa?: string;
  targetRole?: string;
  targetIndustry?: string;
  offerBonusCents?: number;
  schoolEmail?: string;
  resumeUrl?: string;
  clubs?: string;
  
  // Professional fields
  title?: string;
  company?: string;
  industry?: string;
  yearsExperience?: number;
  sessionRateCents?: number;
  bio?: string;
  expertise?: string[];
  workEmail?: string;
}

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

export default function ProfileEditPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [resumePreview, setResumePreview] = useState<string>('');
  const [newExpertise, setNewExpertise] = useState('');

  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    linkedinUrl: '',
    expertise: [],
    offerBonusCents: 20000, // Default $200
    sessionRateCents: 5000  // Default $50
  });

  const { isAuthenticated, isLoading, user } = useAuthGuard({
    requireProfileComplete: true
  });

  // Stable function to fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const result = await apiRequest<ProfileData>(
        `/api/auth/profile/${session.user.id}`
      );
      if (result.success && result.data) {
        const data = result.data;
        setProfile(prev => ({
          ...prev,
          ...data,
          expertise: data.expertise || []
        }));
        
        // Set resume preview if resume exists
        if (data.resumeUrl) {
          const fileName = data.resumeUrl.split('/').pop() || 'Resume uploaded';
          setResumePreview(fileName);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.email]);

  useEffect(() => {
    if (isAuthenticated && session?.user?.id && status === 'authenticated') {
      fetchProfile();
    }
  }, [isAuthenticated, session?.user?.id, status, fetchProfile]);

  const updateProfile = useCallback((updates: Partial<ProfileData>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    setError(''); // Clear any previous errors when user starts typing
    setSuccess(''); // Clear success message when user makes changes
  }, []);

  const handleResumeUpload = async (file: File) => {
    const validation = validateFile(file, 'resume');
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploadingResume(true);
    setError('');

    try {
      const result = await uploadFile(file, 'resume', session?.user?.id);
      if (result.success) {
        updateProfile({ resumeUrl: result.fileUrl });
        setResumePreview(file.name);
        setSuccess('Resume uploaded successfully!');
      } else {
        setError(result.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      setError('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const addExpertise = (expertiseItem: string) => {
    if (!profile.expertise?.includes(expertiseItem)) {
      updateProfile({
        expertise: [...(profile.expertise || []), expertiseItem]
      });
    }
  };

  const removeExpertise = (expertiseItem: string) => {
    updateProfile({
      expertise: (profile.expertise || []).filter(item => item !== expertiseItem)
    });
  };

  const handleAddCustomExpertise = () => {
    if (newExpertise.trim() && !(profile.expertise || []).includes(newExpertise.trim())) {
      addExpertise(newExpertise.trim());
      setNewExpertise('');
    }
  };

  const validateLinkedInUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
    return linkedinPattern.test(url);
  };

  const validateSchoolEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const eduPattern = /^[^\s@]+@[^\s@]+\.edu$/;
    return eduPattern.test(email);
  };

  const validateWorkEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailPattern = /^[^\s@]+@[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleSubmit = async () => {
    // Clear any previous messages
    setError('');
    setSuccess('');

    // Role-specific validation
    if (user?.role === 'candidate') {
      if (!profile.school || !profile.major || !profile.targetRole) {
        setError('Please fill in all required fields (School, Major, Target Role)');
        return;
      }
      
      if (profile.schoolEmail && !validateSchoolEmail(profile.schoolEmail)) {
        setError('Please enter a valid school email address ending in .edu');
        return;
      }
    }

    if (user?.role === 'professional') {
      if (!profile.title || !profile.company || !profile.industry || !profile.bio) {
        setError('Please fill in all required fields (Title, Company, Industry, Bio)');
        return;
      }

      if (profile.bio && profile.bio.length < 50) {
        setError('Please write a bio of at least 50 characters');
        return;
      }

      if ((profile.expertise || []).length === 0) {
        setError('Please select at least one area of expertise');
        return;
      }

      if (profile.workEmail && !validateWorkEmail(profile.workEmail)) {
        setError('Please enter a valid work email address');
        return;
      }
    }

    // Validate LinkedIn URL for both roles
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
      console.log('Updating profile:', { userId: session.user.id, ...profile });
      
      const result = await apiRequest('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          ...profile
        })
      });
      
      console.log('Profile update result:', result);
      
      if (result.success) {
        setSuccess('Profile updated successfully!');
        // Optionally refresh the profile data
        setTimeout(() => {
          fetchProfile();
        }, 1000);
      } else {
        const errorMessage = result.error || 'Failed to update profile. Please try again.';
        console.error('Profile update failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || status === 'loading') {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const isCandidate = user?.role === 'candidate';
  const isProfessional = user?.role === 'professional';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant={isCandidate ? 'candidate' : 'professional'} showDashboardLink={true} />

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
          <p className="text-gray-600">Update your information and preferences</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">✅</div>
              <div className="text-sm text-green-800">{success}</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div className="md:col-span-2">
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

            {/* Candidate-specific fields */}
            {isCandidate && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School/University <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.school || ''}
                        onChange={(e) => updateProfile({ school: e.target.value })}
                        placeholder="e.g., Harvard University"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Major <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.major || ''}
                        onChange={(e) => updateProfile({ major: e.target.value })}
                        placeholder="e.g., Computer Science"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minor (Optional)
                      </label>
                      <input
                        type="text"
                        value={profile.minor || ''}
                        onChange={(e) => updateProfile({ minor: e.target.value })}
                        placeholder="e.g., Economics"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Graduation Year
                      </label>
                      <select
                        value={profile.graduationYear || ''}
                        onChange={(e) => updateProfile({ graduationYear: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select year</option>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i - 2).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GPA (Optional)
                      </label>
                      <input
                        type="text"
                        value={profile.gpa || ''}
                        onChange={(e) => updateProfile({ gpa: e.target.value })}
                        placeholder="e.g., 3.7"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={profile.schoolEmail || ''}
                        onChange={(e) => updateProfile({ schoolEmail: e.target.value })}
                        placeholder="you@university.edu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Helps verify your academic background
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Goals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Role <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.targetRole || ''}
                        onChange={(e) => updateProfile({ targetRole: e.target.value })}
                        placeholder="e.g., Software Engineer, Investment Banking Analyst"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Industry
                      </label>
                      <select
                        value={profile.targetIndustry || ''}
                        onChange={(e) => updateProfile({ targetIndustry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(industry => (
                          <option key={industry} value={industry}>
                            {industry.charAt(0).toUpperCase() + industry.slice(1).replace('-', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offer Bonus Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={(profile.offerBonusCents || 0) / 100}
                        onChange={(e) => updateProfile({ offerBonusCents: Math.max(0, parseInt(e.target.value) || 0) * 100 })}
                        placeholder="200"
                        min="0"
                        step="50"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Amount you&apos;ll pay to the first professional at a company if you accept an offer there
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clubs & Activities (Optional)
                    </label>
                    <textarea
                      value={profile.clubs || ''}
                      onChange={(e) => updateProfile({ clubs: e.target.value })}
                      placeholder="e.g., Computer Science Club, Investment Club, Debate Team"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      List clubs, organizations, or activities you&apos;re involved in
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    {profile.resumeUrl || resumePreview ? (
                      <div className="text-center">
                        <div className="text-green-600 text-2xl mb-2">📄</div>
                        <p className="text-sm font-medium text-gray-900">
                          {resumePreview || 'Resume uploaded'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            updateProfile({ resumeUrl: '' });
                            setResumePreview('');
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
                        >
                          Upload different file
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-gray-400 text-2xl mb-2">📄</div>
                        <label className="cursor-pointer">
                          <span className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                            {uploadingResume ? 'Uploading...' : 'Click to upload'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleResumeUpload(file);
                            }}
                            disabled={uploadingResume}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, DOC, or DOCX (max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Professional-specific fields */}
            {isProfessional && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.title || ''}
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
                        value={profile.company || ''}
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
                        value={profile.industry || ''}
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
                        value={profile.yearsExperience || 0}
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
                        value={profile.workEmail || ''}
                        onChange={(e) => updateProfile({ workEmail: e.target.value })}
                        placeholder="you@company.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Helps verify your professional background
                      </p>
                    </div>
                  </div>
                </div>

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
                        value={(profile.sessionRateCents || 0) / 100}
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

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About You</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Professional Bio <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e) => updateProfile({ bio: e.target.value })}
                      placeholder="Tell candidates about your background, expertise, and what they can expect from a session with you..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(profile.bio || '').length}/500 characters • Minimum 50 characters
                    </p>
                  </div>
                </div>

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
                              checked={(profile.expertise || []).includes(expertise)}
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
                    {(profile.expertise || []).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Selected expertise:</p>
                        <div className="flex flex-wrap gap-2">
                          {(profile.expertise || []).map(expertise => (
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
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
            <Link
              href={isCandidate ? '/candidate/dashboard' : '/professional/dashboard'}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 mt-0.5">💡</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Profile Tips</h4>
                <p className="text-sm text-blue-800">
                  Keep your profile updated to attract the right connections. 
                  {isCandidate && " A complete profile with resume increases your booking success rate."}
                  {isProfessional && " Detailed expertise and bio help candidates find you for relevant sessions."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}