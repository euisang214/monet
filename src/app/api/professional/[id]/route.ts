import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Session from '@/lib/models/Session';

/**
 * GET /api/sessions/professional/[id]
 * Fetch all sessions for a professional
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const professionalId = params.id;

    if (!professionalId) {
      return NextResponse.json(
        { error: 'Professional ID is required' },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        upcoming: upcomingSessions,
        completed: completedSessions,
        pending: pendingSessions,
        stats: {
          totalUpcoming: upcomingSessions.length,
          totalCompleted: completedSessions.length,
          totalPending: pendingSessions.length,
          totalEarningsThisMonth: await calculateMonthlyEarnings(professionalId)
        }
      }
    });

  } catch (error) {
    console.error('Professional sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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