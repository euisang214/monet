import { NextRequest } from 'next/server';
import { withAuthAndDB, withDB, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
import type { Session as AuthSession } from 'next-auth';
import User from '@/lib/models/User';
import Session from '@/lib/models/Session';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

interface BookSessionRequest {
  candidateId: string;
  professionalId: string;
  scheduledAt?: string; // ISO date string
  candidateAvailability?: Array<{ start: string; end: string }>;
  durationMinutes?: number;
  requestMessage?: string;
  referrerProId?: string; // For referral tracking
}

/**
 * POST /api/sessions/book
 * Books a session and creates Stripe PaymentIntent
 */
export const POST = withAuthAndDB(async (request: NextRequest, context: unknown, session: AuthSession) => {
  // Validate request body
  const validation = await validateRequestBody<BookSessionRequest>(request, [
    'candidateId', 'professionalId'
  ]);
  
  if (!validation.isValid) {
    return errorResponse(validation.error!, 400);
  }
  
  const {
    candidateId,
    professionalId,
    scheduledAt,
    candidateAvailability = [],
    durationMinutes = 30,
    requestMessage,
    referrerProId
  } = validation.data!;

  // Verify candidateId matches session user
  if (candidateId !== session.user.id) {
    return errorResponse('Unauthorized - not your session', 403);
  }

  // Fetch candidate and professional
  const [candidate, professional] = await Promise.all([
    User.findById(candidateId),
    User.findById(professionalId)
  ]);

  if (!candidate || candidate.role !== 'candidate') {
    return errorResponse('Invalid candidate', 400);
  }

  if (!professional || professional.role !== 'professional') {
    return errorResponse('Invalid professional', 400);
  }

  if (!professional.sessionRateCents || professional.sessionRateCents <= 0) {
    return errorResponse('Professional has not set a session rate', 400);
  }

  let scheduledDate: Date | undefined;
  if (scheduledAt) {
    scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return errorResponse('Scheduled time must be in the future', 400);
    }

    const conflictingSession = await Session.findOne({
      $or: [
        { candidateId, scheduledAt: scheduledDate, status: { $in: ['requested', 'confirmed'] } },
        { professionalId, scheduledAt: scheduledDate, status: { $in: ['requested', 'confirmed'] } }
      ]
    });

    if (conflictingSession) {
      return errorResponse('Time slot conflicts with existing session', 409);
    }
  } else if (!candidateAvailability.length) {
    return errorResponse('Either scheduledAt or candidateAvailability is required', 400);
  }

  // Determine if this is first chat at firm (for offer bonus tracking)
  const firmId = professional.company || 'unknown';
  const existingChatAtFirm = await Session.findOne({
    candidateId,
    firmId,
    status: { $in: ['confirmed', 'completed'] }
  });
  const isFirstChatAtFirm = !existingChatAtFirm;

  // Create session
  const sessionRecord = new Session({
    candidateId,
    professionalId,
    ...(scheduledDate && { scheduledAt: scheduledDate }),
    candidateAvailability: candidateAvailability.map(slot => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
    })),
    durationMinutes,
    rateCents: professional.sessionRateCents,
    status: 'requested',
    requestMessage,
    referrerProId,
    isFirstChatAtFirm,
    firmId
  });

  await sessionRecord.save();

  // Create Stripe PaymentIntent
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: professional.sessionRateCents,
    currency: 'usd',
    metadata: {
      sessionId: sessionRecord._id.toString(),
      candidateId,
      professionalId,
      type: 'session_fee'
    },
    description: `Session with ${professional.name}`
  });

  // Update session with payment intent
  sessionRecord.stripePaymentIntentId = paymentIntent.id;
  await sessionRecord.save();

  return successResponse({
    sessionId: sessionRecord._id,
    paymentIntentClientSecret: paymentIntent.client_secret,
    professional: {
      name: professional.name,
      title: professional.title,
      company: professional.company
    },
    scheduledAt: sessionRecord.scheduledAt,
    rateCents: sessionRecord.rateCents
  });

}, { requireRole: 'candidate' });

/**
 * GET /api/sessions/book?candidateId=xxx&professionalId=xxx
 * Get booking availability and professional details
 */
export const GET = withDB(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get('candidateId');
  const professionalId = searchParams.get('professionalId');

  if (!candidateId || !professionalId) {
    return errorResponse('candidateId and professionalId are required', 400);
  }

  // Fetch professional details
  const professional = await User.findById(professionalId).select(
    'name title company sessionRateCents bio expertise yearsExperience industry'
  );

  if (!professional || professional.role !== 'professional') {
    return errorResponse('Professional not found', 404);
  }

  // Get professional's upcoming sessions to show availability conflicts
  const upcomingSessions = await Session.find({
    professionalId,
    scheduledAt: { $gte: new Date() },
    status: { $in: ['requested', 'confirmed'] }
  }).select('scheduledAt durationMinutes');

  // Calculate busy slots (simplified - in production you'd integrate with calendar)
  const busySlots = upcomingSessions.map(session => ({
    start: session.scheduledAt,
    end: new Date(session.scheduledAt.getTime() + session.durationMinutes * 60000)
  }));

  return successResponse({
    professional: {
      id: professional._id,
      name: professional.name,
      title: professional.title,
      company: professional.company,
      sessionRateCents: professional.sessionRateCents,
      bio: professional.bio,
      expertise: professional.expertise,
      yearsExperience: professional.yearsExperience,
      industry: professional.industry
    },
    busySlots
  });
});