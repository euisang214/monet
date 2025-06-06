import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/models/db';

// Standard error response
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

// Success response
export function successResponse(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message })
  });
}

// Authentication wrapper
export function withAuth(
  handler: (request: NextRequest, context: any, session: any) => Promise<NextResponse>,
  options: { requireRole?: 'candidate' | 'professional' } = {}
) {
  return async (request: NextRequest, context: any) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return errorResponse('Not authenticated', 401);
      }

      if (options.requireRole && session.user.role !== options.requireRole) {
        return errorResponse('Insufficient permissions', 403);
      }

      return await handler(request, context, session);
    } catch (error) {
      console.error('Auth error:', error);
      return errorResponse('Authentication failed', 500);
    }
  };
}

// Database connection wrapper
export function withDB(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    try {
      await connectDB();
      return await handler(request, context);
    } catch (error) {
      console.error('Database connection error:', error);
      return errorResponse('Database connection failed', 500);
    }
  };
}

// Combined wrapper for auth + DB
export function withAuthAndDB(
  handler: (request: NextRequest, context: any, session: any) => Promise<NextResponse>,
  options: { requireRole?: 'candidate' | 'professional' } = {}
) {
  return withDB(withAuth(handler, options));
}

// Error handling wrapper
export function withErrorHandling(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API error:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          return errorResponse('Validation error: ' + error.message, 400);
        }
        if (error.message.includes('not found')) {
          return errorResponse('Resource not found', 404);
        }
      }
      
      return errorResponse('Internal server error', 500);
    }
  };
}

// Request validation
export async function validateRequestBody<T>(
  request: NextRequest,
  requiredFields: (keyof T)[]
): Promise<{ isValid: boolean; data?: T; error?: string }> {
  try {
    const body = await request.json() as T;
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return {
          isValid: false,
          error: `Missing required field: ${String(field)}`
        };
      }
    }
    
    return { isValid: true, data: body };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid JSON body'
    };
  }
}