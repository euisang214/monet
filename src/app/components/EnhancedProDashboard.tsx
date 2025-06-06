'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Session {
  _id: string;
  candidateId: string;
  scheduledAt: string;
  durationMinutes: number;
  rateCents: number;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  zoomJoinUrl?: string;
  candidate: {
    name: string;
    email: string;
    targetRole?: string;
    targetIndustry?: string;
    profileImageUrl?: string;
  };
  feedbackSubmittedAt?: string;
  referrerProId?: string;
}

interface FeedbackForm {
  culturalFitRating: number;
  interestRating: number;
  technicalRating: number;
  feedback: string;
  internalNotes: string;
}

interface EarningsData {
  sessionEarnings: number;
  referralEarnings: number;
  offerBonuses: number;
  monthlyTotal: number;
}

export default function EnhancedProDashboard({ professionalId }: { professionalId: string }) {
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [inboundRequests, setInboundRequests] = useState<Session[]>([]);
  const [referralRequests, setReferralRequests] = useState<Session[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<Session[]>([]);
  const [completedSessions, setCompletedSessions] = useState<Session[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>({
    sessionEarnings: 0,
    referralEarnings: 0,
    offerBonuses: 0,
    monthlyTotal: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState<Session | null>(null);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({
    culturalFitRating: 3,
    interestRating: 3,
    technicalRating: 3,
    feedback: '',
    internalNotes: ''
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Helper function to format dates
  const formatDate = (dateString: string, includeTime = true) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = includeTime 
      ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatLongDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [professionalId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/professional/${professionalId}`);
      const data = await response.json();
      
      if (data.success) {
        const { upcoming, completed, pending } = data.data;
        
        setUpcomingSessions(upcoming.filter((s: Session) => s.status === 'confirmed'));
        setInboundRequests(pending.filter((s: Session) => !s.referrerProId));
        setReferralRequests(pending.filter((s: Session) => s.referrerProId));
        setPendingFeedback(completed.filter((s: Session) => !s.feedbackSubmittedAt));
        setCompletedSessions(completed.filter((s: Session) => s.feedbackSubmittedAt));
        
        // Mock earnings data - would come from API in real implementation
        setEarnings({
          sessionEarnings: 2850,
          referralEarnings: 340,
          offerBonuses: 1200,
          monthlyTotal: 4390
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId,
          action: 'accept'
        })
      });

      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleSubmitFeedback = async (sessionId: string) => {
    setSubmittingFeedback(true);
    
    try {
      const response = await fetch('/api/feedback/professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          professionalId,
          ...feedbackForm
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchDashboardData();
        setFeedbackModal(null);
        setFeedbackForm({
          culturalFitRating: 3,
          interestRating: 3,
          technicalRating: 3,
          feedback: '',
          internalNotes: ''
        });
        alert(`Feedback submitted! You've been paid $${(data.data.sessionPayout / 100).toFixed(2)}`);
      } else {
        alert(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { 
    value: number; 
    onChange: (value: number) => void; 
    label: string;
  }) => (
    <div className="text-center">
      <label className="block text-sm font-semibold text-gray-700 mb-3">{label}</label>
      <div className="flex justify-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-8 h-8 text-2xl transition-colors ${
              star <= value ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
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
              <Link 
                href="/candidate/search"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Browse Candidates
              </Link>
              <span className="text-gray-600">Professional Dashboard</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Dashboard</h1>
          <p className="text-gray-600">Manage your sessions, earnings, and referrals</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-8">
            
            {/* Upcoming Chats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 text-sm font-semibold">📅</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Chats</h2>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full font-medium">
                    {upcomingSessions.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {upcomingSessions.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No upcoming sessions scheduled
                  </div>
                ) : (
                  upcomingSessions.map((session) => (
                    <div key={session._id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {session.candidate.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{session.candidate.name}</h3>
                            <p className="text-sm text-gray-600">
                              {formatDate(session.scheduledAt)}
                            </p>
                          </div>
                        </div>
                        {session.zoomJoinUrl && (
                          <a
                            href={session.zoomJoinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
                          >
                            Join
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Earnings from Coffee Chats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Coffee Chat Earnings</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">${earnings.sessionEarnings}</div>
                    <div className="text-sm text-gray-600">This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{completedSessions.length + pendingFeedback.length}</div>
                    <div className="text-sm text-gray-600">Total Sessions</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-8">
            
            {/* Inbound Requests */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Inbound Requests</h2>
              </div>
              
              {/* Candidate Requests */}
              <div className="border-b border-gray-100">
                <div className="px-6 py-3 bg-gray-25">
                  <h3 className="font-semibold text-gray-700">From Candidates</h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {inboundRequests.length === 0 ? (
                    <div className="px-6 py-4 text-center text-gray-500 text-sm">
                      No pending candidate requests
                    </div>
                  ) : (
                    inboundRequests.map((session) => (
                      <div key={session._id} className="px-6 py-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {session.candidate.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{session.candidate.name}</h4>
                              <p className="text-xs text-gray-600">
                                {formatDate(session.scheduledAt)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAcceptRequest(session._id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Referral Requests */}
              <div>
                <div className="px-6 py-3 bg-gray-25">
                  <h3 className="font-semibold text-gray-700">From Professional Referrals</h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {referralRequests.length === 0 ? (
                    <div className="px-6 py-4 text-center text-gray-500 text-sm">
                      No pending referral requests
                    </div>
                  ) : (
                    referralRequests.map((session) => (
                      <div key={session._id} className="px-6 py-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {session.candidate.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">{session.candidate.name}</h4>
                              <p className="text-xs text-gray-600">
                                Referred • {formatDate(session.scheduledAt, false)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAcceptRequest(session._id)}
                            className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Referral & Offer Bonus Earnings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Bonus Earnings</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {/* Referral Bonuses */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700">Referral Bonuses</h3>
                    <span className="text-lg font-bold text-blue-600">${earnings.referralEarnings}</span>
                  </div>
                  <p className="text-sm text-gray-600">Earn 10% when you refer candidates to other professionals</p>
                </div>

                {/* Offer Bonuses */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700">Offer Bonuses</h3>
                    <span className="text-lg font-bold text-green-600">${earnings.offerBonuses}</span>
                  </div>
                  <p className="text-sm text-gray-600">Earn bonuses when mentored candidates join your firm</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* History Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Session History</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            
            {/* Pending Feedback */}
            <div>
              <div className="px-6 py-3 bg-amber-50 border-b border-gray-100">
                <h3 className="font-semibold text-amber-800">Pending Feedback Submission</h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {pendingFeedback.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No pending feedback submissions
                  </div>
                ) : (
                  pendingFeedback.map((session) => (
                    <div key={session._id} className="px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {session.candidate.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{session.candidate.name}</h4>
                            <p className="text-sm text-gray-600">
                              {formatDate(session.scheduledAt, false)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFeedbackModal(session)}
                          className="px-3 py-1 bg-amber-600 text-white text-sm font-semibold rounded hover:bg-amber-700"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Completed Sessions */}
            <div>
              <div className="px-6 py-3 bg-green-50 border-b border-gray-100">
                <h3 className="font-semibold text-green-800">Feedback Completed</h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {completedSessions.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No completed sessions yet
                  </div>
                ) : (
                  completedSessions.map((session) => (
                    <div key={session._id} className="px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {session.candidate.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{session.candidate.name}</h4>
                            <p className="text-sm text-gray-600">
                              {formatDate(session.scheduledAt, false)} • ${(session.rateCents / 100).toFixed(0)}
                            </p>
                          </div>
                        </div>
                        <span className="text-green-600 text-sm font-medium">✓ Complete</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* Feedback Modal */}
        {feedbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    {feedbackModal.candidate.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Submit Feedback for {feedbackModal.candidate.name}
                    </h3>
                    <p className="text-gray-600">
                      Session on {formatLongDate(feedbackModal.scheduledAt)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-6 space-y-8">
                {/* Rating Section */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Rate the Candidate</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <StarRating
                        label="Cultural Fit"
                        value={feedbackForm.culturalFitRating}
                        onChange={(value) => setFeedbackForm(prev => ({ ...prev, culturalFitRating: value }))}
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <StarRating
                        label="Interest Level"
                        value={feedbackForm.interestRating}
                        onChange={(value) => setFeedbackForm(prev => ({ ...prev, interestRating: value }))}
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <StarRating
                        label="Technical Skills"
                        value={feedbackForm.technicalRating}
                        onChange={(value) => setFeedbackForm(prev => ({ ...prev, technicalRating: value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Written Feedback */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-2">
                    Written Feedback
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Share your thoughts about the candidate's fit, skills, and potential (minimum 20 characters)
                  </p>
                  <textarea
                    value={feedbackForm.feedback}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedback: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={4}
                    placeholder="What impressed you about this candidate? What areas could they improve? Would you recommend them for roles at your company?"
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <div className={`text-sm ${feedbackForm.feedback.length < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                      {feedbackForm.feedback.length}/500 characters {feedbackForm.feedback.length < 20 && '(minimum 20)'}
                    </div>
                  </div>
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-2">
                    Internal Notes
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Optional notes for your team (not shared with the candidate)
                  </p>
                  <textarea
                    value={feedbackForm.internalNotes}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, internalNotes: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Internal notes for hiring decisions, follow-up actions, etc..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
                <button
                  onClick={() => setFeedbackModal(null)}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={submittingFeedback}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitFeedback(feedbackModal._id)}
                  disabled={submittingFeedback || feedbackForm.feedback.length < 20}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {submittingFeedback ? 'Processing Payment...' : 'Submit Feedback & Get Paid'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}