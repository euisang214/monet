/**
 * Google Calendar API integration for creating and managing session events
 */

interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
  reminders: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  visibility?: 'default' | 'public' | 'private';
  guestsCanModify?: boolean;
  guestsCanInviteOthers?: boolean;
  guestsCanSeeOtherGuests?: boolean;
}

interface CalendarEventResponse {
  id: string;
  htmlLink: string;
  hangoutLink?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus: string;
  }>;
}


/**
 * Create a calendar event for a professional session
 */
export async function createCalendarEvent(
  accessToken: string,
  professionalEmail: string,
  professionalName: string,
  professionalCompany: string,
  candidateEmail: string,
  candidateName: string,
  scheduledAt: Date,
  duration: number = 30,
  zoomJoinUrl?: string,
  zoomMeetingId?: string
): Promise<CalendarEventResponse> {
  const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);
  
  // Build description with session details
  let description = `Professional mentoring session via Monet platform.

👥 Participants:
• ${candidateName} (Candidate)
• ${professionalName} (${professionalCompany})

⏰ Duration: ${duration} minutes

🎯 Session Goals:
• Career advice and industry insights
• Interview preparation
• Networking and professional development`;

  if (zoomJoinUrl) {
    description += `

📹 Join Video Call:
${zoomJoinUrl}`;
    
    if (zoomMeetingId) {
      description += `
Meeting ID: ${zoomMeetingId}`;
    }
  }

  description += `

📋 Next Steps:
• Join the meeting on time
• Professional will provide written feedback after the session
• Rate your experience to help improve the platform

💡 Monet Platform: Connecting talent with opportunity through meaningful conversations.`;

  const event: CalendarEvent = {
    summary: `Monet Session: ${candidateName} & ${professionalName} (${professionalCompany})`,
    description,
    start: {
      dateTime: scheduledAt.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC',
    },
    attendees: [
      {
        email: candidateEmail,
        displayName: candidateName,
        responseStatus: 'needsAction',
      },
      {
        email: professionalEmail,
        displayName: `${professionalName} (${professionalCompany})`,
        responseStatus: 'accepted', // Professional already confirmed
      },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'email', minutes: 60 },      // 1 hour before
        { method: 'popup', minutes: 15 },      // 15 minutes before
      ],
    },
    visibility: 'private',
    guestsCanModify: false,
    guestsCanInviteOthers: false,
    guestsCanSeeOtherGuests: true,
  };

  // Add Zoom conference data if available
  if (zoomJoinUrl) {
    event.conferenceData = {
      entryPoints: [
        {
          entryPointType: 'video',
          uri: zoomJoinUrl,
          label: 'Join Zoom Meeting',
        },
      ],
    };
  }

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Calendar API error:', error);
      
      // Try to refresh token if it's expired
      if (response.status === 401) {
        throw new Error('CALENDAR_TOKEN_EXPIRED');
      }
      
      throw new Error(`Failed to create calendar event: ${error.error?.message || response.statusText}`);
    }

    const createdEvent: CalendarEventResponse = await response.json();
    
    console.log('Calendar event created:', {
      id: createdEvent.id,
      start: createdEvent.start.dateTime,
      attendees: createdEvent.attendees?.length || 0,
    });

    return createdEvent;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEventResponse> {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 401) {
        throw new Error('CALENDAR_TOKEN_EXPIRED');
      }
      
      throw new Error(`Failed to update calendar event: ${error.error?.message || response.statusText}`);
    }

    const updatedEvent: CalendarEventResponse = await response.json();
    console.log('Calendar event updated:', eventId);
    
    return updatedEvent;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok && response.status !== 410) { // 410 = already deleted
      const error = await response.json();
      
      if (response.status === 401) {
        throw new Error('CALENDAR_TOKEN_EXPIRED');
      }
      
      throw new Error(`Failed to delete calendar event: ${error.error?.message || response.statusText}`);
    }

    console.log('Calendar event deleted:', eventId);
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

/**
 * Get user's free/busy information for availability checking
 */
export interface FreeBusyResponse {
  calendars: Record<string, { busy: { start: string; end: string }[] }>;
}

export async function getFreeBusyInfo(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
  calendarIds: string[] = ['primary']
): Promise<FreeBusyResponse> {
  const requestBody = {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    timeZone: 'UTC',
    items: calendarIds.map(id => ({ id })),
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 401) {
        throw new Error('CALENDAR_TOKEN_EXPIRED');
      }
      
      throw new Error(`Failed to get free/busy info: ${error.error?.message || response.statusText}`);
    }
    const data: FreeBusyResponse = await response.json();

    if (!data.calendars) {
      console.warn('Google Calendar free/busy response missing calendars field');
      data.calendars = {} as FreeBusyResponse['calendars'];
    }

    return data;
  } catch (error) {
    console.error('Error getting free/busy info:', error);
    throw error;
  }
}

/**
 * Helper to check if a time slot conflicts with existing events
 */
export function hasTimeConflict(
  freeBusyData: {
    calendars?: Record<string, { busy: { start: string; end: string }[] }>;
  },
  proposedStart: Date,
  proposedEnd: Date,
  calendarId: string = 'primary'
): boolean {
  const calendarBusy = freeBusyData.calendars?.[calendarId]?.busy || [];
  
  for (const busyPeriod of calendarBusy) {
    const busyStart = new Date(busyPeriod.start);
    const busyEnd = new Date(busyPeriod.end);
    
    // Check for overlap
    if (proposedStart < busyEnd && proposedEnd > busyStart) {
      return true;
    }
  }
  
  return false;
}