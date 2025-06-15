import { NextRequest } from 'next/server';
import { withAuthAndDB, errorResponse, successResponse } from '@/lib/api/error-handler';
import User from '@/lib/models/User';
import { getFreeBusyInfo } from '@/lib/calendar';

export const GET = withAuthAndDB(async (request: NextRequest, context: unknown, session: any) => {
  const user = await User.findById(session.user.id);
  if (!user) {
    return errorResponse('User not found', 404);
  }

  if (!user.googleCalendarToken) {
    return successResponse({ calendars: {} });
  }

  const now = new Date();
  const timeMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  try {
    const data = await getFreeBusyInfo(user.googleCalendarToken, now, timeMax);
    return successResponse(data);
  } catch (err) {
    console.error('Failed to fetch free/busy', err);
    return errorResponse('Failed to get calendar availability', 500);
  }
});
