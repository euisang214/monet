import { NextRequest } from 'next/server';
import { withAuth, errorResponse, successResponse } from '@/lib/api/error-handler';
import type { Session } from 'next-auth';
import { connectDB } from '@/lib/models/db';
import User from '@/lib/models/User';

/**
 * GET /api/auth/profile/[id]
 * Get user profile data for completion
 */
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session: Session
) => {
  const { id: userId } = params;

  await connectDB();

  // Verify the user ID matches the session
  if (userId !== session.user.id) {
    return errorResponse('Unauthorized', 403);
  }

  // Get user profile
  const user = await User.findById(userId);
  if (!user) {
    return errorResponse('User not found', 404);
  }

  // Return role-specific profile data
  let profileData = {};

  if (user.role === 'candidate') {
    profileData = {
      school: user.school || '',
      major: user.major || '',
      minor: user.minor || '',
      graduationYear: user.graduationYear || '',
      gpa: user.gpa || '',
      targetRole: user.targetRole || '',
      targetIndustry: user.targetIndustry || '',
      offerBonusCents: user.offerBonusCents || 20000,
      schoolEmail: user.schoolEmail || '',
      linkedinUrl: user.linkedinUrl || '',
      resumeUrl: user.resumeUrl || '',
      clubs: user.clubs || '',
      
      // Verification status (read-only)
      schoolEmailVerified: user.schoolEmailVerified || false
    };
  } else if (user.role === 'professional') {
    profileData = {
      // Existing fields
      title: user.title || '',
      company: user.company || '',
      industry: user.industry || '',
      yearsExperience: user.yearsExperience || 0,
      sessionRateCents: user.sessionRateCents || 5000,
      bio: user.bio || '',
      expertise: user.expertise || [],
      
      // New fields
      workEmail: user.workEmail || '',
      linkedinUrl: user.linkedinUrl || '',
      
      // Verification status (read-only)
      workEmailVerified: user.workEmailVerified || false,
      stripeAccountVerified: user.stripeAccountVerified || false
    };
  }

  return successResponse(profileData);
});