import { NextRequest } from 'next/server';
import { withAuthAndDB, errorResponse } from '@/lib/api/error-handler';
import type { Session as AuthSession } from 'next-auth';
import { getCandidateSessions } from '@/lib/api/candidate-sessions';

/**
 * GET /api/sessions/candidate/[id]
 * Fetch all sessions for a candidate
 */
export const GET = withAuthAndDB(async (
  request: NextRequest,
  context: unknown,
  session: AuthSession
) => {
  const ctx = context as { params?: Promise<Record<string, string | string[] | undefined>> };
  const params = ctx.params ? await ctx.params : undefined;
  const candidateId = (params as Record<string, string | undefined> | undefined)?.id as string;

  if (!candidateId) {
    return errorResponse('Candidate ID is required', 400);
  }

  // Verify candidateId matches session user
  if (candidateId !== session.user.id) {
    return errorResponse('Unauthorized - not your sessions', 403);
  }

  return getCandidateSessions(session);

}, { requireRole: 'candidate' });

