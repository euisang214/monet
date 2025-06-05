import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

interface OnboardProfessionalRequest {
  // Step 1: Verification
  workEmail: string;
  linkedinUrl: string;
  resumeFile?: string; // Base64 or file URL after upload
  
  // Step 2: Profile
  name: string;
  title: string;
  company: string;
  industry: string;
  yearsExperience: number;
  bio: string;
  sessionRateCents: number;
  profilePicture?: string; // Base64 or file URL after upload
  
  // Step 3: Banking (optional)
  bankingInfo?: string;
  
  // Additional fields
  referredBy?: string;
}

/**
 * POST /api/professional/onboard
 * Complete professional onboarding with Phase 5 data structure
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: OnboardProfessionalRequest = await request.json();
    const {
      workEmail,
      linkedinUrl,
      resumeFile,
      name,
      title,
      company,
      industry,
      yearsExperience,
      bio,
      sessionRateCents,
      profilePicture,
      bankingInfo,
      referredBy
    } = body;

    // Validate required fields
    if (!workEmail || !name || !title || !company || !industry || !bio || !sessionRateCents) {
      return NextResponse.json(
        { error: 'Missing required fields: workEmail, name, title, company, industry, bio, sessionRateCents' },
        { status: 400 }
      );
    }

    if (sessionRateCents < 1000) { // Minimum $10
      return NextResponse.json(
        { error: 'Session rate must be at least $10' },
        { status: 400 }
      );
    }

    if (yearsExperience < 0) {
      return NextResponse.json(
        { error: 'Years of experience must be non-negative' },
        { status: 400 }
      );
    }

    // Check if user already exists with work email
    let user = await User.findOne({ 
      $or: [
        { workEmail },
        { email: workEmail }
      ]
    });
    
    if (user && user.role === 'professional') {
      return NextResponse.json(
        { error: 'Professional account already exists with this email' },
        { status: 409 }
      );
    }

    // Handle referral lookup
    let referrerProId: string | undefined;
    if (referredBy) {
      const referrer = await User.findOne({
        $or: [
          { _id: referredBy },
          { email: referredBy },
          { workEmail: referredBy }
        ],
        role: 'professional'
      });
      
      if (referrer) {
        referrerProId = referrer._id.toString();
      }
    }

    // Create Stripe Connect account
    const stripeAccount = await stripe.accounts.create({
      type: 'express',
      country: 'US', // TODO: Make this configurable based on work email domain
      email: workEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual',
      individual: {
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
        email: workEmail
      },
      business_profile: {
        mcc: '8299', // Educational services
        product_description: 'Professional mentoring and career consultation services',
        url: linkedinUrl || undefined
      },
      metadata: {
        platform_user_id: user?._id?.toString() || 'pending',
        user_email: workEmail,
        company,
        title,
        signup_source: 'phase5_onboarding'
      }
    });

    // Create or update user
    if (user) {
      // Update existing user to professional
      user.role = 'professional';
      user.workEmail = workEmail;
      user.workEmailVerified = false; // Will be verified via email
      user.name = name;
      user.title = title;
      user.company = company;
      user.industry = industry;
      user.yearsExperience = yearsExperience;
      user.bio = bio;
      user.sessionRateCents = sessionRateCents;
      user.linkedinUrl = linkedinUrl;
      user.stripeAccountId = stripeAccount.id;
      user.stripeAccountVerified = false;
      user.referredBy = referrerProId;
      
      // Handle file uploads
      if (resumeFile) {
        user.resumeUrl = resumeFile; // Store file URL after upload
      }
      if (profilePicture) {
        user.profileImageUrl = profilePicture; // Store image URL after upload
      }
    } else {
      // Create new professional user
      user = new User({
        email: workEmail, // Use work email as primary email
        workEmail,
        workEmailVerified: false,
        name,
        role: 'professional',
        title,
        company,
        industry,
        yearsExperience,
        bio,
        sessionRateCents,
        linkedinUrl,
        stripeAccountId: stripeAccount.id,
        stripeAccountVerified: false,
        referredBy: referrerProId,
        resumeUrl: resumeFile,
        profileImageUrl: profilePicture
      });
    }

    await user.save();

    // Update Stripe account metadata with user ID
    await stripe.accounts.update(stripeAccount.id, {
      metadata: {
        ...stripeAccount.metadata,
        platform_user_id: user._id.toString()
      }
    });

    // Create Stripe account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/auth/signup/professional?step=3&refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/professional/dashboard`,
      type: 'account_onboarding'
    });

    console.log('Professional onboarded (Phase 5):', user._id, 'Stripe account:', stripeAccount.id);

    // TODO: Send work email verification email
    // await sendWorkEmailVerification(workEmail, user._id);

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        stripeAccountId: stripeAccount.id,
        stripeOnboardingUrl: accountLink.url,
        emailVerificationRequired: true,
        message: 'Onboarding initiated successfully. Please check your work email for verification.'
      }
    });

  } catch (error) {
    console.error('Professional onboarding error (Phase 5):', error);
    
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Payment setup failed: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/professional/onboard?email=xxx
 * Check onboarding status for a professional (updated for Phase 5)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const workEmail = searchParams.get('workEmail');

    if (!email && !workEmail) {
      return NextResponse.json(
        { error: 'Email or workEmail parameter is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ 
      $or: [
        { email: email || workEmail },
        { workEmail: email || workEmail }
      ],
      role: 'professional' 
    }).select('name email workEmail workEmailVerified stripeAccountId stripeAccountVerified sessionRateCents title company');

    if (!user) {
      return NextResponse.json(
        { error: 'Professional not found' },
        { status: 404 }
      );
    }

    // Check Stripe account status
    let stripeAccountStatus = null;
    if (user.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        stripeAccountStatus = {
          chargesEnabled: account.charges_enabled,
          detailsSubmitted: account.details_submitted,
          payoutsEnabled: account.payouts_enabled
        };
      } catch (stripeError) {
        console.error('Failed to retrieve Stripe account:', stripeError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          workEmail: user.workEmail,
          workEmailVerified: user.workEmailVerified,
          title: user.title,
          company: user.company,
          sessionRate: user.sessionRateCents / 100
        },
        stripeAccountStatus,
        isFullyOnboarded: user.workEmailVerified && 
                         stripeAccountStatus?.chargesEnabled && 
                         stripeAccountStatus?.payoutsEnabled,
        verificationSteps: {
          workEmailVerified: user.workEmailVerified,
          stripeAccountSetup: stripeAccountStatus?.detailsSubmitted || false,
          paymentsEnabled: stripeAccountStatus?.chargesEnabled || false
        }
      }
    });

  } catch (error) {
    console.error('Check onboarding status error (Phase 5):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/professional/onboard
 * Update professional profile after initial onboarding
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'professional') {
      return NextResponse.json(
        { error: 'Professional not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'title', 'company', 'industry', 'yearsExperience', 
      'bio', 'sessionRateCents', 'linkedinUrl', 'profileImageUrl', 'resumeUrl'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        (user as any)[key] = value;
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          title: user.title,
          company: user.company,
          sessionRate: user.sessionRateCents / 100
        }
      }
    });

  } catch (error) {
    console.error('Update professional profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}