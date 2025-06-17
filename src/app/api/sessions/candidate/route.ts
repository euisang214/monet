import { NextRequest } from 'next/server';

// Ensure this route is always dynamic and never cached
export const dynamic = 'force-dynamic';
import { withAuthAndDB } from '@/lib/api/error-handler';
import type { Session as AuthSession } from 'next-auth';
import { getCandidateSessions } from '@/lib/api/candidate-sessions';

export const GET = withAuthAndDB(
  async (_req: NextRequest, _ctx: unknown, session: AuthSession) =>
    getCandidateSessions(session),
  { requireRole: 'candidate' }
);
