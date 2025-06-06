'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface CandidateData {
  // Step 1
  schoolEmail: string;
  linkedinUrl: string;
  resumeFile: File | null;
  
  // Step 2
  profilePicture: File | null;
  name: string;
  school: string;
  major: string;
  minor: string;
  clubs: string;
  gpa: string;
  
  // Step 3
  paymentInfo: string;
  offerBonusCents: number;
}

export default function CandidateSignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CandidateData>({
    schoolEmail: '',
    linkedinUrl: '',
    resumeFile: null,
    profilePicture: null,
    name: '',
    school: '',
    major: '',
    minor: '',
    clubs: '',
    gpa: '',
    paymentInfo: '',
    offerBonusCents: 20000 // $200 default
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateData = (updates: Partial<CandidateData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleFileUpload = (file: File, type: 'resume' | 'profilePicture') => {
    if (type === 'resume') {
      updateData({ resumeFile: file });
    } else {
      updateData({ profilePicture: file });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Prepare data for API call
      const requestData = {
        schoolEmail: data.schoolEmail,
        linkedinUrl: data.linkedinUrl,
        resumeFile: data.resumeFile ? 'resume-uploaded' : undefined, // TODO: Handle actual file upload
        name: data.name,
        school: data.school,
        major: data.major,
        minor: data.minor,
        clubs: data.clubs,
        gpa: data.gpa,
        profilePicture: data.profilePicture ? 'profile-uploaded' : undefined, // TODO: Handle actual file upload
        offerBonusCents: data.offerBonusCents,
        paymentInfo: data.paymentInfo
      };

      const response = await fetch('/api/candidate/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Show success message and redirect to candidate dashboard
        alert(`Welcome to Monet! Please check ${data.schoolEmail} for verification. You've pledged $${(data.offerBonusCents / 100).toFixed(0)} as your offer bonus.`);
        router.push('/candidate/dashboard');
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
        return data.schoolEmail && data.linkedinUrl && data.resumeFile;
      case 2:
        return data.name && data.school && data.major;
      case 3:
        return true; // Payment info is skippable
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Academic Background</h2>
              <p className="text-gray-600">Help us confirm you're a current student or recent graduate</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Email Address *
              </label>
              <input
                type="email"
                value={data.schoolEmail}
                onChange={(e) => updateData({ schoolEmail: e.target.value })}
                placeholder="yourname@university.edu"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">We'll send a verification email to confirm your student status</p>
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
              <p className="text-xs text-gray-500 mt-1">We'll auto-populate your profile information from LinkedIn</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume Upload *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'resume')}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.resumeFile ? (
                      <span className="text-indigo-600 font-medium">{data.resumeFile.name}</span>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
              <p className="text-gray-600">Review and adjust your information from LinkedIn</p>
            </div>

            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                {data.profilePicture ? (
                  <img 
                    src={URL.createObjectURL(data.profilePicture)} 
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
              />
              <label htmlFor="profile-picture-upload" className="text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium">
                Upload Profile Picture
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
                  School *
                </label>
                <input
                  type="text"
                  value={data.school}
                  onChange={(e) => updateData({ school: e.target.value })}
                  placeholder="Harvard University"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Major *
                </label>
                <input
                  type="text"
                  value={data.major}
                  onChange={(e) => updateData({ major: e.target.value })}
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
                  value={data.minor}
                  onChange={(e) => updateData({ minor: e.target.value })}
                  placeholder="Computer Science"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clubs & Activities
                </label>
                <input
                  type="text"
                  value={data.clubs}
                  onChange={(e) => updateData({ clubs: e.target.value })}
                  placeholder="Investment Club, Student Government"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GPA (optional)
                </label>
                <input
                  type="text"
                  value={data.gpa}
                  onChange={(e) => updateData({ gpa: e.target.value })}
                  placeholder="3.8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pledge Your Offer Bonus</h2>
              <p className="text-gray-600">Set your commitment to professionals who help you succeed</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="text-blue-900 space-y-4 leading-relaxed">
                <p>
                  The right connection can change your career. On Monet, professionals aren't just offering advice — they're helping you stand out and supporting your path to an offer.
                </p>
                <p>
                  If you land an offer through Monet, you'll thank the first professional you spoke with from that firm by paying them an offer bonus. You choose the amount now — it's your way of paying it forward and making the network stronger for everyone.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Bonus Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={data.offerBonusCents / 100}
                  onChange={(e) => updateData({ offerBonusCents: (parseFloat(e.target.value) || 0) * 100 })}
                  min="100"
                  max="1000"
                  step="50"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="text-sm text-gray-500 mt-2">
                <div>Suggested range: $100–$1,000 (most candidates pledge ~$200).</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Fine Print:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• You can update this pledge any time before you accept an offer.</p>
                <p>• You'll only pay if you accept an offer at this firm — never before.</p>
                <p>• Payment is processed securely through our platform.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Information (Optional - can be added later)
              </label>
              <input
                type="text"
                value={data.paymentInfo}
                onChange={(e) => updateData({ paymentInfo: e.target.value })}
                placeholder="You can skip this for now and add payment later"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">We'll only collect payment if you accept an offer through our platform</p>
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