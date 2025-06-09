'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function ProfileEditPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    linkedinUrl: '',
    expertise: []
  });

  const { isAuthenticated, isLoading, user } = useAuthGuard({
    requireProfileComplete: true
  });

  useEffect(() => {
    if (isAuthenticated && session?.user?.id) {
      fetchProfile();
    }
  }, [isAuthenticated, session]);

  const fetchProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const result = await apiRequest(`/api/auth/profile/${session.user.id}`);
      if (result.success) {
        setProfile(prev => ({
          ...prev,
          name: session.user.name || '',
          email: session.user.email || '',
          ...result.data
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateProfile = (updates: Partial<ProfileData>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const handleFileUpload = async (file: File, type: 'resume' | 'profile') => {
    const validation = validateFile(file, type);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFile(file, type, session?.user?.id);
      if (result.success) {
        if (type === 'resume') {
          updateProfile({ resumeUrl: result.fileUrl });
        }
      } else {
        alert(result.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const result = await apiRequest('/api/profile/update', {
        method: 'PUT',
        body: JSON.stringify({
          userId: session?.user?.id,
          ...profile
        })
      });
      
      if (result.success) {
        alert('Profile updated successfully!');
        router.push(user?.role === 'candidate' ? '/candidate/dashboard' : '/professional/dashboard');
      } else {
        alert(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                      <input
                        type="text"
                        value={profile.school || ''}
                        onChange={(e) => updateProfile({ school: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Major</label>
                      <input
                        type="text"
                        value={profile.major || ''}
                        onChange={(e) => updateProfile({ major: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minor</label>
                      <input
                        type="text"
                        value={profile.minor || ''}
                        onChange={(e) => updateProfile({ minor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
                      <select
                        value={profile.graduationYear || ''}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">School Email</label>
                      <input
                        type="email"
                        value={profile.schoolEmail || ''}
                        onChange={(e) => updateProfile({ schoolEmail: e.target.value })}
                        placeholder="student@university.edu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GPA (optional)</label>
                      <input
                        type="text"
                        value={profile.gpa || ''}
                        onChange={(e) => updateProfile({ gpa: e.target.value })}
                        placeholder="3.8"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Goals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
                      <input
                        type="text"
                        value={profile.targetRole || ''}
                        onChange={(e) => updateProfile({ targetRole: e.target.value })}
                        placeholder="Investment Banking Analyst"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Industry</label>
                      <select
                        value={profile.targetIndustry || ''}
                        onChange={(e) => updateProfile({ targetIndustry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Industry</option>
                        <option value="Investment Banking">Investment Banking</option>
                        <option value="Management Consulting">Management Consulting</option>
                        <option value="Private Equity">Private Equity</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offer Bonus Pledge
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={(profile.offerBonusCents || 0) / 100}
                        onChange={(e) => updateProfile({ offerBonusCents: (parseFloat(e.target.value) || 0) * 100 })}
                        min="100"
                        max="1000"
                        step="50"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Amount you'll pay to professionals if you get an offer through Monet
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resume Upload</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    {profile.resumeUrl ? (
                      <div className="text-center">
                        <div className="text-green-600 text-2xl mb-2">📄</div>
                        <p className="text-sm font-medium text-gray-900">Resume uploaded</p>
                        <button
                          onClick={() => updateProfile({ resumeUrl: '' })}
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
                            {uploading ? 'Uploading...' : 'Click to upload'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'resume');
                            }}
                            disabled={uploading}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX up to 10MB</p>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                      <input
                        type="text"
                        value={profile.title || ''}
                        onChange={(e) => updateProfile({ title: e.target.value })}
                        placeholder="Senior Analyst"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={profile.company || ''}
                        onChange={(e) => updateProfile({ company: e.target.value })}
                        placeholder="Goldman Sachs"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                      <select
                        value={profile.industry || ''}
                        onChange={(e) => updateProfile({ industry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Industry</option>
                        <option value="Investment Banking">Investment Banking</option>
                        <option value="Management Consulting">Management Consulting</option>
                        <option value="Private Equity">Private Equity</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        value={profile.yearsExperience || 0}
                        onChange={(e) => updateProfile({ yearsExperience: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
                      <input
                        type="email"
                        value={profile.workEmail || ''}
                        onChange={(e) => updateProfile({ workEmail: e.target.value })}
                        placeholder="you@company.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Session Rate</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={(profile.sessionRateCents || 0) / 100}
                          onChange={(e) => updateProfile({ sessionRateCents: (parseFloat(e.target.value) || 0) * 100 })}
                          min="10"
                          max="500"
                          step="5"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Per 30-minute session</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => updateProfile({ bio: e.target.value })}
                    placeholder="Tell candidates about your background and what you can help them with..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expertise</label>
                  <div className="space-y-2">
                    {(profile.expertise || []).map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => {
                            const newExpertise = [...(profile.expertise || [])];
                            newExpertise[index] = e.target.value;
                            updateProfile({ expertise: newExpertise });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            const newExpertise = [...(profile.expertise || [])];
                            newExpertise.splice(index, 1);
                            updateProfile({ expertise: newExpertise });
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateProfile({ expertise: [...(profile.expertise || []), ''] })}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      + Add Expertise Area
                    </button>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}