import { NextRequest } from 'next/server';
import { withDB, successResponse } from '@/lib/api/error-handler';
import User from '@/lib/models/User';

/**
 * GET /api/candidate/search
 * Basic candidate search with optional filters
 */
export const GET = withDB(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const school = searchParams.get('school') || '';
  const major = searchParams.get('major') || '';
  const targetRole = searchParams.get('targetRole') || '';
  const targetIndustry = searchParams.get('targetIndustry') || '';
  const graduationYear = searchParams.get('graduationYear') || '';
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

  const mongoQuery: Record<string, unknown> = { role: 'candidate' };

  if (query) {
    mongoQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { targetRole: { $regex: query, $options: 'i' } },
      { targetIndustry: { $regex: query, $options: 'i' } },
      { school: { $regex: query, $options: 'i' } },
      { major: { $regex: query, $options: 'i' } }
    ];
  }

  if (school) mongoQuery.school = { $regex: school, $options: 'i' };
  if (major) mongoQuery.major = { $regex: major, $options: 'i' };
  if (targetRole) mongoQuery.targetRole = { $regex: targetRole, $options: 'i' };
  if (targetIndustry) mongoQuery.targetIndustry = { $regex: targetIndustry, $options: 'i' };
  if (graduationYear) mongoQuery.graduationYear = graduationYear;

  const candidates = await User.find(mongoQuery)
    .select('name targetRole targetIndustry school major graduationYear profileImageUrl')
    .limit(limit)
    .lean();

  const [schools, majors, roles] = await Promise.all([
    User.distinct('school', { role: 'candidate', school: { $exists: true, $ne: '' } }),
    User.distinct('major', { role: 'candidate', major: { $exists: true, $ne: '' } }),
    User.distinct('targetRole', { role: 'candidate', targetRole: { $exists: true, $ne: '' } })
  ]);

  return successResponse({
    candidates,
    filters: {
      schools: schools.filter(Boolean).sort(),
      majors: majors.filter(Boolean).sort(),
      roles: roles.filter(Boolean).sort()
    },
    pagination: {
      total: candidates.length,
      limit,
      hasMore: candidates.length === limit
    }
  });
});
