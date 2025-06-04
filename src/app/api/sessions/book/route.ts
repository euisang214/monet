import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Session from '@/lib/models/Session';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
});

interface BookSessionRequest {
  candidateId: string;
  professionalId: string;
  scheduledAt: string; // ISO date string
  durationMinutes?: number;
  requestMessage?: string;
  referrerProId?: string; // For referral tracking
}

/**
 * POST /api/sessions/book
 * Books a session and creates Stripe PaymentIntent
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: BookSessionRequest = await request.json();
    const {
      candidateId,
      professionalId,
      scheduledAt,
      durationMinutes = 30,
      requestMessage,
      referrerProId
    } = body;

    // Validate required fields
    if (!candidateId || !professionalId || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateId, professionalId, scheduledAt' },
        { status: 400 }
      );
    }

    // Fetch candidate and professional
    const [candidate, professional] = await Promise.all([
      User.findById(candidateId),
      User.findById(professionalId)
    ]);

    if (!candidate || candidate.role !== 'candidate') {
      return NextResponse.json(
        { error: 'Invalid candidate' },
        { status: 400 }
      );
    }

    if (!professional || professional.role !== 'professional') {
      return NextResponse.json(
        { error: 'Invalid professional' },
        { status: 400 }
      );
    }

    if (!professional.sessionRateCents || professional.sessionRateCents <= 0) {
      return NextResponse.json(
        { error: 'Professional has not set a session rate' },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Check for conflicting sessions (basic validation)
    const conflictingSession = await Session.findOne({
      $or: [
        { candidateId, scheduledAt: scheduledDate, status: { $in: ['requested', 'confirmed'] } },
        { professionalId, scheduledAt: scheduledDate, status: { $in: ['requested', 'confirmed'] } }
      ]
    });

    if (conflictingSession) {
      return NextResponse.json(
        { error: 'Time slot conflicts with existing session' },
        { status: 409 }
      );
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
    const session = new Session({
      candidateId,
      professionalId,
      scheduledAt: scheduledDate,
      durationMinutes,
      rateCents: professional.sessionRateCents,
      status: 'requested',
      requestMessage,
      referrerProId,
      isFirstChatAtFirm,
      firmId
    });

    await session.save();

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: professional.sessionRateCents,
      currency: 'usd',
      metadata: {
        sessionId: session._id.toString(),
        candidateId,
        professionalId,
        type: 'session_fee'
      },
      description: `Session with ${professional.name} - ${new Date(scheduledAt).toLocaleDateString()}`
    });

    // Update session with payment intent
    session.stripePaymentIntentId = paymentIntent.id;
    await session.save();

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session._id,
        paymentIntentClientSecret: paymentIntent.client_secret,
        professional: {
          name: professional.name,
          title: professional.title,
          company: professional.company
        },
        scheduledAt: session.scheduledAt,
        rateCents: session.rateCents
      }
    });

  } catch (error) {
    console.error('Session booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/book?candidateId=xxx&professionalId=xxx
 * Get booking availability and professional details
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const professionalId = searchParams.get('professionalId');

    if (!candidateId || !professionalId) {
      return NextResponse.json(
        { error: 'candidateId and professionalId are required' },
        { status: 400 }
      );
    }

    // Fetch professional details
    const professional = await User.findById(professionalId).select(
      'name title company sessionRateCents bio expertise yearsExperience industry'
    );

    if (!professional || professional.role !== 'professional') {
      return NextResponse.json(
        { error: 'Professional not found' },
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
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
      }
    });

  } catch (error) {
    console.error('Booking details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}