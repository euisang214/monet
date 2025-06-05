'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFile, validateFile, getFilePreview, cleanupFilePreview } from "@/lib/upload";

interface ProfessionalData {
  // Step 1
  workEmail: string;
  linkedinUrl: string;
  resumeFile: File | null;
  resumeUrl?: string; // S3 URL after upload
  
  // Step 2
  profilePicture: File | null;
  profilePictureUrl?: string; // S3 URL after upload
  name: string;
  title: string;
  company: string;
  industry: string;
  yearsExperience: number;
  bio: string;
  sessionRateCents: number;
  
  // Step 3
  bankingInfo: string;
  stripeAccountId?: string;
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

export default function ProfessionalSignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<ProfessionalData>({
    workEmail: '',
    linkedinUrl: '',
    resumeFile: null,
    resumeUrl: '',
    profilePicture: null,
    profilePictureUrl: '',
    name: '',
    title: '',
    company: '',
    industry: '',
    yearsExperience: 0,
    bio: '',
    sessionRateCents: 5000, // $50 default
    bankingInfo: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null); // 'resume' | 'profile'
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  const updateData = (updates: Partial<ProfessionalData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleFileUpload = async (file: File, type: 'resume' | 'profilePicture') => {
    // Validate file
    const validation = validateFile(file, type === 'resume' ? 'resume' : 'profile');
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Set uploading state
    setUploadingFile(type);
    setUploadProgress(0);

    try {
      // Upload to S3
      const result = await uploadFile(
        file, 
        type === 'resume' ? 'resume' : 'profile',
        undefined, // userId - will be set after account creation
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      if (result.success) {
        if (type === 'resume') {
          updateData({ 
            resumeFile: file, 
            resumeUrl: result.fileUrl 
          });
        } else {
          updateData({ 
            profilePicture: file, 
            profilePictureUrl: result.fileUrl 
          });
        }
      } else {
        alert(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Prepare data for API call
      const requestData = {
        workEmail: data.workEmail,
        linkedinUrl: data.linkedinUrl,
        resumeFile: data.resumeUrl, // S3 URL
        name: data.name,
        title: data.title,
        company: data.company,
        industry: data.industry,
        yearsExperience: data.yearsExperience,
        bio: data.bio,
        sessionRateCents: data.sessionRateCents,
        profilePicture: data.profilePictureUrl, // S3 URL
        bankingInfo: data.bankingInfo
      };

      const response = await fetch('/api/professional/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Clean up any object URLs
        if (data.profilePicture) {
          cleanupFilePreview(getFilePreview(data.profilePicture));
        }
        
        // Check if Stripe onboarding is required
        if (result.data.stripeOnboardingUrl) {
          // Redirect to Stripe onboarding
          window.location.href = result.data.stripeOnboardingUrl;
        } else {
          // Redirect to professional dashboard
          router.push('/professional/dashboard');
        }
      } else {
        alert(result.error || 'Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.workEmail && data.linkedinUrl && data.resumeFile;
      case 2:
        return data.name && data.title && data.company && data.industry && data.bio && data.sessionRateCents >= 1000;
      case 3:
        return true; // Banking info is skippable
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Professional Background</h2>
              <p className="text-gray-600">Help us confirm your industry credentials and experience</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Email Address *
              </label>
              <input
                type="email"
                value={data.workEmail}
                onChange={(e) => updateData({ workEmail: e.target.value })}
                placeholder="yourname@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">We'll verify your employment with your company domain</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile *
              </label>
              <input
                type="url"
                value={data.linkedinUrl}
                onChange={(e) => updateData({ linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">We'll auto-populate your professional information from LinkedIn</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume/CV Upload *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'resume')}
                  className="hidden"
                  id="resume-upload"
                  disabled={uploadingFile === 'resume'}
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600">
                    {uploadingFile === 'resume' ? (
                      <div>
                        <span className="text-indigo-600 font-medium">Uploading... {uploadProgress}%</span>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : data.resumeFile ? (
                      <span className="text-green-600 font-medium">✓ {data.resumeFile.name}</span>
                    ) : (
                      <>
                        <span className="text-indigo-600 font-medium">Click to upload</span> your resume
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX up to 10MB</div>
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Professional Profile</h2>
              <p className="text-gray-600">Review and adjust your information from LinkedIn</p>
            </div>

            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {uploadingFile === 'profilePicture' ? (
                  <div className="text-center">
                    <div className="text-indigo-600 text-xs font-medium">{uploadProgress}%</div>
                    <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : data.profilePicture ? (
                  <img 
                    src={getFilePreview(data.profilePicture)} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-2xl">👤</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'profilePicture')}
                className="hidden"
                id="profile-picture-upload"
                disabled={uploadingFile === 'profilePicture'}
              />
              <label htmlFor="profile-picture-upload" className="text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium">
                {uploadingFile === 'profilePicture' ? 'Uploading...' : 'Upload Profile Picture'}
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateData({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => updateData({ title: e.target.value })}
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
                  value={data.company}
                  onChange={(e) => updateData({ company: e.target.value })}
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
                  value={data.industry}
                  onChange={(e) => updateData({ industry: e.target.value })}
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
                  value={data.yearsExperience}
                  onChange={(e) => updateData({ yearsExperience: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Rate (per 30 min) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={data.sessionRateCents / 100}
                    onChange={(e) => updateData({ sessionRateCents: (parseFloat(e.target.value) || 0) * 100 })}
                    min="10"
                    max="500"
                    step="5"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Most professionals charge $50-$150 per session</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio *
              </label>
              <textarea
                value={data.bio}
                onChange={(e) => updateData({ bio: e.target.value })}
                placeholder="Tell candidates about your background, expertise, and what you can help them with..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                {data.bio.length}/500 characters
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Earning</h2>
              <p className="text-gray-600">Set up your payment information to receive earnings</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3">
                <div className="text-green-600 mt-0.5">💰</div>
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">How You'll Get Paid</h4>
                  <div className="text-sm text-green-800 space-y-2">
                    <p>• <strong>Session Fees:</strong> Earn ${(data.sessionRateCents / 100).toFixed(0)} per 30-minute session (paid instantly after feedback)</p>
                    <p>• <strong>Offer Bonuses:</strong> Earn bonuses when candidates you mentor accept offers at your firm</p>
                    <p>• <strong>Referral Rewards:</strong> Earn ongoing commissions when you refer other professionals</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banking Information (Optional - can be added later)
              </label>
              <textarea
                value={data.bankingInfo}
                onChange={(e) => updateData({ bankingInfo: e.target.value })}
                placeholder="You can skip this for now and complete Stripe onboarding later to receive payments"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20"
              />
              <p className="text-xs text-gray-500 mt-1">We use Stripe Connect for secure payments. You'll complete KYC verification before receiving your first payment.</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h4 className="font-semibold text-indigo-900 mb-2">Next Steps</h4>
              <div className="text-sm text-indigo-800 space-y-1">
                <p>1. Complete your account setup</p>
                <p>2. Review and accept your first session request</p>
                <p>3. Complete Stripe onboarding for payments</p>
                <p>4. Start earning from your expertise!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">${(data.sessionRateCents / 100).toFixed(0)}</div>
                <div className="text-sm text-gray-600">Per session rate</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">90%</div>
                <div className="text-sm text-gray-600">You keep after platform fees</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
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
                href="/auth/signin" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${(currentStep / 3) * 100}%`,
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 ease-out hover:scale-105"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            Previous
          </button>
          
          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 hover:shadow-lg hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all duration-300 ease-out"
              style={{
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all duration-300 ease-out"
              style={{
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              {loading ? 'Creating Account...' : 'Start Grabbing Coffee'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}