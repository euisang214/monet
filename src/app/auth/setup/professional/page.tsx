'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { apiRequest } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { uploadFile, validateFile, getFilePreview, cleanupFilePreview } from '@/lib/upload';

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
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState<string>('');
  
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

  const updateProfile = (updates: Partial<CandidateProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const handleResumeUpload = async (file: File) => {
    const validation = validateFile(file, 'resume');
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploadingResume(true);
    setResumeFile(file);

    try {
      const result = await uploadFile(file, 'resume', session?.user?.id);
      if (result.success) {
        updateProfile({ resumeUrl: result.fileUrl });
        setResumePreview(file.name);
      } else {
        alert(result.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      alert('Failed to upload resume');
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
    // Validate required fields
    if (!profile.school || !profile.major || !profile.targetRole) {
      alert('Please fill in all required fields (School, Major, Target Role)');
      return;
    }

    // Validate optional fields format
    if (profile.linkedinUrl && !validateLinkedInUrl(profile.linkedinUrl)) {
      alert('Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/yourname)');
      return;
    }

    if (profile.schoolEmail && !validateSchoolEmail(profile.schoolEmail)) {
      alert('Please enter a valid school email address ending in .edu');
      return;
    }

    setLoading(true);
    
    try {
      const result = await apiRequest('/api/auth/complete-profile', {
        method: 'POST',
        body: JSON.stringify({
          userId: session?.user?.id,
          role: 'candidate',
          ...profile
        })
      });
      
      if (result.success) {
        // Redirect to candidate dashboard
        router.push('/candidate/dashboard');
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

  const canSubmit = profile.school && profile.major && profile.targetRole;

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Candidate Profile</h1>
            <p className="text-gray-600">Tell us about your academic background and career goals</p>
          </div>

          <div className="space-y-8">
            {/* Academic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School/University *
                  </label>
                  <input
                    type="text"
                    value={profile.school}
                    onChange={(e) => updateProfile({ school: e.target.value })}
                    placeholder="Harvard University"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Email (.edu)
                  </label>
                  <input
                    type="email"
                    value={profile.schoolEmail}
                    onChange={(e) => updateProfile({ schoolEmail: e.target.value })}
                    placeholder="john.doe@harvard.edu"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - helps verify student status for potential discounts
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Major *
                  </label>
                  <input
                    type="text"
                    value={profile.major}
                    onChange={(e) => updateProfile({ major: e.target.value })}
                    placeholder="Economics"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minor (optional)
                  </label>
                  <input
                    type="text"
                    value={profile.minor}
                    onChange={(e) => updateProfile({ minor: e.target.value })}
                    placeholder="Computer Science"
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
                    <option value="">Select Year</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GPA (optional)
                  </label>
                  <input
                    type="text"
                    value={profile.gpa}
                    onChange={(e) => updateProfile({ gpa: e.target.value })}
                    placeholder="3.8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Extracurricular Activities */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracurricular Activities</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clubs, Organizations, Leadership Roles
                </label>
                <textarea
                  value={profile.clubs}
                  onChange={(e) => updateProfile({ clubs: e.target.value })}
                  placeholder="Investment Club President, Debate Team, Volunteer at Local Food Bank..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  List your involvement in clubs, sports, volunteer work, leadership positions, etc.
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
                          onClick={() => {
                            updateProfile({ resumeUrl: '' });
                            setResumePreview('');
                            setResumeFile(null);
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
                          PDF, DOC, or DOCX up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - helps professionals prepare for your session and provide better feedback
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
                    Target Role *
                  </label>
                  <input
                    type="text"
                    value={profile.targetRole}
                    onChange={(e) => updateProfile({ targetRole: e.target.value })}
                    placeholder="Investment Banking Analyst"
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
                    <option value="">Select Industry</option>
                    <option value="Investment Banking">Investment Banking</option>
                    <option value="Management Consulting">Management Consulting</option>
                    <option value="Private Equity">Private Equity</option>
                    <option value="Hedge Funds">Hedge Funds</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Real Estate">Real Estate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Offer Bonus */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Bonus Pledge</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-900 text-sm leading-relaxed">
                  If you land an offer through Monet, you'll pay this bonus to the first professional 
                  you spoke with from that firm. This creates an incentive for professionals to help you succeed.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Bonus Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={profile.offerBonusCents / 100}
                    onChange={(e) => updateProfile({ offerBonusCents: (parseFloat(e.target.value) || 0) * 100 })}
                    min="100"
                    max="1000"
                    step="50"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Recommended: $100-$1,000 (most candidates pledge ~$200)
                </p>
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
              {loading ? 'Saving Profile...' : 'Complete Profile & Start Networking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}