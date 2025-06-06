'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Professional {
  _id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  expertise: string[];
  sessionRateCents: number;
  bio: string;
  yearsExperience: number;
  profileImageUrl?: string;
  averageRating?: number;
  totalSessions?: number;
}

interface Session {
  _id: string;
  professionalId: string;
  scheduledAt: string;
  durationMinutes: number;
  rateCents: number;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  zoomJoinUrl?: string;
  professional: {
    name: string;
    title: string;
    company: string;
    profileImageUrl?: string;
  };
}

interface SearchFilters {
  industry: string;
  company: string;
  expertise: string;
  maxRate: number;
  minExperience: number;
}

export default function EnhancedCandidateDashboard({ candidateId }: { candidateId: string }) {
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    industry: '',
    company: '',
    expertise: '',
    maxRate: 1000,
    minExperience: 0
  });

  // Helper function to format dates
  const formatDate = (dateString: string, includeTime = true) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = includeTime 
      ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [candidateId]);

  useEffect(() => {
    filterProfessionals();
  }, [professionals, searchQuery, filters]);

  const fetchDashboardData = async () => {
    try {
      // Fetch upcoming sessions for candidate
      const sessionsResponse = await fetch(`/api/sessions/candidate/${candidateId}`);
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setUpcomingSessions(sessionsData.data?.upcoming || []);
      }

      // Fetch available professionals
      const prosResponse = await fetch('/api/professional/search');
      if (prosResponse.ok) {
        const prosData = await prosResponse.json();
        setProfessionals(prosData.data?.professionals || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProfessionals = () => {
    let filtered = professionals;

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pro => 
        pro.name.toLowerCase().includes(query) ||
        pro.title.toLowerCase().includes(query) ||
        pro.company.toLowerCase().includes(query) ||
        pro.bio.toLowerCase().includes(query) ||
        pro.expertise.some(exp => exp.toLowerCase().includes(query))
      );
    }

    // Industry filter
    if (filters.industry) {
      filtered = filtered.filter(pro => 
        pro.industry.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }

    // Company filter
    if (filters.company) {
      filtered = filtered.filter(pro => 
        pro.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }

    // Rate and experience filters
    filtered = filtered.filter(pro => 
      pro.sessionRateCents <= filters.maxRate * 100 &&
      pro.yearsExperience >= filters.minExperience
    );

    setFilteredProfessionals(filtered);
  };

  const handleViewProfile = (professional: Professional) => {
    setSelectedPro(professional);
    setShowProfileModal(true);
  };

  const handleRequestChat = (professional: Professional) => {
    setSelectedPro(professional);
    setShowBookingModal(true);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-sm ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

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
                Browse All Professionals
              </Link>
              <span className="text-gray-600">Candidate Dashboard</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Candidate Dashboard</h1>
          <p className="text-gray-600">Manage your upcoming sessions and discover new mentors</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Upcoming Chats */}
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
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {upcomingSessions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-4xl mb-4">💬</div>
                  <div className="text-gray-500 text-lg mb-2">No upcoming sessions</div>
                  <p className="text-gray-400">Book your first chat with a professional!</p>
                </div>
              ) : (
                upcomingSessions.map((session) => (
                  <div key={session._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Profile Picture */}
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                          {session.professional.profileImageUrl ? (
                            <img 
                              src={session.professional.profileImageUrl} 
                              alt={session.professional.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            session.professional.name.charAt(0)
                          )}
                        </div>
                        
                        {/* Session Details */}
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {session.professional.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {session.professional.title} at {session.professional.company}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-indigo-600 font-medium">
                              {formatDate(session.scheduledAt, false)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatTime(session.scheduledAt)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {session.durationMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Join Button */}
                      {session.zoomJoinUrl && session.status === 'confirmed' && (
                        <a
                          href={session.zoomJoinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Join
                        </a>
                      )}
                      
                      {session.status === 'requested' && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Mentor Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-semibold">🔍</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Mentor Search</h2>
              </div>
            </div>
            
            {/* Search Filters */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, company, or expertise..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filters.industry}
                    onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">All Industries</option>
                    <option value="Investment Banking">Investment Banking</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Technology">Technology</option>
                  </select>
                  <select
                    value={filters.maxRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRate: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value={5000}>Up to $50</option>
                    <option value={10000}>Up to $100</option>
                    <option value={15000}>Up to $150</option>
                    <option value={25000}>Up to $250</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Professional List */}
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {filteredProfessionals.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <div className="text-gray-400 text-3xl mb-2">🔍</div>
                  <div className="text-gray-500">No professionals found</div>
                  <p className="text-gray-400 text-sm">Try adjusting your search filters</p>
                </div>
              ) : (
                filteredProfessionals.slice(0, 10).map((pro) => (
                  <div key={pro._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {pro.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{pro.name}</h4>
                          <p className="text-sm text-gray-600 truncate">{pro.title}</p>
                          <p className="text-sm text-indigo-600 font-medium truncate">{pro.company}</p>
                          
                          {/* Rating and Stats */}
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex">
                              {renderStars(pro.averageRating || 0)}
                            </div>
                            {pro.averageRating && (
                              <span className="text-xs text-gray-500">
                                ({pro.averageRating.toFixed(1)})
                              </span>
                            )}
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              ${(pro.sessionRateCents / 100).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-1 ml-2">
                        <button
                          onClick={() => handleViewProfile(pro)}
                          className="px-3 py-1 text-indigo-600 bg-indigo-50 text-xs font-medium rounded hover:bg-indigo-100 transition-colors"
                        >
                          More Info
                        </button>
                        <button
                          onClick={() => handleRequestChat(pro)}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition-colors"
                        >
                          Request Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Professional Profile Modal */}
        {showProfileModal && selectedPro && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedPro.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedPro.name}</h3>
                    <p className="text-gray-600">{selectedPro.title} at {selectedPro.company}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex">
                        {renderStars(selectedPro.averageRating || 0)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {selectedPro.totalSessions} sessions
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-6 space-y-6">
                {/* Professional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Industry</h4>
                    <p className="text-gray-600">{selectedPro.industry}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Experience</h4>
                    <p className="text-gray-600">{selectedPro.yearsExperience} years</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Session Rate</h4>
                    <p className="text-gray-600">${(selectedPro.sessionRateCents / 100).toFixed(0)} per 30 min</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Rating</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {renderStars(selectedPro.averageRating || 0)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {selectedPro.averageRating?.toFixed(1) || 'No ratings yet'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                  <p className="text-gray-600 leading-relaxed">{selectedPro.bio}</p>
                </div>

                {/* Expertise */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPro.expertise.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    handleRequestChat(selectedPro);
                  }}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                >
                  Request Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {showBookingModal && selectedPro && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900">
                  Request Chat with {selectedPro.name}
                </h3>
                <p className="text-gray-600">
                  {selectedPro.title} at {selectedPro.company}
                </p>
              </div>
              
              <div className="px-6 py-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">
                    ${(selectedPro.sessionRateCents / 100).toFixed(0)}
                  </div>
                  <div className="text-gray-600">30-minute video session</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-amber-600 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="font-semibold text-amber-800 mb-1">Development Notice</h4>
                      <p className="text-sm text-amber-700">
                        Booking system integration is in development. This will integrate with Stripe Checkout and calendar scheduling.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-3">What you'll get:</h4>
                  <ul className="text-sm text-indigo-800 space-y-2">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>30-minute video call</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Professional feedback</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Career advice and insights</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Opportunity for referrals</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Booking system integration coming soon!');
                    setShowBookingModal(false);
                  }}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}