'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDate, formatLongDate, getAvatarGradient, apiRequest } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Navigation from '@/components/ui/Navigation';
import CandidateDirectory from '@/app/components/CandidateDirectory';
import AvailabilityGrid from '@/components/ui/AvailabilityGrid';

interface Session {
  _id: string;
  candidateId: string | { _id: string };
  scheduledAt?: string;
  durationMinutes: number;
  rateCents: number;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  zoomJoinUrl?: string;
  candidateAvailability?: { start: string; end: string }[];
  candidate?:
    | string
    | { _id: string }
    | {
        name: string;
        email: string;
        targetRole?: string;
        targetIndustry?: string;
        profileImageUrl?: string;
      };
  candidateIdInfo?:
    | string
    | { _id: string }
    | {
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

export default function EnhancedProDashboard() {
  const { data: session } = useSession();
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
  const [acceptModal, setAcceptModal] = useState<Session | null>(null);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({
    culturalFitRating: 3,
    interestRating: 3,
    technicalRating: 3,
    feedback: '',
    internalNotes: ''
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;

    try {
      const result = await apiRequest<{
        upcoming: Session[];
        completed: Session[];
        pending: Session[];
      }>(`/api/professional/${session.user.id}`);
      
      if (result.success && result.data) {
        const { upcoming, completed, pending } = result.data;

        const normalize = (arr: Session[]) =>
          arr.map((s: Session) => ({
            ...s,
            candidate: s.candidate || s.candidateId,
            candidateIdInfo: s.candidateId,
            candidateId:
              typeof s.candidateId === 'string'
                ? s.candidateId
                : (s.candidateId as { _id: string })._id,
          }));

        const normUpcoming = normalize(upcoming);
        const normCompleted = normalize(completed);
        const normPending = normalize(pending);

        setUpcomingSessions(normUpcoming.filter((s: Session) => s.status === 'confirmed'));
        setInboundRequests(normPending.filter((s: Session) => !s.referrerProId));
        setReferralRequests(normPending.filter((s: Session) => s.referrerProId));
        setPendingFeedback(normCompleted.filter((s: Session) => !s.feedbackSubmittedAt));
        setCompletedSessions(normCompleted.filter((s: Session) => s.feedbackSubmittedAt));
        
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

  const handleAcceptRequest = (sessionItem: Session) => {
    setAcceptModal(sessionItem);
  };

  const handleSubmitFeedback = async (sessionId: string) => {
    if (!session?.user?.id) return;

    setSubmittingFeedback(true);
    
    try {
      const result = await apiRequest<{ sessionPayout: number }>(
        '/api/feedback/professional', {
          method: 'POST',
          body: JSON.stringify({
            sessionId,
            professionalId: session.user.id,
            ...feedbackForm
          })
        }
      );
      
      if (result.success) {
        await fetchDashboardData();
        setFeedbackModal(null);
        setFeedbackForm({
          culturalFitRating: 3,
          interestRating: 3,
          technicalRating: 3,
          feedback: '',
          internalNotes: ''
        });
        alert(`Feedback submitted! You've been paid $${(result.data!.sessionPayout / 100).toFixed(2)}`);
      } else {
        alert(result.error || 'Failed to submit feedback');
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
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="professional" showDashboardLink={false} />

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
                  upcomingSessions.map((sessionItem, index) => (
                    <div key={sessionItem._id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                        {(() => {
                          const cand =
                            (sessionItem.candidate ||
                              sessionItem.candidateId ||
                              sessionItem.candidateIdInfo) as
                              string | { name?: string; profileImageUrl?: string } | undefined;
                          const hasImage =
                            typeof cand !== 'string' && !!cand?.profileImageUrl;
                          const displayName =
                            typeof cand === 'string' ? cand : cand?.name || '';
                          return (
                            <div className={`w-10 h-10 ${getAvatarGradient(index)} rounded-full flex items-center justify-center text-white font-bold overflow-hidden`}>
                              {hasImage ? (
                                <img
                                  src={(cand as { profileImageUrl: string }).profileImageUrl}
                                  alt={displayName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                displayName.charAt(0) || '?'
                              )}
                            </div>
                          );
                        })()}
                        <div>
                          {(() => {
                            const cand =
                              (sessionItem.candidate ||
                                sessionItem.candidateId ||
                                sessionItem.candidateIdInfo) as
                                string | { name?: string } | undefined;
                            const displayName =
                              typeof cand === 'string' ? cand : cand?.name || 'Unknown';
                            return (
                              <>
                                <h3 className="font-semibold text-gray-900">{displayName}</h3>
                                <p className="text-sm text-gray-600">{formatDate(sessionItem.scheduledAt || '')}</p>
                              </>
                            );
                          })()}
                          </div>
                        </div>
                        {sessionItem.zoomJoinUrl && (
                          <a
                            href={sessionItem.zoomJoinUrl}
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
                    inboundRequests.map((sessionItem, index) => (
                      <div key={sessionItem._id} className="px-6 py-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            {(() => {
                              const cand =
                                (sessionItem.candidate ||
                                  sessionItem.candidateId ||
                                  sessionItem.candidateIdInfo) as
                                  string | { name?: string; profileImageUrl?: string } | undefined;
                              const hasImage =
                                typeof cand !== 'string' && !!cand?.profileImageUrl;
                              const displayName =
                                typeof cand === 'string' ? cand : cand?.name || '';
                              return (
                                <div className={`w-8 h-8 ${getAvatarGradient(index + 1)} rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
                                  {hasImage ? (
                                    <img
                                      src={(cand as { profileImageUrl: string }).profileImageUrl}
                                      alt={displayName}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    displayName.charAt(0) || '?'
                                  )}
                                </div>
                              );
                            })()}
                            <div>
                              {(() => {
                                const cand =
                                  (sessionItem.candidate ||
                                    sessionItem.candidateId ||
                                    sessionItem.candidateIdInfo) as
                                    string | { name?: string } | undefined;
                                const displayName =
                                  typeof cand === 'string' ? cand : cand?.name || 'Unknown';
                                return (
                                  <>
                                    <h4 className="font-medium text-gray-900 text-sm">{displayName}</h4>
                                    <p className="text-xs text-gray-600">{formatDate(sessionItem.scheduledAt || '')}</p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAcceptRequest(sessionItem)}
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
                    referralRequests.map((sessionItem, index) => (
                      <div key={sessionItem._id} className="px-6 py-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            {(() => {
                              const cand =
                                (sessionItem.candidate ||
                                  sessionItem.candidateId ||
                                  sessionItem.candidateIdInfo) as
                                  string | { name?: string; profileImageUrl?: string } | undefined;
                              const hasImage =
                                typeof cand !== 'string' && !!cand?.profileImageUrl;
                              const displayName =
                                typeof cand === 'string' ? cand : cand?.name || '';
                              return (
                                <div className={`w-8 h-8 ${getAvatarGradient(index + 2)} rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
                                  {hasImage ? (
                                    <img
                                      src={(cand as { profileImageUrl: string }).profileImageUrl}
                                      alt={displayName}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    displayName.charAt(0) || '?'
                                  )}
                                </div>
                              );
                            })()}
                            <div>
                              {(() => {
                                const cand =
                                  (sessionItem.candidate ||
                                    sessionItem.candidateId ||
                                    sessionItem.candidateIdInfo) as
                                    string | { name?: string } | undefined;
                                const displayName =
                                  typeof cand === 'string' ? cand : cand?.name || 'Unknown';
                                return (
                                  <>
                                    <h4 className="font-medium text-gray-900 text-sm">{displayName}</h4>
                                    <p className="text-xs text-gray-600">Referred • {formatDate(sessionItem.scheduledAt || '', false)}</p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAcceptRequest(sessionItem)}
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
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700">Referral Bonuses</h3>
                    <span className="text-lg font-bold text-blue-600">${earnings.referralEarnings}</span>
                  </div>
                  <p className="text-sm text-gray-600">Earn 10% when you refer candidates to other professionals</p>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700">Offer Bonuses</h3>
                    <span className="text-lg font-bold text-green-600">${earnings.offerBonuses}</span>
                  </div>
                  <p className="text-sm text-gray-600">Earn bonuses when mentored candidates join your firm</p>
                </div>
              </div>
            </div>

            {/* Candidate Search */}
            <CandidateDirectory />

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
                  pendingFeedback.map((sessionItem, index) => (
                    <div key={sessionItem._id} className="px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          {(() => {
                            const cand =
                              (sessionItem.candidate ||
                                sessionItem.candidateId ||
                                sessionItem.candidateIdInfo) as
                                string | { name?: string; profileImageUrl?: string } | undefined;
                            const hasImage =
                              typeof cand !== 'string' && !!cand?.profileImageUrl;
                            const displayName =
                              typeof cand === 'string' ? cand : cand?.name || '';
                            return (
                              <div className={`w-8 h-8 ${getAvatarGradient(index + 3)} rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
                                {hasImage ? (
                                  <img
                                    src={(cand as { profileImageUrl: string }).profileImageUrl}
                                    alt={displayName}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  displayName.charAt(0) || '?'
                                )}
                              </div>
                            );
                          })()}
                          <div>
                            {(() => {
                              const cand =
                                (sessionItem.candidate ||
                                  sessionItem.candidateId ||
                                  sessionItem.candidateIdInfo) as
                                  string | { name?: string } | undefined;
                              const displayName =
                                typeof cand === 'string' ? cand : cand?.name || 'Unknown';
                              return (
                                <>
                                  <h4 className="font-medium text-gray-900">{displayName}</h4>
                                  <p className="text-sm text-gray-600">{formatDate(sessionItem.scheduledAt || '', false)}</p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <button
                          onClick={() => setFeedbackModal(sessionItem)}
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
                  completedSessions.map((sessionItem, index) => (
                    <div key={sessionItem._id} className="px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          {(() => {
                            const cand =
                              (sessionItem.candidate ||
                                sessionItem.candidateId ||
                                sessionItem.candidateIdInfo) as
                                string | { name?: string; profileImageUrl?: string } | undefined;
                            const hasImage =
                              typeof cand !== 'string' && !!cand?.profileImageUrl;
                            const displayName =
                              typeof cand === 'string' ? cand : cand?.name || '';
                            return (
                              <div className={`w-8 h-8 ${getAvatarGradient(index + 4)} rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
                                {hasImage ? (
                                  <img
                                    src={(cand as { profileImageUrl: string }).profileImageUrl}
                                    alt={displayName}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  displayName.charAt(0) || '?'
                                )}
                              </div>
                            );
                          })()}
                          <div>
                            {(() => {
                              const cand =
                                (sessionItem.candidate ||
                                  sessionItem.candidateId ||
                                  sessionItem.candidateIdInfo) as
                                  string | { name?: string } | undefined;
                              const displayName =
                                typeof cand === 'string' ? cand : cand?.name || 'Unknown';
                              return (
                                <>
                                  <h4 className="font-medium text-gray-900">{displayName}</h4>
                                  <p className="text-sm text-gray-600">{formatDate(sessionItem.scheduledAt || '', false)} • ${(sessionItem.rateCents / 100).toFixed(0)}</p>
                                </>
                              );
                            })()}
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

      {/* Accept Modal */}
      <Modal
        isOpen={!!acceptModal}
        onClose={() => setAcceptModal(null)}
        title={
          acceptModal
            ? `Select Time for ${
                typeof acceptModal.candidate === 'string'
                  ? acceptModal.candidate
                  : (acceptModal.candidate && 'name' in acceptModal.candidate
                      ? acceptModal.candidate.name
                      : (typeof acceptModal.candidateIdInfo === 'string'
                          ? acceptModal.candidateIdInfo
                          : acceptModal.candidateIdInfo && 'name' in acceptModal.candidateIdInfo
                          ? acceptModal.candidateIdInfo.name
                          : undefined)) || 'Candidate'
              }`
            : ''
        }
        subtitle="Choose a time from candidate's availability"
        maxWidth="lg"
        actions={
          <></>
        }
      >
        {acceptModal && (
          <div className="space-y-4">
            <AvailabilityGrid
              startDate={new Date()}
              days={14}
              initialSelected={new Set(acceptModal.candidateAvailability?.map(a => new Date(a.start).toISOString()))}
              onChange={() => {}}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {acceptModal.candidateAvailability?.map((a,i)=>{
                const start = new Date(a.start);
                return (
                  <button
                    key={i}
                    onClick={async ()=>{
                      if(!session?.user?.id) return;
                      await apiRequest(`/api/sessions/${acceptModal._id}/confirm`, {
                        method:'POST',
                        body: JSON.stringify({ professionalId: session.user.id, action:'accept', scheduledAt: start.toISOString() })
                      });
                      setAcceptModal(null);
                      fetchDashboardData();
                    }}
                    className="px-2 py-1 bg-indigo-600 text-white text-xs rounded"
                  >
                    {start.toLocaleString([], {weekday:'short', hour:'numeric', minute:'2-digit'})}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
        <Modal
          isOpen={!!feedbackModal}
          onClose={() => setFeedbackModal(null)}
        title={
          feedbackModal
            ? `Submit Feedback for ${
                typeof feedbackModal.candidate === 'string'
                  ? feedbackModal.candidate
                  : (feedbackModal.candidate && 'name' in feedbackModal.candidate
                      ? feedbackModal.candidate.name
                      : (typeof feedbackModal.candidateIdInfo === 'string'
                          ? feedbackModal.candidateIdInfo
                          : feedbackModal.candidateIdInfo && 'name' in feedbackModal.candidateIdInfo
                          ? feedbackModal.candidateIdInfo.name
                          : undefined)) ||
                    (typeof feedbackModal.candidateId === 'string'
                      ? feedbackModal.candidateId
                      : (feedbackModal.candidateId as { name?: string })?.name) ||
                    'Candidate'
              }`
            : ''
        }
        subtitle={feedbackModal ? `Session on ${formatLongDate(feedbackModal.scheduledAt || '')}` : ''}
          maxWidth="3xl"
          actions={
            <>
              <button
                onClick={() => setFeedbackModal(null)}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={submittingFeedback}
              >
                Cancel
              </button>
              <button
                onClick={() => feedbackModal && handleSubmitFeedback(feedbackModal._id)}
                disabled={submittingFeedback || feedbackForm.feedback.length < 20}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {submittingFeedback ? 'Processing Payment...' : 'Submit Feedback & Get Paid'}
              </button>
            </>
          }
        >
          {feedbackModal && (
            <div className="space-y-8">
              {/* Candidate Header */}
              <div className="flex items-center space-x-4">
                {(() => {
                  const cand =
                    (feedbackModal.candidate ||
                      feedbackModal.candidateIdInfo ||
                      feedbackModal.candidateId) as
                      string | { _id: string } | { name?: string; profileImageUrl?: string } | undefined;
                  const hasImage =
                    typeof cand !== 'string' && cand && 'profileImageUrl' in cand && !!cand.profileImageUrl;
                  const displayName =
                    typeof cand === 'string'
                      ? cand
                      : cand && 'name' in cand
                      ? cand.name || ''
                      : '';
                  return (
                    <div className={`w-12 h-12 ${getAvatarGradient(0)} rounded-full flex items-center justify-center text-white font-bold overflow-hidden`}>
                      {hasImage ? (
                        <img src={(cand as { profileImageUrl: string }).profileImageUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        displayName.charAt(0) || '?'
                      )}
                    </div>
                  );
                })()}
                <div>
                  {(() => {
                    const cand =
                      (feedbackModal.candidate ||
                        feedbackModal.candidateIdInfo ||
                        feedbackModal.candidateId) as
                        string | { _id: string } | { name?: string } | undefined;
                    const displayName =
                      typeof cand === 'string'
                        ? cand
                        : cand && 'name' in cand
                        ? cand.name || 'Candidate'
                        : 'Candidate';
                    return (
                      <>
                        <h4 className="text-lg font-semibold text-gray-900">{displayName}</h4>
                        <p className="text-gray-600">Session on {formatLongDate(feedbackModal.scheduledAt || '')}</p>
                      </>
                    );
                  })()}
                </div>
              </div>

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
                    Share your thoughts about the candidate&apos;s fit, skills, and potential (minimum 20 characters)
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
          )}
        </Modal>
      </div>
    </div>
  );
}