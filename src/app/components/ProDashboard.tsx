'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

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
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-6 h-6 ${
              star <= value ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Professional Dashboard</h1>
        <div className="text-sm text-gray-500">
          {upcomingSessions.length} upcoming • {completedSessions.length} completed
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Chats</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {upcomingSessions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No upcoming sessions
            </div>
          ) : (
            upcomingSessions.map((session) => (
              <div key={session._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">
                        {session.candidate.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        session.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        session.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {format(new Date(session.scheduledAt), 'PPP p')} • {session.durationMinutes} min
                    </div>
                    {session.candidate.targetRole && (
                      <div className="mt-1 text-sm text-gray-500">
                        Interested in: {session.candidate.targetRole}
                        {session.candidate.targetIndustry && ` • ${session.candidate.targetIndustry}`}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${(session.rateCents / 100).toFixed(2)}
                      </div>
                    </div>
                    {session.zoomJoinUrl && session.status === 'confirmed' && (
                      <a
                        href={session.zoomJoinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Completed Chats</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {completedSessions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No completed sessions
            </div>
          ) : (
            completedSessions.map((session) => (
              <div key={session._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">
                        {session.candidate.name}
                      </h3>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {session.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {format(new Date(session.scheduledAt), 'PPP p')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${(session.rateCents / 100).toFixed(2)}
                      </div>
                    </div>
                    {!session.feedbackSubmittedAt ? (
                      <button
                        onClick={() => setFeedbackModal(session)}
                        className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                      >
                        Submit Feedback
                      </button>
                    ) : (
                      <span className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-md">
                        Feedback Submitted
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Submit Feedback for {feedbackModal.candidate.name}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-6">
              {/* Rating Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StarRating
                  label="Cultural Fit"
                  value={feedbackForm.culturalFitRating}
                  onChange={(value) => setFeedbackForm(prev => ({ ...prev, culturalFitRating: value }))}
                />
                <StarRating
                  label="Interest Level"
                  value={feedbackForm.interestRating}
                  onChange={(value) => setFeedbackForm(prev => ({ ...prev, interestRating: value }))}
                />
                <StarRating
                  label="Technical Skills"
                  value={feedbackForm.technicalRating}
                  onChange={(value) => setFeedbackForm(prev => ({ ...prev, technicalRating: value }))}
                />
              </div>

              {/* Written Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Written Feedback (min 20 characters)
                </label>
                <textarea
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Share your thoughts about the candidate's fit, skills, and potential..."
                />
                <div className="mt-1 text-sm text-gray-500">
                  {feedbackForm.feedback.length}/500 characters
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes (optional, not shared with candidate)
                </label>
                <textarea
                  value={feedbackForm.internalNotes}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, internalNotes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Internal notes for your team..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={submittingFeedback}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitFeedback(feedbackModal._id)}
                disabled={submittingFeedback || feedbackForm.feedback.length < 20}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback & Get Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}