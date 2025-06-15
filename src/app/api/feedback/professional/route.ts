import { NextRequest } from 'next/server';
import { withAuthAndDB, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
import type { Session as AuthSession } from 'next-auth';
import User from '@/lib/models/User';
import Session, { ISession } from '@/lib/models/Session';
import { ProfessionalFeedback, ReferralEdge } from '@/lib/models/Feedback';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

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
export const POST = withAuthAndDB(async (request: NextRequest, context: unknown, session: AuthSession) => {
  // Validate request body
  const validation = await validateRequestBody<SubmitFeedbackRequest>(request, [
    'sessionId', 'professionalId', 'culturalFitRating', 'interestRating',
    'technicalRating', 'feedback'
  ]);
  
  if (!validation.isValid) {
    return errorResponse(validation.error!, 400);
  }
  
  const {
    sessionId,
    professionalId,
    culturalFitRating,
    interestRating,
    technicalRating,
    feedback,
    internalNotes
  } = validation.data!;

  const stripe = getStripe();

  // Validate ratings
  const ratings = [culturalFitRating, interestRating, technicalRating];
  if (ratings.some(r => r < 1 || r > 5)) {
    return errorResponse('All ratings must be between 1 and 5', 400);
  }

  if (feedback.length < 20) {
    return errorResponse('Feedback must be at least 20 characters', 400);
  }

  // Verify professionalId matches session user
  if (professionalId !== session.user.id) {
    return errorResponse('Unauthorized - not your session', 403);
  }

  // Fetch session and validate
  const sessionRecord = await Session.findById(sessionId)
    .populate('candidate', 'name email offerBonusCents')
    .populate('professional', 'name email stripeAccountId');

  if (!sessionRecord) {
    return errorResponse('Session not found', 404);
  }

  if (sessionRecord.professionalId !== professionalId) {
    return errorResponse('Unauthorized - not your session', 403);
  }

  if (sessionRecord.status !== 'confirmed') {
    return errorResponse('Session must be confirmed to submit feedback', 400);
  }

  if (sessionRecord.feedbackSubmittedAt) {
    return errorResponse('Feedback already submitted for this session', 409);
  }

  // Check if professional has Stripe account for payouts
  if (!sessionRecord.professional.stripeAccountId) {
    return errorResponse('Professional must complete Stripe onboarding before receiving payments', 400);
  }

  // Create feedback record
  const professionalFeedback = new ProfessionalFeedback({
    sessionId,
    professionalId,
    candidateId: sessionRecord.candidateId,
    culturalFitRating,
    interestRating,
    technicalRating,
    feedback,
    internalNotes
  });

  await professionalFeedback.save();

  // Update session status
  sessionRecord.status = 'completed';
  sessionRecord.completedAt = new Date();
  sessionRecord.feedbackSubmittedAt = new Date();

  // Calculate payouts
  const grossAmount = sessionRecord.rateCents;
  const referralPayouts = await calculateReferralPayouts(sessionRecord, grossAmount);
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
      destination: sessionRecord.professional.stripeAccountId,
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
    sessionRecord.stripeTransferIds = transferIds;
    sessionRecord.paidAt = new Date();
    await sessionRecord.save();

    return successResponse({
      message: 'Feedback submitted successfully and payment processed',
      sessionPayout: professionalPayout,
      referralPayouts: referralPayouts.length,
      candidateOfferBonus: sessionRecord.candidate.offerBonusCents || 0,
      transferIds
    });

  } catch (stripeError) {
    console.error('Stripe transfer error:', stripeError);
    
    // Rollback feedback if payment failed
    await ProfessionalFeedback.findByIdAndDelete(professionalFeedback._id);
    
    return errorResponse('Payment processing failed. Please try again.', 500);
  }

}, { requireRole: 'professional' });

/**
 * Calculate referral payouts using the multi-level system
 * 10% for level 1, 1% for level 2, 0.1% for level 3, etc.
 */
interface ReferralPayout {
  referrerProId: string;
  level: number;
  bonusCents: number;
}

async function calculateReferralPayouts(sessionRecord: ISession, grossAmount: number) {
  const payouts: ReferralPayout[] = [];
  
  if (!sessionRecord.referrerProId) {
    return payouts;
  }

  let currentReferrerId = sessionRecord.referrerProId;
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