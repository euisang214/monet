import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

/**
 * GET /api/auth/profile/[id]
 * Get user profile data for completion
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const userId = params.id;

    // Verify the user ID matches the session
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get user profile
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return role-specific profile data
    let profileData = {};

    if (user.role === 'candidate') {
      profileData = {
        school: user.school || '',
        major: user.major || '',
        minor: user.minor || '',
        graduationYear: user.graduationYear || '',
        gpa: user.gpa || '',
        targetRole: user.targetRole || '',
        targetIndustry: user.targetIndustry || '',
        offerBonusCents: user.offerBonusCents || 20000
      };
    } else if (user.role === 'professional') {
      profileData = {
        title: user.title || '',
        company: user.company || '',
        industry: user.industry || '',
        yearsExperience: user.yearsExperience || 0,
        sessionRateCents: user.sessionRateCents || 5000,
        bio: user.bio || '',
        expertise: user.expertise || []
      };
    }

    return NextResponse.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}