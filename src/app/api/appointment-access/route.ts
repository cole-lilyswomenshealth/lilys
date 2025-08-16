// src/app/api/appointment-access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables are not defined');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Response interface for appointment access
interface AppointmentAccessResponse {
  success: boolean;
  hasAccess: boolean;
  subscriptionId?: string;
  message?: string;
  error?: string;
}

// Interface for subscription data
interface SubscriptionData {
  id: string;
  user_id: string;
  is_active: boolean;
  status: string;
  plan_name: string;
}

/**
 * POST: Check appointment access based on active subscription
 * Simplified logic - just check for active subscription
 */
export async function POST(req: NextRequest): Promise<NextResponse<AppointmentAccessResponse>> {
  try {
    // Get authentication from cookies (Vercel compatible)
    const cookies = req.headers.get('cookie');
    
    if (!cookies) {
      return NextResponse.json({
        success: false,
        hasAccess: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Extract user ID from request body
    let userId: string;
    try {
      const body = await req.json();
      userId = body.userId;
    } catch {
      // If no body, try to get from Supabase auth
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({
          success: false,
          hasAccess: false,
          error: 'User authentication failed'
        }, { status: 401 });
      }
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        hasAccess: false,
        error: 'User ID required'
      }, { status: 400 });
    }


    // Simple query to check for active subscription
    const { data: subscriptionData, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        is_active,
        status,
        plan_name
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Check if user has valid subscription
    if (subError || !subscriptionData) {
      return NextResponse.json({
        success: false,
        hasAccess: false,
        error: 'No valid active subscription found'
      }, { status: 403 });
    }


    // Grant access if user has active subscription
    return NextResponse.json({
      success: true,
      hasAccess: true,
      subscriptionId: subscriptionData.id,
      message: `Access granted with ${subscriptionData.plan_name} subscription`
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({
      success: false,
      hasAccess: false,
      error: `Access verification failed: ${errorMessage}`
    }, { status: 500 });
  }
}

/**
 * GET: Check current access status without modifying anything
 * Used for status checks
 */
export async function GET(req: NextRequest): Promise<NextResponse<AppointmentAccessResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        hasAccess: false,
        error: 'User ID required'
      }, { status: 400 });
    }

    // Get current subscription status
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        id,
        is_active,
        status,
        plan_name
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('status', ['active', 'trialing', 'past_due'])
      .single();

    if (subError || !subscription) {
      return NextResponse.json({
        success: false,
        hasAccess: false,
        error: 'No valid subscription'
      });
    }

    return NextResponse.json({
      success: true,
      hasAccess: true,
      subscriptionId: subscription.id,
      message: `Access available with ${subscription.plan_name} subscription`
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({
      success: false,
      hasAccess: false,
      error: errorMessage
    }, { status: 500 });
  }
}