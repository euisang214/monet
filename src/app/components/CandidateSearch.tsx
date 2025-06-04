'use client';

import { useState, useEffect } from 'react';

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

export default function CandidateSearch() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    industry: '',
    company: '',
    expertise: '',
    maxRate: 1000, // $10.00 max by default
    minExperience: 0
  });
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
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

    // Expertise filter
    if (filters.expertise) {
      filtered = filtered.filter(pro =>
        pro.expertise.some(exp =>
          exp.toLowerCase().includes(filters.expertise.toLowerCase())
        )
      );
    }

    // Rate filter
    filtered = filtered.filter(pro =>
      pro.sessionRateCents <= filters.maxRate * 100
    );

    // Experience filter
    filtered = filtered.filter(pro =>
      pro.yearsExperience >= filters.minExperience
    );

    setFilteredProfessionals(filtered);
  }, [professionals, searchQuery, filters]);

  const fetchProfessionals = async () => {
    try {
      const response = await fetch('/api/professionals/search');
      const data = await response.json();
      
      if (data.success) {
        setProfessionals(data.data.professionals || []);
      }
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = (professional: Professional) => {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Your Mentor</h1>
        <p className="text-gray-600">
          Connect with experienced professionals for career guidance and interview prep
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
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredProfessionals.length} Professionals Found
          </h2>
        </div>

        {filteredProfessionals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No professionals found matching your criteria</div>
            <p className="text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfessionals.map((pro) => (
              <div key={pro._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {pro.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {pro.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {pro.title} at {pro.company}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {pro.yearsExperience} years • {pro.industry}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {pro.bio}
                    </p>
                  </div>

                  {/* Expertise Tags */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {pro.expertise.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {pro.expertise.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{pro.expertise.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Rating and Stats */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {renderStars(pro.averageRating || 0)}
                      </div>
                      {pro.totalSessions && (
                        <span className="text-xs text-gray-500">
                          ({pro.totalSessions} sessions)
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${(pro.sessionRateCents / 100).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">per session</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookSession(pro)}
                    className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedPro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Book Session with {selectedPro.name}
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="text-center py-8">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  ${(selectedPro.sessionRateCents / 100).toFixed(2)}
                </div>
                <div className="text-gray-600 mb-6">
                  30-minute session
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    Booking system integration coming soon! This will integrate with Stripe Checkout and calendar scheduling.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 mb-2">What you&apos;ll get:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 30-minute video call</li>
                      <li>• Professional feedback</li>
                      <li>• Career advice and insights</li>
                      <li>• Opportunity for referrals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement actual booking with Stripe
                  alert('Booking system integration coming soon!');
                  setShowBookingModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}