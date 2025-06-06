import { NextRequest } from 'next/server';
import { withAuthAndDB, errorResponse, successResponse } from '@/lib/api/error-handler';
import Session from '@/lib/models/Session';

/**
 * GET /api/sessions/candidate/[id]
 * Fetch all sessions for a candidate
 */
export const GET = withAuthAndDB(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session: any
) => {
  const candidateId = params.id;

  if (!candidateId) {
    return errorResponse('Candidate ID is required', 400);
  }

  // Verify candidateId matches session user
  if (candidateId !== session.user.id) {
    return errorResponse('Unauthorized - not your sessions', 403);
  }

  const now = new Date();

  // Fetch upcoming sessions (requested or confirmed, in the future)
  const upcomingSessions = await Session.find({
    candidateId,
    scheduledAt: { $gte: now },
    status: { $in: ['requested', 'confirmed'] }
  })
  .populate('professional', 'name title company profileImageUrl')
  .sort({ scheduledAt: 1 })
  .lean();

  // Fetch completed sessions 
  const completedSessions = await Session.find({
    candidateId,
    $or: [
      { status: 'completed' },
      { 
        status: 'confirmed',
        scheduledAt: { $lt: now }
      }
    ]
  })
  .populate('professional', 'name title company profileImageUrl')
  .sort({ scheduledAt: -1 })
  .limit(50) // Limit to recent 50 completed sessions
  .lean();

  // Get pending sessions (requested but not yet confirmed)
  const pendingSessions = await Session.find({
    candidateId,
    status: 'requested',
    scheduledAt: { $gte: now }
  })
  .populate('professional', 'name title company profileImageUrl')
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

}, { requireRole: 'candidate' });

/**
 * Calculate total spending for current month
 */
async function calculateMonthlySpending(candidateId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const paidSessions = await Session.find({
    candidateId,
    status: { $in: ['confirmed', 'completed'] },
    paidAt: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  }).select('rateCents');

  const totalCents = paidSessions.reduce((sum, session) => {
    return sum + session.rateCents;
  }, 0);

  return Math.round(totalCents / 100); // Return in dollars
}