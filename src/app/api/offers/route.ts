import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
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
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: CreateOfferRequest = await request.json();
    const { candidateId, firmId, position, salaryCents, equity, reportedBy } = body;

    // Validate required fields
    if (!candidateId || !firmId || !position || !reportedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateId, firmId, position, reportedBy' },
        { status: 400 }
      );
    }

    // Validate users exist
    const [candidate, reporter] = await Promise.all([
      User.findById(candidateId),
      User.findById(reportedBy)
    ]);

    if (!candidate || candidate.role !== 'candidate') {
      return NextResponse.json(
        { error: 'Invalid candidate' },
        { status: 400 }
      );
    }

    if (!reporter) {
      return NextResponse.json(
        { error: 'Invalid reporter' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        offerId: offer._id,
        message: 'Offer reported successfully',
        requiresConfirmation: reportedBy !== candidateId, // If reported by pro, needs candidate confirmation
        firstChatPro: firstChatSession?.professionalId,
        bonusCents
      }
    });

  } catch (error) {
    console.error('Create offer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/offers
 * Accept/confirm an offer and trigger bonus payout
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body: AcceptOfferRequest = await request.json();
    const { offerId, candidateId } = body;

    if (!offerId || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required fields: offerId, candidateId' },
        { status: 400 }
      );
    }

    // Fetch offer
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    if (offer.candidateId !== candidateId) {
      return NextResponse.json(
        { error: 'Unauthorized - not your offer' },
        { status: 403 }
      );
    }

    if (offer.status !== 'pending') {
      return NextResponse.json(
        { error: 'Offer is not pending' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        message: 'Offer accepted successfully',
        bonusPaid: offer.bonusPaidAt ? true : false,
        bonusAmount: offer.bonusCents,
        transferId: offer.stripeTransferId
      }
    });

  } catch (error) {
    console.error('Accept offer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/offers?candidateId=xxx or GET /api/offers?professionalId=xxx
 * Get offers for a candidate or professional
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const professionalId = searchParams.get('professionalId');

    if (!candidateId && !professionalId) {
      return NextResponse.json(
        { error: 'Either candidateId or professionalId is required' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        offers,
        totalOffers: offers.length
      }
    });

  } catch (error) {
    console.error('Get offers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}