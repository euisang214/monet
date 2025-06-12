import { NextRequest } from 'next/server';
import { withAuth, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
import type { Session } from 'next-auth';
import { connectDB } from '@/lib/models/db';
import User from '@/lib/models/User';

interface UpdateProfileRequest {
  userId: string;
  name?: string;
  linkedinUrl?: string;
  
  // Candidate fields
  school?: string;
  major?: string;
  minor?: string;
  graduationYear?: string;
  gpa?: string;
  targetRole?: string;
  targetIndustry?: string;
  offerBonusCents?: number;
  schoolEmail?: string;
  resumeUrl?: string;
  clubs?: string;

  // Professional fields
  title?: string;
  company?: string;
  industry?: string;
  yearsExperience?: number;
  sessionRateCents?: number;
  bio?: string;
  expertise?: string[];
  workEmail?: string;
}

/**
 * PUT /api/profile/update
 * Update user profile information
 */
export const PUT = withAuth(async (request: NextRequest, context: Record<string, unknown>, session: Session) => {
  await connectDB();
  
  // Validate request body
  const validation = await validateRequestBody<UpdateProfileRequest>(request, [
    'userId'
  ]);
  
  if (!validation.isValid) {
    return errorResponse(validation.error!, 400);
  }
  
  const { userId, ...updateData } = validation.data!;

  // Verify the user ID matches the session
  if (userId !== session.user.id) {
    return errorResponse('Unauthorized', 403);
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    return errorResponse('User not found', 404);
  }

  // Validate email formats if provided
  if (updateData.schoolEmail && !isValidEduEmail(updateData.schoolEmail)) {
    return errorResponse('School email must end with .edu', 400);
  }

  if (updateData.workEmail && !isValidEmail(updateData.workEmail)) {
    return errorResponse('Invalid work email format', 400);
  }

  if (updateData.linkedinUrl && !isValidLinkedInUrl(updateData.linkedinUrl)) {
    return errorResponse('Invalid LinkedIn URL format', 400);
  }

  // Update common fields
  if (updateData.name !== undefined) {
    user.name = updateData.name.trim();
  }
  if (updateData.linkedinUrl !== undefined) {
    user.linkedinUrl = updateData.linkedinUrl.trim();
  }

  // Update role-specific fields
  if (user.role === 'candidate') {
    // Update candidate fields
    if (updateData.school !== undefined) user.school = updateData.school.trim();
    if (updateData.major !== undefined) user.major = updateData.major.trim();
    if (updateData.minor !== undefined) user.minor = updateData.minor.trim();
    if (updateData.graduationYear !== undefined) user.graduationYear = updateData.graduationYear;
    if (updateData.gpa !== undefined) user.gpa = updateData.gpa.trim();
    if (updateData.targetRole !== undefined) user.targetRole = updateData.targetRole.trim();
    if (updateData.targetIndustry !== undefined) user.targetIndustry = updateData.targetIndustry;
    if (updateData.offerBonusCents !== undefined) user.offerBonusCents = Math.max(0, updateData.offerBonusCents);
    if (updateData.schoolEmail !== undefined) user.schoolEmail = updateData.schoolEmail.trim();
    if (updateData.resumeUrl !== undefined) user.resumeUrl = updateData.resumeUrl.trim();
    if (updateData.clubs !== undefined) user.clubs = updateData.clubs.trim();

  } else if (user.role === 'professional') {
    // Update professional fields
    if (updateData.title !== undefined) user.title = updateData.title.trim();
    if (updateData.company !== undefined) user.company = updateData.company.trim();
    if (updateData.industry !== undefined) user.industry = updateData.industry;
    if (updateData.yearsExperience !== undefined) user.yearsExperience = Math.max(0, updateData.yearsExperience);
    if (updateData.sessionRateCents !== undefined) {
      if (updateData.sessionRateCents < 1000) {
        return errorResponse('Session rate must be at least $10', 400);
      }
      user.sessionRateCents = updateData.sessionRateCents;
    }
    if (updateData.bio !== undefined) user.bio = updateData.bio.trim();
    if (updateData.expertise !== undefined) {
      user.expertise = updateData.expertise.filter(e => e.trim().length > 0).map(e => e.trim());
    }
    if (updateData.workEmail !== undefined) user.workEmail = updateData.workEmail.trim();
  }

  await user.save();

  console.log(`Profile updated for user ${userId} (${user.role})`);

  return successResponse({
    userId: user._id,
    message: 'Profile updated successfully',
    profile: {
      name: user.name,
      email: user.email,
      role: user.role,
      linkedinUrl: user.linkedinUrl,
      ...(user.role === 'candidate' && {
        school: user.school,
        major: user.major,
        minor: user.minor,
        graduationYear: user.graduationYear,
        gpa: user.gpa,
        targetRole: user.targetRole,
        targetIndustry: user.targetIndustry,
        offerBonusCents: user.offerBonusCents,
        schoolEmail: user.schoolEmail,
        resumeUrl: user.resumeUrl,
        clubs: user.clubs
      }),
      ...(user.role === 'professional' && {
        title: user.title,
        company: user.company,
        industry: user.industry,
        yearsExperience: user.yearsExperience,
        sessionRateCents: user.sessionRateCents,
        bio: user.bio,
        expertise: user.expertise,
        workEmail: user.workEmail
      })
    }
  });
});

// Helper validation functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidEduEmail(email: string): boolean {
  const eduEmailRegex = /^[^\s@]+@[^\s@]+\.edu$/;
  return eduEmailRegex.test(email);
}

function isValidLinkedInUrl(url: string): boolean {
  const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/;
  return linkedinRegex.test(url);
}