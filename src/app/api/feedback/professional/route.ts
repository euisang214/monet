import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Session from '@/lib/models/Session';
import { ProfessionalFeedback, ReferralEdge } from '@/lib/models/Feedback';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

// Platform fee percentage (e.g., 5% = 0.05)
const PLATFORM_FEE_RATE = 0.05;

interface SubmitFeedbackRequest {
  sessionId: string;
  professionalId: string;
  culturalFitRating: number;
  interestRating: number;
  technicalRating: number;
  feedback: string;
  internalNotes?: string;
}

/**
 * POST /api/feedback/professional
 * Submit professional feedback and trigger session fee + referral payouts
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: SubmitFeedbackRequest = await request.json();
    const {
      sessionId,
      professionalId,
      culturalFitRating,
      interestRating,
      technicalRating,
      feedback,
      internalNotes
    } = body;

    // Validate required fields
    if (!sessionId || !professionalId || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate ratings
    const ratings = [culturalFitRating, interestRating, technicalRating];
    if (ratings.some(r => !r || r < 1 || r > 5)) {
      return NextResponse.json(
        { error: 'All ratings must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (feedback.length < 20) {
      return NextResponse.json(
        { error: 'Feedback must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Fetch session and validate
    const session = await Session.findById(sessionId)
      .populate('candidate', 'name email offerBonusCents')
      .populate('professional', 'name email stripeAccountId');

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.professionalId !== professionalId) {
      return NextResponse.json(
        { error: 'Unauthorized - not your session' },
        { status: 403 }
      );
    }

    if (session.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Session must be confirmed to submit feedback' },
        { status: 400 }
      );
    }

    if (session.feedbackSubmittedAt) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this session' },
        { status: 409 }
      );
    }

    // Check if professional has Stripe account for payouts
    if (!session.professional.stripeAccountId) {
      return NextResponse.json(
        { error: 'Professional must complete Stripe onboarding before receiving payments' },
        { status: 400 }
      );
    }

    // Create feedback record
    const professionalFeedback = new ProfessionalFeedback({
      sessionId,
      professionalId,
      candidateId: session.candidateId,
      culturalFitRating,
      interestRating,
      technicalRating,
      feedback,
      internalNotes
    });

    await professionalFeedback.save();

    // Update session status
    session.status = 'completed';
    session.completedAt = new Date();
    session.feedbackSubmittedAt = new Date();

    // Calculate payouts
    const grossAmount = session.rateCents;
    const referralPayouts = await calculateReferralPayouts(session, grossAmount);
    const totalReferralAmount = referralPayouts.reduce((sum, p) => sum + p.bonusCents, 0);
    
    // Platform fee applied after referral bonuses
    const netAfterReferrals = grossAmount - totalReferralAmount;
    const platformFee = Math.round(netAfterReferrals * PLATFORM_FEE_RATE);
    const professionalPayout = netAfterReferrals - platformFee;

    const transferIds: string[] = [];

    try {
      // Create main session payout
      const mainTransfer = await stripe.transfers.create({
        amount: professionalPayout,
        currency: 'usd',
        destination: session.professional.stripeAccountId,
        metadata: {
          sessionId,
          type: 'session_fee',
          professionalId
        }
      });
      transferIds.push(mainTransfer.id);

      // Create referral payouts
      for (const referralPayout of referralPayouts) {
        const referrerUser = await User.findById(referralPayout.referrerProId);
        if (referrerUser?.stripeAccountId) {
          const referralTransfer = await stripe.transfers.create({
            amount: referralPayout.bonusCents,
            currency: 'usd',
            destination: referrerUser.stripeAccountId,
            metadata: {
              sessionId,
              type: 'referral_bonus',
              level: referralPayout.level.toString(),
              referrerProId: referralPayout.referrerProId
            }
          });
          
          // Update referral edge with transfer ID
          const referralEdge = new ReferralEdge({
            sessionId,
            referrerProId: referralPayout.referrerProId,
            level: referralPayout.level,
            bonusCents: referralPayout.bonusCents,
            stripeTransferId: referralTransfer.id,
            paidAt: new Date()
          });
          await referralEdge.save();
          
          transferIds.push(referralTransfer.id);
        }
      }

      // Update session with transfer IDs
      session.stripeTransferIds = transferIds;
      session.paidAt = new Date();
      await session.save();

      return NextResponse.json({
        success: true,
        data: {
          message: 'Feedback submitted successfully and payment processed',
          sessionPayout: professionalPayout,
          referralPayouts: referralPayouts.length,
          candidateOfferBonus: session.candidate.offerBonusCents || 0,
          transferIds
        }
      });

    } catch (stripeError) {
      console.error('Stripe transfer error:', stripeError);
      
      // Rollback feedback if payment failed
      await ProfessionalFeedback.findByIdAndDelete(professionalFeedback._id);
      
      return NextResponse.json(
        { error: 'Payment processing failed. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate referral payouts using the multi-level system
 * 10% for level 1, 1% for level 2, 0.1% for level 3, etc.
 */
async function calculateReferralPayouts(session: any, grossAmount: number) {
  const payouts = [];
  
  if (!session.referrerProId) {
    return payouts;
  }

  let currentReferrerId = session.referrerProId;
  let level = 1;

  // Walk up the referral chain (max 10 levels)
  while (currentReferrerId && level <= 10) {
    const bonusPercentage = 0.10 * Math.pow(0.10, level - 1); // 10%, 1%, 0.1%, etc.
    const bonusCents = Math.round(grossAmount * bonusPercentage);
    
    if (bonusCents > 0) {
      payouts.push({
        referrerProId: currentReferrerId,
        level,
        bonusCents
      });
    }

    // Get the next referrer in the chain
    const referrer = await User.findById(currentReferrerId).select('referredBy');
    currentReferrerId = referrer?.referredBy;
    level++;
  }

  return payouts;
}