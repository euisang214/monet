import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/models/db';
import Session from '@/lib/models/Session';

/**
 * POST /api/webhooks/zoom
 * Handle Zoom webhook events for meeting status updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    
    // Verify Zoom webhook signature
    const zoomSignature = headersList.get('authorization');
    const expectedSignature = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
    
    if (!zoomSignature || !expectedSignature) {
      console.error('Missing Zoom webhook signature or secret');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Simple signature verification (in production, use proper HMAC verification)
    if (zoomSignature !== expectedSignature) {
      console.error('Invalid Zoom webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    
    await connectDB();
    
    console.log('Processing Zoom webhook event:', event.event);

    switch (event.event) {
      case 'meeting.started':
        await handleMeetingStarted(event.payload);
        break;
        
      case 'meeting.ended':
        await handleMeetingEnded(event.payload);
        break;
        
      case 'meeting.participant_joined':
        await handleParticipantJoined(event.payload);
        break;
        
      case 'meeting.participant_left':
        await handleParticipantLeft(event.payload);
        break;
        
      case 'recording.completed':
        await handleRecordingCompleted(event.payload);
        break;
        
      default:
        console.log(`Unhandled Zoom event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Zoom webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle meeting started event
 */
async function handleMeetingStarted(payload: Record<string, unknown>) {
  const meetingId = payload.object.id;
  
  try {
    const session = await Session.findOne({ zoomMeetingId: meetingId });
    if (!session) {
      console.log('No session found for Zoom meeting:', meetingId);
      return;
    }

    console.log('Meeting started for session:', session._id);
    
    // TODO: Send notifications to both parties
    // TODO: Start any session-specific tracking
    
  } catch (error) {
    console.error('Error handling meeting started:', error);
  }
}

/**
 * Handle meeting ended event
 */
async function handleMeetingEnded(payload: Record<string, unknown>) {
  const meetingId = payload.object.id;
  const duration = payload.object.duration; // in minutes
  
  try {
    const session = await Session.findOne({ zoomMeetingId: meetingId });
    if (!session) {
      console.log('No session found for Zoom meeting:', meetingId);
      return;
    }

    console.log('Meeting ended for session:', session._id, 'Duration:', duration, 'minutes');
    
    // Update session status if it's not already completed
    if (session.status === 'confirmed') {
      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();
      
      console.log('Session marked as completed:', session._id);
    }
    
    // TODO: Trigger notification for professional to submit feedback
    // TODO: Send thank you email to candidate
    
  } catch (error) {
    console.error('Error handling meeting ended:', error);
  }
}

/**
 * Handle participant joined event
 */
async function handleParticipantJoined(payload: Record<string, unknown>) {
  const meetingId = payload.object.id;
  const participantName = payload.object.participant.user_name;
  
  console.log('Participant joined:', participantName, 'in meeting:', meetingId);
  
  // TODO: Track attendance for quality metrics
  // TODO: Send real-time notifications
}

/**
 * Handle participant left event
 */
async function handleParticipantLeft(payload: Record<string, unknown>) {
  const meetingId = payload.object.id;
  const participantName = payload.object.participant.user_name;
  
  console.log('Participant left:', participantName, 'from meeting:', meetingId);
  
  // TODO: Track attendance patterns
}

/**
 * Handle recording completed event
 */
async function handleRecordingCompleted(payload: Record<string, unknown>) {
  const meetingId = payload.object.id;
  const recordingFiles = payload.object.recording_files;
  
  try {
    const session = await Session.findOne({ zoomMeetingId: meetingId });
    if (!session) {
      console.log('No session found for Zoom meeting:', meetingId);
      return;
    }

    console.log('Recording completed for session:', session._id);
    
    // Find video recording URL
    const videoRecording = recordingFiles.find((file: Record<string, unknown>) =>
      file.file_type === 'MP4' && file.recording_type === 'shared_screen_with_speaker_view'
    );
    
    if (videoRecording) {
      // TODO: Store recording URL in session for quality assurance
      // TODO: Set up automatic deletion after retention period
      console.log('Video recording available:', videoRecording.download_url);
    }
    
  } catch (error) {
    console.error('Error handling recording completed:', error);
  }
}

/**
 * GET /api/webhooks/zoom
 * Zoom webhook verification endpoint
 */
export async function GET() {
  // Zoom sends a verification request when setting up webhooks
  return NextResponse.json({ 
    message: 'Zoom webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}