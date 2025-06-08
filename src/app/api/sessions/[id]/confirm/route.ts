import { NextRequest } from 'next/server';
import { withAuthAndDB, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
import Session from '@/lib/models/Session';
import User from '@/lib/models/User';
import { createZoomMeeting, deleteZoomMeeting } from '@/lib/zoom';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/calendar';

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

  // Fetch session with populated user data
  const sessionRecord = await Session.findById(sessionId)
    .populate('candidate', 'name email')
    .populate('professional', 'name email company googleCalendarToken');

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

    try {
      // Create Zoom meeting first
      let zoomMeeting;
      try {
        zoomMeeting = await createZoomMeeting(
          sessionRecord.professional.name,
          sessionRecord.candidate.name,
          sessionRecord.scheduledAt,
          sessionRecord.durationMinutes
        );
        
        console.log('Zoom meeting created successfully:', zoomMeeting.id);
      } catch (zoomError) {
        console.error('Failed to create Zoom meeting:', zoomError);
        return errorResponse('Failed to create video meeting. Please try again.', 500);
      }

      // Update session with Zoom details
      sessionRecord.status = 'confirmed';
      sessionRecord.zoomJoinUrl = zoomMeeting.join_url;
      sessionRecord.zoomMeetingId = zoomMeeting.id;

      // Create Google Calendar events for both users
      let calendarEventId;
      try {
        // Create calendar event for the professional (session creator)
        if (sessionRecord.professional.googleCalendarToken) {
          const calendarEvent = await createCalendarEvent(
            sessionRecord.professional.googleCalendarToken,
            sessionRecord.professional.email,
            sessionRecord.professional.name,
            sessionRecord.professional.company || 'Professional Services',
            sessionRecord.candidate.email,
            sessionRecord.candidate.name,
            sessionRecord.scheduledAt,
            sessionRecord.durationMinutes,
            zoomMeeting.join_url,
            zoomMeeting.id
          );
          
          calendarEventId = calendarEvent.id;
          console.log('Google Calendar event created:', calendarEventId);
        } else {
          console.warn('Professional does not have Google Calendar token - skipping calendar creation');
        }
      } catch (calendarError) {
        console.error('Failed to create calendar event:', calendarError);
        
        // If calendar creation fails, we should still proceed with the session
        // but log the error for manual follow-up
        console.warn('Session confirmed but calendar event creation failed - manual calendar invite may be needed');
        
        // Don't fail the entire request for calendar issues
        if (calendarError instanceof Error && calendarError.message === 'CALENDAR_TOKEN_EXPIRED') {
          console.log('Google Calendar token expired for professional - they will need to reconnect');
        }
      }

      // Save session with meeting details
      if (calendarEventId) {
        sessionRecord.googleCalendarEventId = calendarEventId;
      }
      
      await sessionRecord.save();

      console.log(`Session ${sessionId} confirmed successfully by professional ${professionalId}`);
      
      // TODO: Send confirmation emails to both parties
      // await sendSessionConfirmationEmail(sessionRecord);

      return successResponse({
        message: 'Session confirmed successfully',
        session: {
          id: sessionRecord._id,
          status: sessionRecord.status,
          scheduledAt: sessionRecord.scheduledAt,
          zoomJoinUrl: sessionRecord.zoomJoinUrl,
          zoomMeetingId: sessionRecord.zoomMeetingId,
          googleCalendarEventId: sessionRecord.googleCalendarEventId
        },
        zoomMeeting: {
          id: zoomMeeting.id,
          joinUrl: zoomMeeting.join_url,
          startUrl: zoomMeeting.start_url
        }
      });

    } catch (error) {
      console.error('Error confirming session:', error);
      
      // Cleanup: If we created a Zoom meeting but something else failed, clean it up
      if (sessionRecord.zoomMeetingId) {
        try {
          await deleteZoomMeeting(sessionRecord.zoomMeetingId);
          console.log('Cleaned up Zoom meeting after error');
        } catch (cleanupError) {
          console.error('Failed to cleanup Zoom meeting:', cleanupError);
        }
      }
      
      return errorResponse('Failed to confirm session. Please try again.', 500);
    }

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

    console.log(`Session ${sessionId} declined by professional ${professionalId}`);
    
    // TODO: Send decline notification with alternative slots
    // await sendSessionDeclineEmail(sessionRecord, alternativeSlots);

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