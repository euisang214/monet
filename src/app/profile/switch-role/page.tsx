'use client';

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { apiRequest } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Navigation from '@/components/ui/Navigation';

export default function SwitchRolePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState<'candidate' | 'professional' | ''>('');
  const [confirmed, setConfirmed] = useState(false);

  const { isAuthenticated, isLoading, user } = useAuthGuard({
    requireProfileComplete: true
  });

  const currentRole = user?.role;
  const targetRole = newRole || (currentRole === 'candidate' ? 'professional' : 'candidate');

  const handleRoleSwitch = async () => {
    if (!confirmed) {
      alert('Please confirm you understand the implications of switching roles');
      return;
    }

    setLoading(true);
    
    try {
      const result = await apiRequest('/api/profile/switch-role', {
        method: 'POST',
        body: JSON.stringify({
          userId: session?.user?.id,
          newRole: targetRole
        })
      });
      
      if (result.success) {
        // Update NextAuth session with the new role
        try {
          await updateSession({ role: targetRole, profileComplete: false });
        } catch (err) {
          console.warn('Failed to update session', err);
        }
        // Redirect to profile completion for the new role
        router.push(`/auth/setup/${targetRole}`);
      } else {
        alert(result.error || 'Failed to switch roles');
      }
    } catch (error) {
      console.error('Role switch error:', error);
      alert('Failed to switch roles');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const getRoleDisplayName = (role: string) => {
    return role === 'candidate' ? 'Candidate' : 'Professional';
  };

  const getWarningMessages = () => {
    const warnings = [];
    
    if (currentRole === 'professional') {
      warnings.push({
        icon: '💰',
        title: 'Payment Information',
        message: 'Your Stripe account and payment settings will be preserved but you won\'t be able to accept new sessions until you switch back to Professional.'
      });
      warnings.push({
        icon: '📊',
        title: 'Session History',
        message: 'Your completed sessions and earnings history will remain intact, but you won\'t receive new booking requests.'
      });
    }

    if (currentRole === 'candidate') {
      warnings.push({
        icon: '🎓',
        title: 'Academic Information',
        message: 'Your school, major, GPA, and other academic details will be preserved but hidden while in Professional mode.'
      });
      warnings.push({
        icon: '💼',
        title: 'Job Applications',
        message: 'Any pending session requests you\'ve made will remain active, but you won\'t be able to book new sessions until you switch back.'
      });
    }

    warnings.push({
      icon: '🔄',
      title: 'Profile Completion',
      message: `You'll need to complete your ${getRoleDisplayName(targetRole)} profile after switching roles.`
    });

    return warnings;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant={currentRole === 'candidate' ? 'candidate' : 'professional'} showDashboardLink={true} />

      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Switch Account Type</h1>
          <p className="text-gray-600">Change between Candidate and Professional modes</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          
          {/* Current Status */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Account Type</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">{currentRole === 'candidate' ? '🎓' : '💼'}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{getRoleDisplayName(currentRole!)}</h4>
                  <p className="text-gray-600 text-sm">
                    {currentRole === 'candidate' 
                      ? 'You can book sessions with professionals'
                      : 'You can offer sessions to candidates'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Switch To</h3>
            <div className="space-y-3">
              <button
                onClick={() => setNewRole(currentRole === 'candidate' ? 'professional' : 'candidate')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-300 ${
                  targetRole !== currentRole
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{targetRole === 'candidate' ? '🎓' : '💼'}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900">
                      {getRoleDisplayName(targetRole)}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {targetRole === 'candidate'
                        ? 'Book sessions with professionals for career guidance'
                        : 'Offer mentoring sessions and earn money from your expertise'
                      }
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Warnings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Information</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="text-amber-600 mt-0.5">⚠️</div>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">What happens when you switch:</h4>
                  <div className="space-y-3">
                    {getWarningMessages().map((warning, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="text-lg mt-0.5">{warning.icon}</span>
                        <div>
                          <h5 className="font-medium text-amber-900">{warning.title}</h5>
                          <p className="text-amber-800 text-sm">{warning.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 mt-0.5">ℹ️</div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Good News</h4>
                  <p className="text-blue-800 text-sm">
                    You can switch back anytime! Your data from both roles will be preserved, 
                    so switching between Candidate and Professional modes is completely reversible.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="mb-8">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                I understand that switching to {getRoleDisplayName(targetRole)} mode will change my account 
                functionality and I&apos;ll need to complete my {getRoleDisplayName(targetRole)} profile.
                I can switch back anytime without losing my data.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Link
              href="/profile/edit"
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleRoleSwitch}
              disabled={!confirmed || loading}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
                confirmed && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Switching...' : `Switch to ${getRoleDisplayName(targetRole)}`}
            </button>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-8 text-center">
          <div className="bg-gray-100 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
            <p className="text-gray-600 text-sm">
              If you&apos;re unsure about switching or have questions about the differences between
              account types, check out our{' '}
              <Link href="/how-it-works" className="text-indigo-600 hover:text-indigo-800">
                How It Works
              </Link>{' '}
              page or{' '}
              <Link href="/about" className="text-indigo-600 hover:text-indigo-800">
                learn more about Monet
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}