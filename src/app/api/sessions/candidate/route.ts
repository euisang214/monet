import { NextRequest } from 'next/server';
import { withAuthAndDB, successResponse } from '@/lib/api/error-handler';
import Session from '@/lib/models/Session';
import type { Session as AuthSession } from 'next-auth';

/**
 * GET /api/sessions/candidate
 * Fetch all sessions for the currently authenticated candidate
 */
async function getCandidateSessions(session: AuthSession) {
  const candidateId = session.user.id;
  const now = new Date();

  const upcomingSessions = await Session.find({
    candidateId,
    scheduledAt: { $gte: now },
    status: 'confirmed'
  })
    .populate('professionalId', 'name title company profileImageUrl')
    .sort({ scheduledAt: 1 })
    .lean();

  const completedSessions = await Session.find({
    candidateId,
    $or: [
      { status: 'completed' },
      { status: 'confirmed', scheduledAt: { $lt: now } }
    ]
  })
    .populate('professionalId', 'name title company profileImageUrl')
    .sort({ scheduledAt: -1 })
    .limit(50)
    .lean();

  const pendingSessions = await Session.find({ candidateId, status: 'requested' })
    .populate('professionalId', 'name title company profileImageUrl')
    .sort({ createdAt: 1 })
    .lean();

  const monthlySpending = await calculateMonthlySpending(candidateId);

  return successResponse({
    upcoming: upcomingSessions,
    completed: completedSessions,
    pending: pendingSessions,
    stats: {
      totalUpcoming: upcomingSessions.length,
      totalCompleted: completedSessions.length,
      totalPending: pendingSessions.length,
      totalSpentThisMonth: monthlySpending
    }
  });
}

export const GET = withAuthAndDB(
  async (_req: NextRequest, _ctx: unknown, session: AuthSession) =>
    getCandidateSessions(session),
  { requireRole: 'candidate' }
);

async function calculateMonthlySpending(candidateId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const paidSessions = await Session.find({
    candidateId,
    status: { $in: ['confirmed', 'completed'] },
    paidAt: { $gte: startOfMonth, $lte: endOfMonth }
  }).select('rateCents');

  const totalCents = paidSessions.reduce((sum, session) => sum + session.rateCents, 0);
  return Math.round(totalCents / 100);
}
