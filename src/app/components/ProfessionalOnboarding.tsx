'use client';

import { useState } from 'react';

interface OnboardingData {
  // Personal info
  name: string;
  email: string;
  
  // Professional info
  title: string;
  company: string;
  industry: string;
  yearsExperience: number;
  
  // Platform info
  bio: string;
  expertise: string[];
  sessionRateCents: number;
  linkedinUrl: string;
  
  // Referral
  referredBy?: string;
}

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Consulting',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Media',
  'Government',
  'Non-profit',
  'Other'
];

const COMMON_SKILLS = [
  'Software Engineering',
  'Product Management',
  'Data Science',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'HR',
  'Strategy',
  'Leadership',
  'Entrepreneurship'
];

export default function ProfessionalOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    email: '',
    title: '',
    company: '',
    industry: '',
    yearsExperience: 0,
    bio: '',
    expertise: [],
    sessionRateCents: 5000, // $50 default
    linkedinUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const addSkill = (skill: string) => {
    if (skill && !data.expertise.includes(skill)) {
      updateData({ expertise: [...data.expertise, skill] });
    }
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    updateData({ expertise: data.expertise.filter(s => s !== skill) });
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/professionals/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        // Redirect to Stripe onboarding
        window.location.href = result.data.stripeOnboardingUrl;
      } else {
        alert(result.error || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateData({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => updateData({ email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile (optional)
                </label>
                <input
                  type="url"
                  value={data.linkedinUrl}
                  onChange={(e) => updateData({ linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referred by (optional)
                </label>
                <input
                  type="text"
                  value={data.referredBy || ''}
                  onChange={(e) => updateData({ referredBy: e.target.value })}
                  placeholder="Professional ID or email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Professional Background</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => updateData({ title: e.target.value })}
                  placeholder="Senior Software Engineer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Google"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                {data.bio.length}/2000 characters
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Expertise & Pricing</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Expertise *
              </label>
              
              {/* Common Skills */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Select from common skills:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      disabled={data.expertise.includes(skill)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        data.expertise.includes(skill)
                          ? 'bg-blue-100 text-blue-800 border-blue-200 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Skill Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add custom skill..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill(newSkill)}
                />
                <button
                  type="button"
                  onClick={() => addSkill(newSkill)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              {/* Selected Skills */}
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Selected expertise ({data.expertise.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {data.expertise.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Rate *
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
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Rate per 30-minute session. Platform takes 5% after referral bonuses.
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Review & Complete</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Personal Info</h3>
                  <p className="text-gray-600">{data.name}</p>
                  <p className="text-gray-600">{data.email}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900">Professional</h3>
                  <p className="text-gray-600">{data.title} at {data.company}</p>
                  <p className="text-gray-600">{data.industry} • {data.yearsExperience} years</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">Expertise</h3>
                  <p className="text-gray-600">{data.expertise.join(', ')}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">Rate</h3>
                  <p className="text-gray-600 text-lg font-semibold">
                    ${(data.sessionRateCents / 100).toFixed(0)} per session
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">Bio</h3>
                <p className="text-gray-600 text-sm">{data.bio}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
              <ol className="text-blue-800 text-sm space-y-1">
                <li>1. Complete Stripe onboarding for payments</li>
                <li>2. Verify your identity and banking details</li>
                <li>3. Start accepting session requests!</li>
              </ol>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.name && data.email;
      case 2:
        return data.title && data.company && data.industry && data.bio && data.yearsExperience > 0;
      case 3:
        return data.expertise.length > 0 && data.sessionRateCents >= 1000;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Step {currentStep} of 4</span>
          <span className="text-sm text-gray-500">{Math.round((currentStep / 4) * 100)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-6 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {currentStep < 4 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Complete Onboarding'}
          </button>
        )}
      </div>
    </div>
  );
}