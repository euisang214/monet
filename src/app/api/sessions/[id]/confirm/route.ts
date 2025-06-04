import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Session from '@/lib/models/Session';
import User from '@/lib/models/User';

interface ConfirmSessionRequest {
  professionalId: string;
  action: 'accept' | 'decline';
  declineReason?: string;
  alternativeSlots?: string[]; // ISO date strings for alternative times
}

/**
 * POST /api/sessions/[id]/confirm
 * Professional accepts or declines a session request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const sessionId = params.id;
    const body: ConfirmSessionRequest = await request.json();
    const { professionalId, action, declineReason, alternativeSlots } = body;

    if (!professionalId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: professionalId, action' },
        { status: 400 }
      );
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "accept" or "decline"' },
        { status: 400 }
      );
    }

    // Fetch session
    const session = await Session.findById(sessionId)
      .populate('candidate', 'name email')
      .populate('professional', 'name email');

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

    if (session.status !== 'requested') {
      return NextResponse.json(
        { error: 'Session is not in requested status' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Check if professional has completed Stripe onboarding
      const professional = await User.findById(professionalId);
      if (!professional?.stripeAccountId) {
        return NextResponse.json(
          { error: 'Please complete Stripe onboarding before accepting sessions' },
          { status: 400 }
        );
      }

      // Update session status to confirmed
      session.status = 'confirmed';
      
      // TODO: Create Zoom meeting
      // session.zoomJoinUrl = await createZoomMeeting(session);
      // session.zoomMeetingId = 'zoom-meeting-id';
      
      // TODO: Create Google Calendar events
      // session.googleCalendarEventId = await createCalendarEvent(session);

      await session.save();

      // TODO: Send confirmation emails
      console.log(`Session ${sessionId} accepted by professional ${professionalId}`);

      return NextResponse.json({
        success: true,
        data: {
          message: 'Session confirmed successfully',
          session: {
            id: session._id,
            status: session.status,
            scheduledAt: session.scheduledAt,
            zoomJoinUrl: session.zoomJoinUrl
          }
        }
      });

    } else if (action === 'decline') {
      // Update session status to cancelled
      session.status = 'cancelled';
      session.cancelReason = declineReason || 'Declined by professional';
      await session.save();

      // TODO: Refund the candidate's payment via Stripe
      // if (session.stripePaymentIntentId) {
      //   await stripe.refunds.create({
      //     payment_intent: session.stripePaymentIntentId,
      //     reason: 'requested_by_customer'
      //   });
      // }

      // TODO: Send decline notification with alternative slots
      console.log(`Session ${sessionId} declined by professional ${professionalId}`);

      return NextResponse.json({
        success: true,
        data: {
          message: 'Session declined',
          alternativeSlots: alternativeSlots || [],
          declineReason
        }
      });
    }

  } catch (error) {
    console.error('Session confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[id]/confirm
 * Get session details for confirmation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const sessionId = params.id;
    const { searchParams } = new URL(request.url);
    const professionalId = searchParams.get('professionalId');

    if (!professionalId) {
      return NextResponse.json(
        { error: 'professionalId query parameter is required' },
        { status: 400 }
      );
    }

    const session = await Session.findById(sessionId)
      .populate('candidate', 'name email targetRole targetIndustry resumeUrl')
      .populate('professional', 'name email');

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

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session._id,
          scheduledAt: session.scheduledAt,
          durationMinutes: session.durationMinutes,
          rateCents: session.rateCents,
          status: session.status,
          requestMessage: session.requestMessage,
          candidate: session.candidate,
          createdAt: session.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Session details fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}