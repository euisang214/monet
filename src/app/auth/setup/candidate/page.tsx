'use client';

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { apiRequest } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { uploadFile, validateFile } from '@/lib/upload';

interface CandidateProfile {
  school: string;
  major: string;
  minor: string;
  graduationYear: string;
  gpa: string;
  targetRole: string;
  targetIndustry: string;
  offerBonusCents: number;
  // New fields
  schoolEmail: string;
  linkedinUrl: string;
  resumeUrl: string;
  clubs: string;
}

export default function CandidateProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumePreview, setResumePreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  // Key prop removed as rerender logic isn't necessary
  
  const [profile, setProfile] = useState<CandidateProfile>({
    school: '',
    major: '',
    minor: '',
    graduationYear: '',
    gpa: '',
    targetRole: '',
    targetIndustry: '',
    offerBonusCents: 20000, // $200 default
    // New fields
    schoolEmail: '',
    linkedinUrl: '',
    resumeUrl: '',
    clubs: ''
  });

  const { isAuthenticated, isLoading } = useAuthGuard({
    requiredRole: 'candidate',
    requireProfileComplete: false
  });

  // Stable function to fetch existing profile
  const fetchExistingProfile = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const result = await apiRequest<CandidateProfile>(
        `/api/auth/profile/${session.user.id}`
      );
      if (result.success && result.data) {
        setProfile(prev => ({
          ...prev,
          ...(result.data as Partial<CandidateProfile>)
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

  const updateProfile = useCallback((updates: Partial<CandidateProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    setError(''); // Clear any previous errors when user starts typing
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

  const handleSubmit = async () => {
    // Clear any previous errors
    setError('');

    // Validate required fields
    if (!profile.school || !profile.major || !profile.targetRole) {
      setError('Please fill in all required fields (School, Major, Target Role)');
      return;
    }

    // Validate optional fields format
    if (profile.linkedinUrl && !validateLinkedInUrl(profile.linkedinUrl)) {
      setError('Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/yourname)');
      return;
    }

    if (profile.schoolEmail && !validateSchoolEmail(profile.schoolEmail)) {
      setError('Please enter a valid school email address ending in .edu');
      return;
    }

    // Verify we have a valid session
    if (!session?.user?.id) {
      setError('Session expired. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Submitting candidate profile:', { userId: session.user.id, ...profile });
      
      const result = await apiRequest('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          role: 'candidate',
          ...profile
        })
      });
      
      console.log('Profile submission result:', result);
      
      if (result.success) {
        // Successful submission - redirect to candidate dashboard
        console.log('Profile completed successfully, redirecting to dashboard');
        router.push('/dashboard');
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

  const canSubmit = profile.school && profile.major && profile.targetRole && !loading;

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Candidate Profile</h1>
            <p className="text-gray-600">
              Help professionals understand your background and career goals
            </p>
          </div>

          <div className="space-y-8">
            {/* Academic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School/University <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.school}
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
                    value={profile.major}
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
                    value={profile.minor}
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
                    value={profile.graduationYear}
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
                    value={profile.gpa}
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
                    value={profile.schoolEmail}
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

            {/* Career Goals */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.targetRole}
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
                    value={profile.targetIndustry}
                    onChange={(e) => updateProfile({ targetIndustry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="consulting">Consulting</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="government">Government</option>
                    <option value="non-profit">Non-Profit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Offer Bonus */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Bonus Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={profile.offerBonusCents / 100}
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

            {/* Extracurricular Activities */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clubs & Activities (Optional)
                </label>
                <textarea
                  value={profile.clubs}
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

            {/* Professional Profiles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Profiles</h3>
              <div className="space-y-4">
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
                    Helps professionals learn more about your background before the session
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume Upload
                  </label>
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
              {loading ? 'Saving Your Profile...' : 'Complete Profile & Start Networking'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              You can always update your profile later from your dashboard
            </p>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 mt-0.5">🎯</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Next Steps</h4>
                <p className="text-sm text-blue-800">
                  Once you complete your profile, you&apos;ll be able to search for and book
                  coffee chats with professionals in your target industry. Most sessions
                  are 30 minutes and range from $25-100.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}