'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { formatDate, formatTime, getAvatarGradient, apiRequest } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Navigation from '@/components/ui/Navigation';
import StripeCheckout from '@/components/ui/StripeCheckout';

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

export default function EnhancedCandidateDashboard() {
  const { data: session } = useSession();
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

  const fetchDashboardData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch upcoming sessions
      const sessionsResult = await apiRequest(`/api/sessions/candidate/${session.user.id}`);
      if (sessionsResult.success) {
        setUpcomingSessions(sessionsResult.data?.upcoming || []);
      }

      // Fetch available professionals
      const prosResult = await apiRequest('/api/professional/search');
      if (prosResult.success) {
        setProfessionals(prosResult.data?.professionals || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session, fetchDashboardData]);

  const filterProfessionals = useCallback(() => {
    let filtered = professionals;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        pro =>
          pro.name.toLowerCase().includes(query) ||
          pro.title.toLowerCase().includes(query) ||
          pro.company.toLowerCase().includes(query) ||
          pro.bio.toLowerCase().includes(query) ||
          pro.expertise.some(exp => exp.toLowerCase().includes(query))
      );
    }

    if (filters.industry) {
      filtered = filtered.filter(pro =>
        pro.industry.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }

    if (filters.company) {
      filtered = filtered.filter(pro =>
        pro.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }

    filtered = filtered.filter(
      pro =>
        pro.sessionRateCents <= filters.maxRate * 100 &&
        pro.yearsExperience >= filters.minExperience
    );

    setFilteredProfessionals(filtered);
  }, [professionals, searchQuery, filters]);

  useEffect(() => {
    filterProfessionals();
  }, [filterProfessionals]);

  // Add these state variables after the existing useState declarations (around line 45)
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [bookingStep, setBookingStep] = useState<'datetime' | 'checkout'>('datetime');

  // Add these helper functions before the return statement (around line 180)
  const generateAvailableSlots = () => {
    const slots = [];
    const now = new Date();
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Start tomorrow
    
    // Generate next 7 days of slots
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Skip weekends for business hours
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Morning slot (10 AM)
      const morningSlot = new Date(date);
      morningSlot.setHours(10, 0, 0, 0);
      slots.push({
        date: morningSlot,
        dayLabel: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        timeLabel: '10:00 AM'
      });
      
      // Afternoon slot (2 PM)
      const afternoonSlot = new Date(date);
      afternoonSlot.setHours(14, 0, 0, 0);
      slots.push({
        date: afternoonSlot,
        dayLabel: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        timeLabel: '2:00 PM'
      });
      
      // Only show first 6 slots to keep UI clean
      if (slots.length >= 6) break;
    }
    
    return slots;
  };

  const generateTimeOptions = () => {
    const options = [];
    
    // Business hours: 9 AM to 9 PM
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        const time12 = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        options.push({
          value: time24,
          label: time12
        });
      }
    }
    
    return options;
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
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="candidate" showDashboardLink={false} />

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
                upcomingSessions.map((sessionItem) => (
                  <div key={sessionItem._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${getAvatarGradient(0)} rounded-full flex items-center justify-center text-white font-bold overflow-hidden`}>
                          {sessionItem.professional.profileImageUrl ? (
                            <img 
                              src={sessionItem.professional.profileImageUrl} 
                              alt={sessionItem.professional.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            sessionItem.professional.name.charAt(0)
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {sessionItem.professional.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {sessionItem.professional.title} at {sessionItem.professional.company}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-indigo-600 font-medium">
                              {formatDate(sessionItem.scheduledAt, false)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatTime(sessionItem.scheduledAt)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {sessionItem.durationMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {sessionItem.zoomJoinUrl && sessionItem.status === 'confirmed' && (
                        <a
                          href={sessionItem.zoomJoinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Join
                        </a>
                      )}
                      
                      {sessionItem.status === 'requested' && (
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
                filteredProfessionals.slice(0, 10).map((pro, index) => (
                  <div key={pro._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-10 h-10 ${getAvatarGradient(index + 1)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                          {pro.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{pro.name}</h4>
                          <p className="text-sm text-gray-600 truncate">{pro.title}</p>
                          <p className="text-sm text-indigo-600 font-medium truncate">{pro.company}</p>
                          
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
        <Modal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title={selectedPro?.name}
          subtitle={selectedPro ? `${selectedPro.title} at ${selectedPro.company}` : ''}
          maxWidth="2xl"
          actions={
            <>
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    if (selectedPro) {
                      handleRequestChat(selectedPro);
                    }
                  }}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
              >
                Request Chat
              </button>
            </>
          }
        >
          {selectedPro && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 ${getAvatarGradient(1)} rounded-full flex items-center justify-center text-white font-bold text-xl`}>
                  {selectedPro.name.charAt(0)}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {renderStars(selectedPro.averageRating || 0)}
                  </div>
                  <span className="text-sm text-gray-500">
                    {selectedPro.totalSessions} sessions
                  </span>
                </div>
              </div>

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

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                <p className="text-gray-600 leading-relaxed">{selectedPro.bio}</p>
              </div>

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
          )}
        </Modal>

        {/* Booking Modal */}
        <Modal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedDateTime(null);
            setBookingStep('datetime');
          }}
          title={selectedPro ? `Book Session with ${selectedPro.name}` : ''}
          subtitle={selectedPro ? `${selectedPro.title} at ${selectedPro.company}` : ''}
          maxWidth="3xl"
        >
          {selectedPro && (
            <div className="space-y-6">
              {bookingStep === 'datetime' && (
                <div className="space-y-6">
                  {/* Professional Info */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-12 h-12 ${getAvatarGradient(1)} rounded-full flex items-center justify-center text-white font-bold`}>
                      {selectedPro.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{selectedPro.name}</h4>
                      <p className="text-gray-600">{selectedPro.title} at {selectedPro.company}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex">
                          {renderStars(selectedPro.averageRating || 0)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {selectedPro.totalSessions} sessions
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-lg font-bold text-indigo-600">
                          ${(selectedPro.sessionRateCents / 100).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time Selection */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Select Date & Time</h4>
                    
                    {/* Quick Time Slots */}
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-3">Available this week:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {generateAvailableSlots().map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedDateTime(slot.date)}
                            className={`p-3 text-left border-2 rounded-lg transition-all duration-200 ${
                              selectedDateTime?.getTime() === slot.date.getTime()
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium text-gray-900">{slot.dayLabel}</div>
                            <div className="text-sm text-gray-600">{slot.timeLabel}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Date/Time Input */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm text-gray-600 mb-3">Or choose a specific time:</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            onChange={(e) => {
                              if (e.target.value) {
                                const date = new Date(e.target.value + 'T10:00:00');
                                setSelectedDateTime(date);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                          <select
                            onChange={(e) => {
                              if (selectedDateTime && e.target.value) {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const newDate = new Date(selectedDateTime);
                                newDate.setHours(hours, minutes, 0, 0);
                                setSelectedDateTime(newDate);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select time</option>
                            {generateTimeOptions().map(time => (
                              <option key={time.value} value={time.value}>{time.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {selectedDateTime && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="text-green-500 mt-0.5">✓</div>
                          <div>
                            <h5 className="font-semibold text-green-900">Selected Time</h5>
                            <p className="text-green-800">
                              {selectedDateTime.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} at {selectedDateTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowBookingModal(false);
                        setSelectedDateTime(null);
                      }}
                      className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setBookingStep('checkout')}
                      disabled={!selectedDateTime}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === 'checkout' && selectedDateTime && (
                <StripeCheckout
                  professional={selectedPro}
                  selectedDateTime={selectedDateTime}
                  onSuccess={(sessionData) => {
                    setShowBookingModal(false);
                    setSelectedDateTime(null);
                    setBookingStep('datetime');
                    
                    // Show success message
                    alert(`Session booked successfully! You'll receive a calendar invite and Zoom link for your meeting with ${sessionData.professional.name}.`);
                    
                    // Refresh dashboard data
                    fetchDashboardData();
                  }}
                  onCancel={() => setBookingStep('datetime')}
                  onError={(error) => {
                    alert(`Booking failed: ${error}`);
                    setBookingStep('datetime');
                  }}
                />
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}