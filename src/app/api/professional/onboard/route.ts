import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

interface OnboardProfessionalRequest {
  name: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  yearsExperience: number;
  bio: string;
  expertise: string[];
  sessionRateCents: number;
  linkedinUrl?: string;
  referredBy?: string;
}

/**
 * POST /api/professionals/onboard
 * Complete professional onboarding and create Stripe Connect account
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: OnboardProfessionalRequest = await request.json();
    const {
      name,
      email,
      title,
      company,
      industry,
      yearsExperience,
      bio,
      expertise,
      sessionRateCents,
      linkedinUrl,
      referredBy
    } = body;

    // Validate required fields
    if (!name || !email || !title || !company || !industry || !bio || !expertise.length || !sessionRateCents) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (sessionRateCents < 1000) { // Minimum $10
      return NextResponse.json(
        { error: 'Session rate must be at least $10' },
        { status: 400 }
      );
    }

    if (expertise.length === 0) {
      return NextResponse.json(
        { error: 'At least one area of expertise is required' },
        { status: 400 }
      );
    }

    if (yearsExperience < 0) {
      return NextResponse.json(
        { error: 'Years of experience must be non-negative' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    
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
          { email: referredBy }
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
      country: 'US', // TODO: Make this configurable
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual',
      individual: {
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
        email
      },
      business_profile: {
        mcc: '8299', // Educational services
        product_description: 'Professional mentoring and career consultation services'
      },
      metadata: {
        platform_user_id: user?._id?.toString() || 'pending',
        user_email: email,
        company,
        title
      }
    });

    // Create or update user
    if (user) {
      // Update existing candidate to professional
      user.role = 'professional';
      user.name = name;
      user.title = title;
      user.company = company;
      user.industry = industry;
      user.yearsExperience = yearsExperience;
      user.bio = bio;
      user.expertise = expertise;
      user.sessionRateCents = sessionRateCents;
      user.linkedinUrl = linkedinUrl;
      user.stripeAccountId = stripeAccount.id;
      user.referredBy = referrerProId;
    } else {
      // Create new professional user
      user = new User({
        email,
        name,
        role: 'professional',
        title,
        company,
        industry,
        yearsExperience,
        bio,
        expertise,
        sessionRateCents,
        linkedinUrl,
        stripeAccountId: stripeAccount.id,
        referredBy: referrerProId
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
      refresh_url: `${process.env.NEXTAUTH_URL}/professional/onboard/refresh`,
      return_url: `${process.env.NEXTAUTH_URL}/professional/dashboard`,
      type: 'account_onboarding'
    });

    console.log('Professional onboarded:', user._id, 'Stripe account:', stripeAccount.id);

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        stripeAccountId: stripeAccount.id,
        stripeOnboardingUrl: accountLink.url,
        message: 'Onboarding initiated successfully'
      }
    });

  } catch (error) {
    console.error('Professional onboarding error:', error);
    
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
 * GET /api/professionals/onboard?email=xxx
 * Check onboarding status for a professional
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email, role: 'professional' })
      .select('name email stripeAccountId sessionRateCents title company');

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
          title: user.title,
          company: user.company,
          sessionRate: user.sessionRateCents / 100
        },
        stripeAccountStatus,
        isFullyOnboarded: stripeAccountStatus?.chargesEnabled && stripeAccountStatus?.payoutsEnabled
      }
    });

  } catch (error) {
    console.error('Check onboarding status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}