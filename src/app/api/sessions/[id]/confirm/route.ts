import { NextRequest } from 'next/server';
import { withAuthAndDB, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
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
export const POST = withAuthAndDB(async (request: NextRequest, { params }: { params: { id: string } }, session: any) => {
  const sessionId = params.id;
  
  // Validate request body
  const validation = await validateRequestBody<ConfirmSessionRequest>(request, [
    'professionalId', 'action'
  ]);
  
  if (!validation.isValid) {
    return errorResponse(validation.error!, 400);
  }
  
  const { professionalId, action, declineReason, alternativeSlots } = validation.data!;

  if (!['accept', 'decline'].includes(action)) {
    return errorResponse('Action must be either "accept" or "decline"', 400);
  }

  // Verify the professionalId matches session user
  if (professionalId !== session.user.id) {
    return errorResponse('Unauthorized - not your session', 403);
  }

  // Fetch session
  const sessionRecord = await Session.findById(sessionId)
    .populate('candidate', 'name email')
    .populate('professional', 'name email');

  if (!sessionRecord) {
    return errorResponse('Session not found', 404);
  }

  if (sessionRecord.professionalId !== professionalId) {
    return errorResponse('Unauthorized - not your session', 403);
  }

  if (sessionRecord.status !== 'requested') {
    return errorResponse('Session is not in requested status', 400);
  }

  if (action === 'accept') {
    // Check if professional has completed Stripe onboarding
    const professional = await User.findById(professionalId);
    if (!professional?.stripeAccountId) {
      return errorResponse('Please complete Stripe onboarding before accepting sessions', 400);
    }

    // Update session status to confirmed
    sessionRecord.status = 'confirmed';
    
    // TODO: Create Zoom meeting
    // sessionRecord.zoomJoinUrl = await createZoomMeeting(sessionRecord);
    // sessionRecord.zoomMeetingId = 'zoom-meeting-id';
    
    // TODO: Create Google Calendar events
    // sessionRecord.googleCalendarEventId = await createCalendarEvent(sessionRecord);

    await sessionRecord.save();

    // TODO: Send confirmation emails
    console.log(`Session ${sessionId} accepted by professional ${professionalId}`);

    return successResponse({
      message: 'Session confirmed successfully',
      session: {
        id: sessionRecord._id,
        status: sessionRecord.status,
        scheduledAt: sessionRecord.scheduledAt,
        zoomJoinUrl: sessionRecord.zoomJoinUrl
      }
    });

  } else if (action === 'decline') {
    // Update session status to cancelled
    sessionRecord.status = 'cancelled';
    sessionRecord.cancelReason = declineReason || 'Declined by professional';
    await sessionRecord.save();

    // TODO: Refund the candidate's payment via Stripe
    // if (sessionRecord.stripePaymentIntentId) {
    //   await stripe.refunds.create({
    //     payment_intent: sessionRecord.stripePaymentIntentId,
    //     reason: 'requested_by_customer'
    //   });
    // }

    // TODO: Send decline notification with alternative slots
    console.log(`Session ${sessionId} declined by professional ${professionalId}`);

    return successResponse({
      message: 'Session declined',
      alternativeSlots: alternativeSlots || [],
      declineReason
    });
  }

}, { requireRole: 'professional' });

/**
 * GET /api/sessions/[id]/confirm
 * Get session details for confirmation
 */
export const GET = withAuthAndDB(async (request: NextRequest, { params }: { params: { id: string } }, session: any) => {
  const sessionId = params.id;
  const { searchParams } = new URL(request.url);
  const professionalId = searchParams.get('professionalId');

  if (!professionalId) {
    return errorResponse('professionalId query parameter is required', 400);
  }

  if (professionalId !== session.user.id) {
    return errorResponse('Unauthorized - not your session', 403);
  }

  const sessionRecord = await Session.findById(sessionId)
    .populate('candidate', 'name email targetRole targetIndustry resumeUrl')
    .populate('professional', 'name email');

  if (!sessionRecord) {
    return errorResponse('Session not found', 404);
  }

  if (sessionRecord.professionalId !== professionalId) {
    return errorResponse('Unauthorized - not your session', 403);
  }

  return successResponse({
    session: {
      id: sessionRecord._id,
      scheduledAt: sessionRecord.scheduledAt,
      durationMinutes: sessionRecord.durationMinutes,
      rateCents: sessionRecord.rateCents,
      status: sessionRecord.status,
      requestMessage: sessionRecord.requestMessage,
      candidate: sessionRecord.candidate,
      createdAt: sessionRecord.createdAt
    }
  });

}, { requireRole: 'professional' });