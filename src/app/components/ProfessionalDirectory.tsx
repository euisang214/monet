'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { formatCurrencyDisplay, apiRequest } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Navigation from '@/components/ui/Navigation';

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

interface SearchFilters {
  industry: string;
  company: string;
  expertise: string;
  maxRate: number;
  minExperience: number;
}

export default function ProfessionalDirectory() {
  const { isAuthenticated, isLoading } = useAuthGuard({
    requiredRole: 'candidate',
    requireProfileComplete: false // Allow incomplete profiles to browse
  });
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    industry: '',
    company: '',
    expertise: '',
    maxRate: 10000, // $100.00 max by default
    minExperience: 0
  });
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const fetchProfessionals = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.company) params.append('company', filters.company);
      if (filters.expertise) params.append('expertise', filters.expertise);
      if (filters.maxRate) params.append('maxRate', filters.maxRate.toString());
      if (filters.minExperience) params.append('minExperience', filters.minExperience.toString());

      const url = `/api/professional/search${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await apiRequest<{ professionals: Professional[] }>(url);
      if (result.success) {
        setProfessionals(result.data?.professionals || []);
      }
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfessionals();
    }
  }, [filters, searchQuery, isAuthenticated, fetchProfessionals]);

  const handleBookSession = (professional: Professional) => {
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

  // Show loading while checking auth or fetching data
  if (isLoading || loading) {
    return <LoadingSpinner message="Finding professionals for you..." />;
  }

  // Don't render if not authenticated (will redirect via useAuthGuard)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="candidate" showDashboardLink={true} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Your Mentor</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect with experienced professionals for career guidance and interview prep. 
            Get personalized advice from industry experts.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, title, company, or skills..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Industry Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <input
                type="text"
                value={filters.industry}
                onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="Tech, Finance..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={filters.company}
                onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Google, Meta..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Rate Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Rate
              </label>
              <select
                value={filters.maxRate}
                onChange={(e) => setFilters(prev => ({ ...prev, maxRate: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2500}>$25+</option>
                <option value={5000}>$50+</option>
                <option value={10000}>$100+</option>
                <option value={15000}>$150+</option>
                <option value={20000}>$200+</option>
              </select>
            </div>

            {/* Experience Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Experience
              </label>
              <select
                value={filters.minExperience}
                onChange={(e) => setFilters(prev => ({ ...prev, minExperience: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Any</option>
                <option value={2}>2+ years</option>
                <option value={5}>5+ years</option>
                <option value={10}>10+ years</option>
                <option value={15}>15+ years</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {professionals.length} Professionals Found
            </h2>
            <div className="text-sm text-gray-500">
              Showing {professionals.length} results
            </div>
          </div>

          {professionals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <div className="text-gray-500 text-lg mb-2">No professionals found matching your criteria</div>
              <p className="text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professionals.map((pro) => (
                <div key={pro._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:border-indigo-200">
                  <div className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {pro.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg truncate mb-1">
                          {pro.name}
                        </h3>
                        <p className="text-gray-600 text-sm truncate mb-1">
                          {pro.title}
                        </p>
                        <p className="text-indigo-600 text-sm font-medium truncate">
                          {pro.company}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center text-xs text-gray-500 mb-2 space-x-4">
                        <span>{pro.yearsExperience} years experience</span>
                        <span>•</span>
                        <span>{pro.industry}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {pro.bio}
                      </p>
                    </div>

                    {/* Expertise Tags */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1.5">
                        {pro.expertise.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {pro.expertise.length > 3 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                            +{pro.expertise.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating and Stats */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStars(pro.averageRating || 0)}
                        </div>
                        {pro.averageRating && pro.averageRating > 0 && (
                          <span className="text-xs text-gray-500">
                            ({pro.averageRating.toFixed(1)})
                          </span>
                        )}
                        {pro.totalSessions && (
                          <span className="text-xs text-gray-400">
                            • {pro.totalSessions} sessions
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrencyDisplay(pro.sessionRateCents)}
                        </div>
                        <div className="text-xs text-gray-500">per 30-min session</div>
                      </div>
                      <button
                        onClick={() => handleBookSession(pro)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm"
                      >
                        Book Session
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Modal - Simplified placeholder */}
        {showBookingModal && selectedPro && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedPro.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Book Session with {selectedPro.name}
                    </h3>
                    <p className="text-gray-600">
                      {selectedPro.title} at {selectedPro.company}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">
                    {formatCurrencyDisplay(selectedPro.sessionRateCents)}
                  </div>
                  <div className="text-gray-600 mb-4">
                    30-minute video session
                  </div>
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