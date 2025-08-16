// src/app/api/stripe/subscriptions/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client as sanityClient } from "@/sanity/lib/client";
import Stripe from "stripe";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/utils/apiAuth';

// Types
interface SubscriptionSyncRequest {
  userId: string;
  subscriptionId?: string;
  forceRefresh?: boolean;
}

interface SubscriptionData {
  id: string;
  sanity_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_session_id?: string | null;
  status: string;
  is_active: boolean;
}

interface SyncResult {
  id: string;
  success: boolean;
  message?: string;
  error?: string;
  previousStatus?: string;
  newStatus?: string;
  stripeStatus?: string | null;
  status?: string;         
  partialSuccess?: boolean;
}

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: undefined, // Use latest API version
});

// Initialize Supabase admin client for server operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from cookies
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const data: SubscriptionSyncRequest = await req.json();
    
    // Validate user ID is provided
    if (!data.userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Security check: Ensure user can only access their own data
    if (data.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Cannot access other users' subscription data" },
        { status: 403 }
      );
    }

    
    // Use admin client for subsequent operations to have full access
    // Fetch the user's subscriptions
    let query = supabaseAdmin
      .from('user_subscriptions')
      .select('id, stripe_subscription_id, stripe_session_id, status, is_active, sanity_id')
      .eq('user_id', data.userId);
    
    // Add filter if specific subscription ID provided
    if (data.subscriptionId) {
      query = query.eq('id', data.subscriptionId);
    }
    
    const { data: subscriptions, error: fetchError } = await query;
    
    if (fetchError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch subscriptions: ${fetchError.message}` },
        { status: 500 }
      );
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { success: true, message: "No subscriptions found to sync", subscriptions: [] }
      );
    }
    
    
    // Process each subscription
    const results: SyncResult[] = await Promise.all(subscriptions.map(async (subscription) => {
      try {
        return await syncSubscriptionStatus(subscription);
      } catch (error) {
        return {
          id: subscription.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }));
    
    // Get updated subscriptions after sync
    const { data: updatedSubscriptions } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', data.userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    // Return results with updated subscriptions
    return NextResponse.json({
      success: true,
      results,
      subscriptions: updatedSubscriptions || []
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to sync subscription statuses"
      }, 
      { status: 500 }
    );
  }
}

/**
 * Sync a single subscription's status with Stripe
 */
async function syncSubscriptionStatus(subscription: SubscriptionData): Promise<SyncResult> {
  // If we don't have a Stripe subscription ID, check if we have a session ID
  if (!subscription.stripe_subscription_id && subscription.stripe_session_id) {
    try {
      // Try to get subscription from checkout session
      const session = await stripe.checkout.sessions.retrieve(subscription.stripe_session_id, {
        expand: ['subscription']
      });
      
      if (session.subscription) {
        // We found the subscription, update our record
        const stripeSubId = typeof session.subscription === 'string' 
          ? session.subscription 
          : session.subscription.id;
        
        // Update Supabase with the subscription ID
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            stripe_subscription_id: stripeSubId,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);
        
        // Set for further processing
        subscription.stripe_subscription_id = stripeSubId;
      } else {
        return {
          id: subscription.id,
          success: false,
          message: "No subscription found in Stripe for this session",
          stripeStatus: session.status
        };
      }
    } catch (error) {
      return {
        id: subscription.id,
        success: false,
        error: `Failed to retrieve Stripe session: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  }
  
  // If we still don't have a Stripe subscription ID, we can't proceed
  if (!subscription.stripe_subscription_id) {
    return {
      id: subscription.id,
      success: false,
      message: "No Stripe subscription ID available to sync"
    };
  }
  
  try {
    // Retrieve subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    
    // Map Stripe status to our internal status
    const { status, isActive } = mapStripeStatus(stripeSubscription.status);
    
    // Check if status needs updating
    const needsUpdate = subscription.status !== status || subscription.is_active !== isActive;
    
    if (!needsUpdate) {
      return {
        id: subscription.id,
        success: true,
        message: "Subscription status is already in sync",
        status: status,
        stripeStatus: stripeSubscription.status
      };
    }
    
    // Update Supabase
    const now = new Date().toISOString();
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: status,
        is_active: isActive,
        updated_at: now
      })
      .eq('id', subscription.id);
    
    // Update Sanity if we have a Sanity ID
    if (subscription.sanity_id) {
      try {
        await sanityClient
          .patch(subscription.sanity_id)
          .set({
            status: status,
            isActive: isActive
          })
          .commit();
      } catch (sanityError) {
        return {
          id: subscription.id,
          success: true,
          partialSuccess: true,
          message: "Updated Supabase but failed to update Sanity",
          status: status,
          stripeStatus: stripeSubscription.status
        };
      }
    }
    
    return {
      id: subscription.id,
      success: true,
      message: "Subscription synced successfully",
      previousStatus: subscription.status,
      newStatus: status,
      stripeStatus: stripeSubscription.status
    };
    
  } catch (error) {
    // Check if it's a Stripe error indicating the subscription doesn't exist
    if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
      // Handle case where subscription has been deleted in Stripe
      // Update our database to show cancelled/inactive
      const now = new Date().toISOString();
      
      try {
        // Update Supabase
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            is_active: false,
            updated_at: now
          })
          .eq('id', subscription.id);
        
        // Update Sanity if we have a Sanity ID
        if (subscription.sanity_id) {
          await sanityClient
            .patch(subscription.sanity_id)
            .set({
              status: 'cancelled',
              isActive: false
            })
            .commit();
        }
        
        return {
          id: subscription.id,
          success: true,
          message: "Subscription not found in Stripe, marked as cancelled",
          previousStatus: subscription.status,
          newStatus: 'cancelled'
        };
      } catch (updateError) {
        return {
          id: subscription.id,
          success: false,
          error: `Subscription not found in Stripe and failed to update: ${updateError instanceof Error ? updateError.message : "Unknown error"}`
        };
      }
    }
    
    // Handle other errors
    return {
      id: subscription.id,
      success: false,
      error: `Failed to sync with Stripe: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

/**
 * Map Stripe subscription status to our internal status
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): {
  status: string;
  isActive: boolean;
} {
  switch (stripeStatus) {
    case 'active':
      return { status: 'active', isActive: true };
    case 'past_due':
      return { status: 'past_due', isActive: true }; // Still give access but flag it
    case 'canceled':
      return { status: 'cancelled', isActive: false };
    case 'unpaid':
      return { status: 'unpaid', isActive: false };
    case 'paused':
      return { status: 'paused', isActive: false };
    case 'trialing':
      return { status: 'trialing', isActive: true };
    case 'incomplete':
      return { status: 'incomplete', isActive: false };
    case 'incomplete_expired':
      return { status: 'expired', isActive: false };
    default:
      // For any other status we might encounter
      return { status: stripeStatus, isActive: false };
  }
}