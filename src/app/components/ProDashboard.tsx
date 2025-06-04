'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  };
  feedbackSubmittedAt?: string;
}

interface FeedbackForm {
  culturalFitRating: number;
  interestRating: number;
  technicalRating: number;
  feedback: string;
  internalNotes: string;
}

export default function ProDashboard({ professionalId }: { professionalId: string }) {
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [completedSessions, setCompletedSessions] = useState<Session[]>([]);
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

  useEffect(() => {
    fetchSessions();
  }, [professionalId]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/sessions/professional/${professionalId}`);
      const data = await response.json();
      
      if (data.success) {
        setUpcomingSessions(data.data.upcoming || []);
        setCompletedSessions(data.data.completed || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (sessionId: string) => {
    setSubmittingFeedback(true);
    
    try {
      const response = await fetch('/api/feedback/professional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          professionalId,
          ...feedbackForm
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh sessions
        await fetchSessions();
        setFeedbackModal(null);
        
        // Reset form
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
      <div className="mt-2 text-xs text-gray-500">
        {value === 1 && 'Poor'}
        {value === 2 && 'Below Average'}
        {value === 3 && 'Average'}
        {value === 4 && 'Good'}
        {value === 5 && 'Excellent'}
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
              <span className="text-gray-600">Professional Dashboard</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Professional Dashboard</h1>
          <div className="flex justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span>{upcomingSessions.length} upcoming sessions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{completedSessions.length} completed sessions</span>
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 text-sm font-semibold">📅</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Upcoming Chats</h2>
              {upcomingSessions.length > 0 && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full font-medium">
                  {upcomingSessions.length}
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingSessions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-4xl mb-4">📭</div>
                <div className="text-gray-500 text-lg mb-2">No upcoming sessions</div>
                <p className="text-gray-400">New session requests will appear here</p>
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <div key={session._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {session.candidate.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {session.candidate.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            session.status === 'requested' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-13 space-y-1">
                        <div className="text-sm font-medium text-gray-700">
                          📅 {format(new Date(session.scheduledAt), 'PPP p')} • {session.durationMinutes} min
                        </div>
                        {session.candidate.targetRole && (
                          <div className="text-sm text-gray-500">
                            🎯 Interested in: {session.candidate.targetRole}
                            {session.candidate.targetIndustry && ` • ${session.candidate.targetIndustry}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          ${(session.rateCents / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">session fee</div>
                      </div>
                      {session.zoomJoinUrl && session.status === 'confirmed' && (
                        <a
                          href={session.zoomJoinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Join Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Sessions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-semibold">✅</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Completed Chats</h2>
              {completedSessions.length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                  {completedSessions.length}
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {completedSessions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-4xl mb-4">🎉</div>
                <div className="text-gray-500 text-lg mb-2">No completed sessions yet</div>
                <p className="text-gray-400">Your completed sessions will appear here</p>
              </div>
            ) : (
              completedSessions.map((session) => (
                <div key={session._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                          {session.candidate.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {session.candidate.name}
                          </h3>
                          <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-13">
                        <div className="text-sm text-gray-600">
                          📅 {format(new Date(session.scheduledAt), 'PPP p')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          ${(session.rateCents / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">earned</div>
                      </div>
                      {!session.feedbackSubmittedAt ? (
                        <button
                          onClick={() => setFeedbackModal(session)}
                          className="px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Submit Feedback
                        </button>
                      ) : (
                        <span className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                          ✓ Feedback Submitted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
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
                      Session on {format(new Date(feedbackModal.scheduledAt), 'PPP')}
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

                {/* Payment Info */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-indigo-600">💰</div>
                    <div>
                      <h4 className="font-semibold text-indigo-900">Payment Processing</h4>
                      <p className="text-sm text-indigo-800">
                        Once you submit feedback, you'll receive ${((feedbackModal.rateCents * 0.9) / 100).toFixed(2)} 
                        (after platform fees) directly to your connected bank account.
                      </p>
                    </div>
                  </div>
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