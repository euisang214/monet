import { NextRequest } from 'next/server';
import { withAuthAndDB, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
import User from '@/lib/models/User';
import Session from '@/lib/models/Session';
import { Offer } from '@/lib/models/Feedback';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

const PLATFORM_FEE_RATE = 0.05;

interface CreateOfferRequest {
  candidateId: string;
  firmId: string;
  position: string;
  salaryCents?: number;
  equity?: string;
  reportedBy: string; // userId who is reporting this offer
}

interface AcceptOfferRequest {
  offerId: string;
  candidateId: string;
}

/**
 * POST /api/offers
 * Report a new job offer
 */
export const POST = withAuthAndDB(async (request: NextRequest, context: any, session: any) => {
  // Validate request body
  const validation = await validateRequestBody<CreateOfferRequest>(request, [
    'candidateId', 'firmId', 'position', 'reportedBy'
  ]);
  
  if (!validation.isValid) {
    return errorResponse(validation.error!, 400);
  }
  
  const { candidateId, firmId, position, salaryCents, equity, reportedBy } = validation.data!;

  // Validate users exist
  const [candidate, reporter] = await Promise.all([
    User.findById(candidateId),
    User.findById(reportedBy)
  ]);

  if (!candidate || candidate.role !== 'candidate') {
    return errorResponse('Invalid candidate', 400);
  }

  if (!reporter) {
    return errorResponse('Invalid reporter', 400);
  }

  // Find the first chat professional at this firm
  const firstChatSession = await Session.findOne({
    candidateId,
    firmId,
    status: { $in: ['confirmed', 'completed'] }
  }).sort({ createdAt: 1 });

  // Get candidate's offer bonus amount at time of first chat
  const bonusCents = candidate.offerBonusCents || 0;

  // Create offer record
  const offer = new Offer({
    candidateId,
    firmId,
    firstChatProId: firstChatSession?.professionalId,
    position,
    salaryCents,
    equity,
    status: 'pending',
    bonusCents,
    reportedBy
  });

  await offer.save();

  return successResponse({
    offerId: offer._id,
    message: 'Offer reported successfully',
    requiresConfirmation: reportedBy !== candidateId, // If reported by pro, needs candidate confirmation
    firstChatPro: firstChatSession?.professionalId,
    bonusCents
  });
});

/**
 * PUT /api/offers
 * Accept/confirm an offer and trigger bonus payout
 */
export const PUT = withAuthAndDB(async (request: NextRequest, context: any, session: any) => {
  // Validate request body
  const validation = await validateRequestBody<AcceptOfferRequest>(request, [
    'offerId', 'candidateId'
  ]);
  
  if (!validation.isValid) {
    return errorResponse(validation.error!, 400);
  }
  
  const { offerId, candidateId } = validation.data!;

  // Fetch offer
  const offer = await Offer.findById(offerId);
  if (!offer) {
    return errorResponse('Offer not found', 404);
  }

  if (offer.candidateId !== candidateId) {
    return errorResponse('Unauthorized - not your offer', 403);
  }

  if (offer.status !== 'pending') {
    return errorResponse('Offer is not pending', 400);
  }

  // Update offer status
  offer.status = 'accepted';
  offer.acceptedAt = new Date();
  offer.confirmedBy = candidateId;

  // Process bonus payout if there was a first chat professional
  if (offer.firstChatProId && offer.bonusCents > 0) {
    const firstChatPro = await User.findById(offer.firstChatProId);
    
    if (firstChatPro?.stripeAccountId) {
      try {
        // Calculate payout amount after platform fee
        const platformFee = Math.round(offer.bonusCents * PLATFORM_FEE_RATE);
        const professionalPayout = offer.bonusCents - platformFee;

        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: professionalPayout,
          currency: 'usd',
          destination: firstChatPro.stripeAccountId,
          metadata: {
            offerId: offer._id.toString(),
            candidateId,
            professionalId: offer.firstChatProId,
            firmId: offer.firmId,
            type: 'offer_bonus'
          }
        });

        // Update offer with payout details
        offer.stripeTransferId = transfer.id;
        offer.bonusPaidAt = new Date();

        console.log(`Offer bonus paid: $${professionalPayout / 100} to ${firstChatPro.name}`);
      } catch (stripeError) {
        console.error('Stripe transfer failed for offer bonus:', stripeError);
        // Continue with offer acceptance even if payout fails
        // This can be retried later
      }
    }
  }

  await offer.save();

  return successResponse({
    message: 'Offer accepted successfully',
    bonusPaid: offer.bonusPaidAt ? true : false,
    bonusAmount: offer.bonusCents,
    transferId: offer.stripeTransferId
  });
});

/**
 * GET /api/offers?candidateId=xxx or GET /api/offers?professionalId=xxx
 * Get offers for a candidate or professional
 */
export const GET = withAuthAndDB(async (request: NextRequest, context: any, session: any) => {
  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get('candidateId');
  const professionalId = searchParams.get('professionalId');

  if (!candidateId && !professionalId) {
    return errorResponse('Either candidateId or professionalId is required', 400);
  }

  let query: any = {};
  
  if (candidateId) {
    query.candidateId = candidateId;
  } else if (professionalId) {
    query.firstChatProId = professionalId;
  }

  const offers = await Offer.find(query)
    .populate('candidateId', 'name email')
    .populate('firstChatProId', 'name email company')
    .sort({ createdAt: -1 })
    .limit(50);

  return successResponse({
    offers,
    totalOffers: offers.length
  });
});