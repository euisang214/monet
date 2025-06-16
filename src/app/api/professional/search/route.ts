import { NextRequest } from 'next/server';
import { withDB, successResponse } from '@/lib/api/error-handler';
import User from '@/lib/models/User';
import { CandidateRating } from '@/lib/models/Feedback';
import Session from '@/lib/models/Session';

/**
 * GET /api/professional/search
 * Search and filter professionals available for booking
 */
export const GET = withDB(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const industry = searchParams.get('industry') || '';
  const company = searchParams.get('company') || '';
  const expertise = searchParams.get('expertise') || '';
  const maxRate = searchParams.get('maxRate') ? parseInt(searchParams.get('maxRate')!) : null;
  const minExperience = searchParams.get('minExperience') ? parseInt(searchParams.get('minExperience')!) : null;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

  // Build MongoDB query
  const mongoQuery: Record<string, unknown> = {
    role: 'professional',
    sessionRateCents: { $gt: 0 }, // Only professionals with set rates
  };

  // Text search across multiple fields
  if (query) {
    mongoQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { title: { $regex: query, $options: 'i' } },
      { company: { $regex: query, $options: 'i' } },
      { bio: { $regex: query, $options: 'i' } },
      { expertise: { $in: [new RegExp(query, 'i')] } }
    ];
  }

  // Apply filters  
  if (industry) {
    mongoQuery.industry = { $regex: industry, $options: 'i' };
  }

  if (company) {
    mongoQuery.company = { $regex: company, $options: 'i' };
  }

  if (expertise) {
    mongoQuery.expertise = { $in: [new RegExp(expertise, 'i')] };
  }

  if (maxRate) {
    mongoQuery.sessionRateCents = {
      ...(typeof mongoQuery.sessionRateCents === 'object' ? mongoQuery.sessionRateCents as Record<string, unknown> : {}),
      $lte: maxRate
    };
  }

  if (minExperience) {
    mongoQuery.yearsExperience = { $gte: minExperience };
  }

  // Fetch professionals
  const professionals = await User.find(mongoQuery)
    .select('name title company industry expertise sessionRateCents bio yearsExperience profileImageUrl')
    .limit(limit)
    .sort({ sessionRateCents: 1 }) // Sort by rate (ascending)
    .lean();

  // Enrich with ratings and session count
  const enrichedProfessionals = await Promise.all(
    professionals.map(async (pro) => {
      // Get average rating
      const ratings = await CandidateRating.find({ professionalId: pro._id }).select('rating');
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      // Get total completed sessions
      const totalSessions = await Session.countDocuments({
        professionalId: pro._id,
        status: 'completed'
      });

      return {
        ...pro,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalSessions
      };
    })
  );

  // Get aggregated data for filters
  const [industries, companies, skills] = await Promise.all([
    User.distinct('industry', { role: 'professional', industry: { $exists: true, $ne: '' } }),
    User.distinct('company', { role: 'professional', company: { $exists: true, $ne: '' } }),
    User.aggregate([
      { $match: { role: 'professional', expertise: { $exists: true, $ne: [] } } },
      { $unwind: '$expertise' },
      { $group: { _id: '$expertise' } },
      { $sort: { _id: 1 } },
      { $limit: 50 }
    ])
  ]);

  return successResponse({
    professionals: enrichedProfessionals,
    filters: {
      industries: industries.filter(Boolean).sort(),
      companies: companies.filter(Boolean).sort(),
      skills: skills.map(s => s._id).filter(Boolean).sort()
    },
    pagination: {
      total: enrichedProfessionals.length,
      limit,
      hasMore: enrichedProfessionals.length === limit
    }
  });
});