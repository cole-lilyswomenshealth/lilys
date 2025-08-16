// src/app/api/stripe/subscriptions/reactivate/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client as sanityClient } from "@/sanity/lib/client";
import Stripe from "stripe";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: undefined, // Use latest API version
});

// Initialize Supabase admin client for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface ReactivateRequest {
  subscriptionId: string; // The Stripe subscription ID
}

export async function POST(req: Request) {
  try {
    // Parse request body
    const data: ReactivateRequest = await req.json();
    
    // Validate required fields
    if (!data.subscriptionId) {
      return NextResponse.json(
        { success: false, error: "Subscription ID is required" },
        { status: 400 }
      );
    }
    
    // Get auth client with user's cookie context
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify the user is authenticated
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Fetch subscription from Supabase to verify ownership
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, user_id, status, is_active, sanity_id')
      .eq('stripe_subscription_id', data.subscriptionId);
    
    if (fetchError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch subscription: ${fetchError.message}` },
        { status: 500 }
      );
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }
    
    const subscription = subscriptions[0];
    
    // Verify the user owns this subscription
    if (subscription.user_id !== authData.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to modify this subscription" },
        { status: 403 }
      );
    }
    
    // Verify the subscription is in cancelling status
    if (subscription.status !== 'cancelling') {
      return NextResponse.json(
        { success: false, error: "Only subscriptions in 'cancelling' status can be reactivated" },
        { status: 400 }
      );
    }
    
    try {
      // Call Stripe API to reactivate the subscription
      await stripe.subscriptions.update(data.subscriptionId, {
        cancel_at_period_end: false,
      });
      
      // Update Supabase subscription
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: 'active',
          is_active: true,
          updated_at: now
        })
        .eq('id', subscription.id);
      
      // Update Sanity if we have a Sanity ID
      if (subscription.sanity_id) {
        try {
          await sanityClient
            .patch(subscription.sanity_id)
            .set({
              status: 'active',
              isActive: true
            })
            .commit();
        } catch (sanityError) {
          // Continue even if Sanity update fails
        }
      }
      
      return NextResponse.json({
        success: true,
        message: "Subscription reactivated successfully",
        data: {
          id: subscription.id,
          status: 'active'
        }
      });
      
    } catch (stripeError) {
      return NextResponse.json(
        { 
          success: false, 
          error: stripeError instanceof Error ? 
            stripeError.message : 
            "Failed to reactivate subscription with Stripe"
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to reactivate subscription"
      }, 
      { status: 500 }
    );
  }
}