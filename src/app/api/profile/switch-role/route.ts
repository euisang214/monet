import { NextRequest } from 'next/server';
import { withAuth, errorResponse, successResponse, validateRequestBody } from '@/lib/api/error-handler';
import { connectDB } from '@/lib/models/db';
import User from '@/lib/models/User';

interface SwitchRoleRequest {
  userId: string;
  newRole: 'candidate' | 'professional';
}

/**
 * POST /api/profile/switch-role
 * Switch user role between candidate and professional
 */
export const POST = withAuth(async (request: NextRequest, context: any, session: any) => {
  await connectDB();
  
  // Validate request body
  const validation = await validateRequestBody<SwitchRoleRequest>(request, [
    'userId', 'newRole'
  ]);
  
  if (!validation.isValid) {
    return errorResponse(validation.error!, 400);
  }
  
  const { userId, newRole } = validation.data!;

  // Verify the user ID matches the session
  if (userId !== session.user.id) {
    return errorResponse('Unauthorized', 403);
  }

  // Validate new role
  if (!['candidate', 'professional'].includes(newRole)) {
    return errorResponse('Invalid role', 400);
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    return errorResponse('User not found', 404);
  }

  const currentRole = user.role;

  // Check if already in the requested role
  if (currentRole === newRole) {
    return errorResponse(`User is already a ${newRole}`, 400);
  }

  // Record the role change
  const previousRole = currentRole;
  
  // Update the role
  user.role = newRole;

  // Note: We preserve all data from both roles to allow seamless switching back
  // The profile completion flow will handle setting up the new role-specific fields
  // if they're missing. Existing data is preserved for when they switch back.

  try {
    await user.save();

    console.log(`User ${userId} switched from ${previousRole} to ${newRole}`);

    return successResponse({
      userId: user._id,
      previousRole,
      newRole,
      message: `Successfully switched to ${newRole} account`,
      nextStep: `Complete your ${newRole} profile to start using your new account type`
    });

  } catch (error) {
    console.error('Error switching roles:', error);
    return errorResponse('Failed to switch roles', 500);
  }
});

/**
 * GET /api/profile/switch-role
 * Get role switching information for the current user
 */
export const GET = withAuth(async (request: NextRequest, context: any, session: any) => {
  await connectDB();
  
  const userId = session.user.id;
  
  // Get user
  const user = await User.findById(userId);
  if (!user) {
    return errorResponse('User not found', 404);
  }

  const currentRole = user.role;
  const targetRole = currentRole === 'candidate' ? 'professional' : 'candidate';

  // Check if user has data for the target role
  let hasTargetRoleData = false;
  
  if (targetRole === 'professional') {
    hasTargetRoleData = !!(
      user.title && 
      user.company && 
      user.industry && 
      user.bio && 
      user.sessionRateCents
    );
  } else {
    hasTargetRoleData = !!(
      user.school && 
      user.major && 
      user.targetRole
    );
  }

  return successResponse({
    currentRole,
    targetRole,
    hasTargetRoleData,
    canSwitchImmediately: hasTargetRoleData,
    message: hasTargetRoleData 
      ? `You can switch to ${targetRole} immediately`
      : `You'll need to complete your ${targetRole} profile after switching`
  });
});