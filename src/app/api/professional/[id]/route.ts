import { NextRequest } from 'next/server';
import { withDB, errorResponse, successResponse } from '@/lib/api/error-handler';
import Session from '@/lib/models/Session';

/**
 * GET /api/professional/[id]
 * Fetch all sessions for a professional with earnings calculation
 */
export const GET = withDB(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id: professionalId } = await params;

  if (!professionalId) {
    return errorResponse('Professional ID is required', 400);
  }

  const now = new Date();

  // Fetch upcoming sessions (requested or confirmed, in the future)
  const upcomingSessions = await Session.find({
    professionalId,
    scheduledAt: { $gte: now },
    status: { $in: ['requested', 'confirmed'] }
  })
  .populate('candidate', 'name email targetRole targetIndustry')
  .sort({ scheduledAt: 1 })
  .lean();

  // Fetch completed sessions (completed status, or past confirmed sessions)
  const completedSessions = await Session.find({
    professionalId,
    $or: [
      { status: 'completed' },
      { 
        status: 'confirmed',
        scheduledAt: { $lt: now }
      }
    ]
  })
  .populate('candidate', 'name email targetRole targetIndustry')
  .sort({ scheduledAt: -1 })
  .limit(50) // Limit to recent 50 completed sessions
  .lean();

  // Get pending sessions (requested but not yet confirmed)
  const pendingSessions = await Session.find({
    professionalId,
    status: 'requested',
    scheduledAt: { $gte: now }
  })
  .populate('candidate', 'name email targetRole targetIndustry resumeUrl')
  .sort({ createdAt: 1 })
  .lean();

  const monthlyEarnings = await calculateMonthlyEarnings(professionalId);

  return successResponse({
    upcoming: upcomingSessions,
    completed: completedSessions,
    pending: pendingSessions,
    stats: {
      totalUpcoming: upcomingSessions.length,
      totalCompleted: completedSessions.length,
      totalPending: pendingSessions.length,
      totalEarningsThisMonth: monthlyEarnings
    }
  });
});

/**
 * Calculate total earnings for current month
 */
async function calculateMonthlyEarnings(professionalId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const completedSessions = await Session.find({
    professionalId,
    status: 'completed',
    completedAt: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  }).select('rateCents');

  const totalCents = completedSessions.reduce((sum, session) => {
    // Apply platform fee calculation (5% platform fee after referrals)
    // For simplicity, assume ~10% total deductions (platform + referrals)
    const netAmount = Math.round(session.rateCents * 0.90);
    return sum + netAmount;
  }, 0);

  return Math.round(totalCents / 100); // Return in dollars
}