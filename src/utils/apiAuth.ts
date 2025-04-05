// src/utils/apiAuth.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Helper function to get the authenticated user from cookies in API routes
 * @returns The authenticated user or null if not authenticated
 */
export async function getAuthenticatedUser() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Verify a request is authenticated and return the user or an error response
 * @param req The Next.js request
 * @returns Object containing either the user or an error response
 */
export async function verifyAuthenticatedRequest(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      };
    }
    
    return { user, errorResponse: null };
  } catch (error) {
    console.error('Error verifying authenticated request:', error);
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Authentication verification failed' },
        { status: 500 }
      )
    };
  }
}

/**
 * Creates a authenticated Supabase client for server components
 * @returns Supabase client authenticated from cookies
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createRouteHandlerClient({ cookies: () => cookieStore });
}