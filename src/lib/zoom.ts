/**
 * Zoom SDK integration for creating and managing video meetings
 */

interface ZoomMeetingRequest {
  topic: string;
  start_time: string; // ISO 8601 format
  duration: number; // in minutes
  timezone: string;
  agenda?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    waiting_room?: boolean;
    auto_recording?: string;
  };
}

interface ZoomMeetingResponse {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  join_url: string;
  password?: string;
  start_url: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    join_before_host: boolean;
    mute_upon_entry: boolean;
    waiting_room: boolean;
    auto_recording: string;
  };
}

import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for Zoom API authentication
 */
function generateZoomJWT(): string {
  const payload = {
    iss: process.env.ZOOM_API_KEY!,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2), // 2 hours from now
  };

  if (!process.env.ZOOM_API_SECRET) {
    throw new Error('ZOOM_API_SECRET environment variable is required');
  }

  return jwt.sign(payload, process.env.ZOOM_API_SECRET, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT'
    }
  });
}

/**
 * Create a Zoom meeting for a professional session
 */
export async function createZoomMeeting(
  professionalName: string,
  candidateName: string,
  scheduledAt: Date,
  duration: number = 30
): Promise<ZoomMeetingResponse> {
  const jwt = generateZoomJWT();
  
  const meetingData: ZoomMeetingRequest = {
    topic: `Monet Session: ${candidateName} & ${professionalName}`,
    start_time: scheduledAt.toISOString(),
    duration,
    timezone: 'UTC',
    agenda: `Professional mentoring session between ${candidateName} and ${professionalName} via Monet platform.`,
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      waiting_room: true,
      auto_recording: 'cloud' // Auto-record to cloud for quality assurance
    }
  };

  try {
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Zoom API error:', error);
      throw new Error(`Failed to create Zoom meeting: ${error.message || response.statusText}`);
    }

    const meeting: ZoomMeetingResponse = await response.json();
    
    console.log('Zoom meeting created:', {
      id: meeting.id,
      topic: meeting.topic,
      start_time: meeting.start_time,
      join_url: meeting.join_url
    });

    return meeting;
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    throw error;
  }
}

/**
 * Update an existing Zoom meeting
 */
export async function updateZoomMeeting(
  meetingId: string,
  updates: Partial<ZoomMeetingRequest>
): Promise<void> {
  const jwt = generateZoomJWT();

  try {
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update Zoom meeting: ${error.message || response.statusText}`);
    }

    console.log('Zoom meeting updated:', meetingId);
  } catch (error) {
    console.error('Error updating Zoom meeting:', error);
    throw error;
  }
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  const jwt = generateZoomJWT();

  try {
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to delete Zoom meeting: ${error.message || response.statusText}`);
    }

    console.log('Zoom meeting deleted:', meetingId);
  } catch (error) {
    console.error('Error deleting Zoom meeting:', error);
    throw error;
  }
}

/**
 * Get meeting details
 */
export async function getZoomMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
  const jwt = generateZoomJWT();

  try {
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get Zoom meeting: ${error.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Zoom meeting:', error);
    throw error;
  }
}