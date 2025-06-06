import { NextRequest } from 'next/server';
import { withAuth, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
import { connectDB } from '@/lib/models/db';
import User from '@/lib/models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
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
  // Professional fields
  title?: string;
  company?: string;
  industry?: string;
  yearsExperience?: number;
  sessionRateCents?: number;
  bio?: string;
  expertise?: string[];
}

/**
 * POST /api/auth/complete-profile
 * Complete user profile after role selection
 */
export const POST = withAuth(async (request: NextRequest, context: any, session: any) => {
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

  // Update profile based on role
  if (role === 'candidate') {
    // Validate candidate fields
    if (!profileData.school || !profileData.major || !profileData.targetRole) {
      return errorResponse('Missing required fields: school, major, targetRole', 400);
    }

    // Update candidate profile
    user.school = profileData.school;
    user.major = profileData.major;
    user.minor = profileData.minor || '';
    user.graduationYear = profileData.graduationYear || '';
    user.gpa = profileData.gpa || '';
    user.targetRole = profileData.targetRole;
    user.targetIndustry = profileData.targetIndustry || '';
    user.offerBonusCents = profileData.offerBonusCents || 20000;

  } else if (role === 'professional') {
    // Validate professional fields
    if (!profileData.title || !profileData.company || !profileData.industry || !profileData.bio) {
      return errorResponse('Missing required fields: title, company, industry, bio', 400);
    }

    if ((profileData.sessionRateCents || 0) < 1000) {
      return errorResponse('Session rate must be at least $10', 400);
    }

    // Update professional profile
    user.title = profileData.title;
    user.company = profileData.company;
    user.industry = profileData.industry;
    user.yearsExperience = profileData.yearsExperience || 0;
    user.sessionRateCents = profileData.sessionRateCents || 5000;
    user.bio = profileData.bio;
    user.expertise = profileData.expertise || [];

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
          title: profileData.title
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