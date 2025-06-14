'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/utils';

interface Candidate {
  _id: string;
  name: string;
  targetRole?: string;
  targetIndustry?: string;
  school?: string;
  major?: string;
  graduationYear?: string;
  profileImageUrl?: string;
}

interface CandidateFilters {
  school: string;
  major: string;
  targetRole: string;
}

export default function CandidateDirectory() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CandidateFilters>({
    school: '',
    major: '',
    targetRole: ''
  });

  const fetchCandidates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filters.school) params.append('school', filters.school);
      if (filters.major) params.append('major', filters.major);
      if (filters.targetRole) params.append('targetRole', filters.targetRole);

      const url = `/api/candidate/search${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await apiRequest<{ candidates: Candidate[] }>(url);
      if (result.success) {
        setCandidates(result.data?.candidates || []);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const filterCandidates = useCallback(() => {
    let filtered = candidates;

    const noFilters =
      !searchQuery &&
      !filters.school &&
      !filters.major &&
      !filters.targetRole;

    if (noFilters) {
      setFilteredCandidates(candidates);
      return;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          (c.targetRole && c.targetRole.toLowerCase().includes(q)) ||
          (c.targetIndustry && c.targetIndustry.toLowerCase().includes(q)) ||
          (c.school && c.school.toLowerCase().includes(q)) ||
          (c.major && c.major.toLowerCase().includes(q))
      );
    }

    if (filters.school) {
      filtered = filtered.filter(c => c.school && c.school.toLowerCase().includes(filters.school.toLowerCase()));
    }
    if (filters.major) {
      filtered = filtered.filter(c => c.major && c.major.toLowerCase().includes(filters.major.toLowerCase()));
    }
    if (filters.targetRole) {
      filtered = filtered.filter(c => c.targetRole && c.targetRole.toLowerCase().includes(filters.targetRole.toLowerCase()));
    }

    setFilteredCandidates(filtered);
  }, [candidates, searchQuery, filters]);

  useEffect(() => {
    filterCandidates();
  }, [filterCandidates]);

  if (loading) {
    return <div className="p-6 text-center">Loading candidates...</div>;
  }

  return (
    <div id="candidates" className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-sm font-semibold">🔍</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Candidate Search</h2>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-100 space-y-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, school, or role..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={filters.school}
            onChange={(e) => setFilters(prev => ({ ...prev, school: e.target.value }))}
            placeholder="School"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <input
            type="text"
            value={filters.major}
            onChange={(e) => setFilters(prev => ({ ...prev, major: e.target.value }))}
            placeholder="Major"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <input
          type="text"
          value={filters.targetRole}
          onChange={(e) => setFilters(prev => ({ ...prev, targetRole: e.target.value }))}
          placeholder="Target Role"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {filteredCandidates.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">No candidates found</div>
        ) : (
          filteredCandidates.slice(0, 10).map((cand) => (
            <div key={cand._id} className="px-6 py-3 flex items-center space-x-3 hover:bg-gray-50">
              <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {cand.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{cand.name}</h4>
                {cand.targetRole && <p className="text-sm text-gray-600 truncate">{cand.targetRole}</p>}
                {cand.school && <p className="text-xs text-gray-500 truncate">{cand.school}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
