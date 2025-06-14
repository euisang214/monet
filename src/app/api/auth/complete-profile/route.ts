import { NextRequest } from 'next/server';
import { withAuth, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
import type { Session } from 'next-auth';
import { connectDB } from '@/lib/models/db';
import User from '@/lib/models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

interface CompleteProfileRequest {
  userId: string;
  role: 'candidate' | 'professional';
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
  linkedinUrl?: string;
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
 * POST /api/auth/complete-profile
 * Complete user profile after role selection
 */
export const POST = withAuth(async (request: NextRequest, context: Record<string, unknown>, session: Session) => {
  await connectDB();
  
  // Validate request body
  const validation = await validateRequestBody<CompleteProfileRequest>(request, [
    'userId', 'role'
  ]);
  
  if (!validation.isValid) {
    return errorResponse(validation.error!, 400);
  }
  
  const { userId, role, ...profileData } = validation.data!;

  // Verify the user ID matches the session
  if (userId !== session.user.id) {
    return errorResponse('Unauthorized', 403);
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    return errorResponse('User not found', 404);
  }

  if (user.role !== role) {
    return errorResponse('Role mismatch', 400);
  }

  // Validate email formats if provided
  if (profileData.schoolEmail && !isValidEduEmail(profileData.schoolEmail)) {
    return errorResponse('School email must end with .edu', 400);
  }

  if (profileData.workEmail && !isValidEmail(profileData.workEmail)) {
    return errorResponse('Invalid work email format', 400);
  }

  if (profileData.linkedinUrl && !isValidLinkedInUrl(profileData.linkedinUrl)) {
    return errorResponse('Invalid LinkedIn URL format', 400);
  }

  // Update profile based on role
  if (role === 'candidate') {
    // Validate candidate fields
    if (!profileData.school || !profileData.major || !profileData.targetRole) {
      return errorResponse('Missing required fields: school, major, targetRole', 400);
    }

    // Update candidate profile with new fields
    user.school = profileData.school;
    user.major = profileData.major;
    user.minor = profileData.minor || '';
    user.graduationYear = profileData.graduationYear || '';
    user.gpa = profileData.gpa || '';
    user.targetRole = profileData.targetRole;
    user.targetIndustry = profileData.targetIndustry || '';
    user.offerBonusCents = profileData.offerBonusCents || 20000;
    if (profileData.schoolEmail) {
      user.schoolEmail = profileData.schoolEmail.trim();
    }
    if (profileData.linkedinUrl) {
      user.linkedinUrl = profileData.linkedinUrl.trim();
    }
    if (profileData.resumeUrl) {
      user.resumeUrl = profileData.resumeUrl.trim();
    }
    user.clubs = profileData.clubs || '';

  } else if (role === 'professional') {
    // Validate professional fields
    if (!profileData.title || !profileData.company || !profileData.industry || !profileData.bio) {
      return errorResponse('Missing required fields: title, company, industry, bio', 400);
    }

    if ((profileData.sessionRateCents || 0) < 1000) {
      return errorResponse('Session rate must be at least $10', 400);
    }

    // Update professional profile with new fields
    user.title = profileData.title;
    user.company = profileData.company;
    user.industry = profileData.industry;
    user.yearsExperience = profileData.yearsExperience || 0;
    user.sessionRateCents = profileData.sessionRateCents || 5000;
    user.bio = profileData.bio;
    user.expertise = profileData.expertise || [];
    
    // New fields
    if (profileData.workEmail) {
      user.workEmail = profileData.workEmail.trim();
    }
    if (profileData.linkedinUrl) {
      user.linkedinUrl = profileData.linkedinUrl.trim();
    }

    // Create Stripe Connect account for professional
    try {
      const stripeAccount = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual',
        individual: {
          first_name: user.name?.split(' ')[0] || 'Professional',
          last_name: user.name?.split(' ').slice(1).join(' ') || user.name?.split(' ')[0] || 'User',
          email: user.email
        },
        business_profile: {
          mcc: '8299', // Educational services
          product_description: 'Professional mentoring and career consultation services'
        },
        metadata: {
          platform_user_id: user._id.toString(),
          user_email: user.email,
          company: profileData.company,
          title: profileData.title,
          work_email: profileData.workEmail ? profileData.workEmail.trim() : '',
          linkedin_url: profileData.linkedinUrl ? profileData.linkedinUrl.trim() : ''
        }
      });

      user.stripeAccountId = stripeAccount.id;

      // Create Stripe account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccount.id,
        refresh_url: `${process.env.NEXTAUTH_URL}/auth/setup/professional?refresh=true`,
        return_url: `${process.env.NEXTAUTH_URL}/professional/dashboard`,
        type: 'account_onboarding'
      });

      await user.save();

      console.log('Professional profile completed:', user._id, 'Stripe account:', stripeAccount.id);

      return successResponse({
        userId: user._id,
        profileComplete: true,
        stripeOnboardingUrl: accountLink.url,
        message: 'Profile completed successfully. Please complete Stripe onboarding to start earning.'
      });

    } catch (stripeError) {
      console.error('Stripe account creation failed:', stripeError);
      // Save profile even if Stripe fails - they can set up payments later
      await user.save();
      
      return successResponse({
        userId: user._id,
        profileComplete: true,
        message: 'Profile completed successfully. You can set up payments later.'
      });
    }
  }

  await user.save();

  console.log(`${role} profile completed:`, user._id);

  return successResponse({
    userId: user._id,
    profileComplete: true,
    message: 'Profile completed successfully!'
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