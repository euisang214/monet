import { NextRequest } from 'next/server';
import { withAuth, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
import type { Session } from 'next-auth';
import { connectDB } from '@/lib/models/db';
import User from '@/lib/models/User';

interface SetupRequest {
  userId: string;
  role: 'candidate' | 'professional';
}

/**
 * POST /api/auth/setup
 * Set user role after OAuth authentication
 */
export const POST = withAuth(async (
  request: NextRequest,
  _context: unknown,
  session: Session
) => {
  await connectDB();
  
  // Validate request body
  const validation = await validateRequestBody<SetupRequest>(request, [
    'userId', 'role'
  ]);
  
  if (!validation.isValid) {
    return errorResponse(validation.error!, 400);
  }
  
  const { userId, role } = validation.data!;

  // Verify the user ID matches the session
  if (userId !== session.user.id) {
    return errorResponse('Unauthorized', 403);
  }

  // Validate role
  if (!['candidate', 'professional'].includes(role)) {
    return errorResponse('Invalid role', 400);
  }

  // Update user role
  const user = await User.findById(userId);
  if (!user) {
    return errorResponse('User not found', 404);
  }

  user.role = role;
  await user.save();

  console.log(`User ${userId} role set to ${role}`);

  return successResponse({
    userId,
    role,
    message: 'Role updated successfully'
  });
});