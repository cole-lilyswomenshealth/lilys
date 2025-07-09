// src/app/api/user-data/fetch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Security headers
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

interface UserDataResponse {
  success: boolean;
  data?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    state: string;
    dob: string;
    submission_count: number;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<UserDataResponse>> {
  try {
    // FIXED: Proper cookies handling for Next.js 15 and Vercel deployment
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { 
          status: 401,
          headers: securityHeaders
        }
      );
    }

    console.log('Fetching user data for:', user.email);

    // Fetch user data using service role to bypass RLS
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('user_data')
      .select('id, first_name, last_name, email, phone, state, dob, submission_count')
      .eq('email', user.email)
      .single();

    if (fetchError) {
      // If no record found, return success with no data
      if (fetchError.code === 'PGRST116') {
        console.log('No user data found for:', user.email);
        return NextResponse.json(
          { success: true, data: undefined },
          { headers: securityHeaders }
        );
      }
      
      console.error('Error fetching user data:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user data' },
        { 
          status: 500,
          headers: securityHeaders
        }
      );
    }

    console.log('User data found for:', user.email);

    // Return user data
    return NextResponse.json(
      { 
        success: true, 
        data: {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone: userData.phone,
          state: userData.state,
          dob: userData.dob,
          submission_count: userData.submission_count || 0
        }
      },
      { headers: securityHeaders }
    );

  } catch (error) {
    console.error('Unexpected error in user data fetch:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { 
        status: 500,
        headers: securityHeaders
      }
    );
  }
}

// Reject all non-GET requests
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: {
        ...securityHeaders,
        'Allow': 'GET'
      }
    }
  );
}