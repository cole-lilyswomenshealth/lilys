// src/app/api/stripe/subscriptions/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { client as sanityClient } from "@/sanity/lib/client";
import Stripe from "stripe";
import { subscriptionRateLimit } from "@/utils/rateLimit";
import { subscriptionCancelSchema, validateRequest, createSafeErrorMessage } from "@/utils/validation";
import { getAuthenticatedUser } from "@/utils/apiAuth";

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: undefined, // Use latest API version
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CancelSubscriptionRequest {
  subscriptionId: string; // The Supabase subscription ID
  immediate?: boolean; // Whether to cancel immediately or at period end
}

export async function POST(req: NextRequest) {
  try {
    // Extract and validate request body
    const data: CancelSubscriptionRequest = await req.json();
    
    // Validate request data
    const validation = validateRequest(subscriptionCancelSchema, data);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;
    
    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Check rate limit
    const rateLimitResult = await subscriptionRateLimit(req, user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    // Set immediate cancellation as default
    const isImmediateCancel = validatedData.immediate !== false;
    
    
    // First, try to find the subscription in our database using the subscriptionId
    // Check if it's a Supabase ID (UUID format) or Stripe ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(validatedData.subscriptionId);
    
    let userSubscriptionData;
    let stripeSubscriptionId;
    
    if (isUuid) {
      // It's a Supabase UUID, fetch by ID
      const { data: subData, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('id, stripe_subscription_id, sanity_id, status, user_id')
        .eq('id', validatedData.subscriptionId)
        .single();
      
      if (fetchError || !subData) {
        return NextResponse.json(
          { success: false, error: "Subscription not found" },
          { status: 404 }
        );
      }
      
      userSubscriptionData = subData;
      stripeSubscriptionId = subData.stripe_subscription_id;
    } else {
      // It's a Stripe ID, fetch by Stripe subscription ID
      const { data: subData, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('id, stripe_subscription_id, sanity_id, status, user_id')
        .eq('stripe_subscription_id', validatedData.subscriptionId)
        .single();
      
      if (fetchError || !subData) {
        return NextResponse.json(
          { success: false, error: "Subscription not found" },
          { status: 404 }
        );
      }
      
      userSubscriptionData = subData;
      stripeSubscriptionId = validatedData.subscriptionId;
    }
    
    // Verify user owns this subscription
    if (userSubscriptionData.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied: You can only cancel your own subscriptions" },
        { status: 403 }
      );
    }

    // Check if already cancelled
    if (userSubscriptionData.status === 'cancelled') {
      return NextResponse.json({
        success: true,
        message: "Subscription is already cancelled"
      });
    }

    // Cancel subscription in Stripe
    let subscription;
    let targetStatus = 'cancelled';
    let isActive = false;
    let endDate = new Date().toISOString();

    if (stripeSubscriptionId) {
      try {
        if (isImmediateCancel) {
          // Cancel immediately - subscription ends now
          subscription = await stripe.subscriptions.cancel(stripeSubscriptionId);
        } else {
          // Cancel at period end - subscription remains active until period ends
          subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
            cancel_at_period_end: true,
          });
          targetStatus = 'cancelling';
          isActive = true; // Keep active until period ends
          endDate = new Date(subscription.current_period_end * 1000).toISOString();
        }
      } catch (stripeError) {
        
        // If subscription doesn't exist in Stripe, proceed with local cancellation
        if (stripeError instanceof Stripe.errors.StripeError && stripeError.code === 'resource_missing') {
          subscription = null;
        } else {
          throw new Error(`Stripe error: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`);
        }
      }
    }
    
    // Update Supabase subscription status
    const now = new Date().toISOString();
    const updateData: any = {
      status: targetStatus,
      is_active: isActive,
      cancellation_date: now,
      updated_at: now
    };

    // Set end_date only for immediate cancellation
    if (isImmediateCancel) {
      updateData.end_date = endDate;
    } else if (subscription?.current_period_end) {
      updateData.end_date = endDate;
    }

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', userSubscriptionData.id);
    
    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }
    
    
    // If we have a Sanity ID, update Sanity too
    if (userSubscriptionData.sanity_id) {
      try {
        await sanityClient
          .patch(userSubscriptionData.sanity_id)
          .set({
            status: targetStatus,
            isActive: isActive,
            cancellationDate: now,
            ...(isImmediateCancel && { endDate })
          })
          .commit();
        
      } catch (error) {
        // Don't throw here, Supabase is our source of truth
      }
    }
    
    const message = isImmediateCancel 
      ? "Subscription has been cancelled immediately"
      : "Subscription will be cancelled at the end of your billing period";
    
    return NextResponse.json({
      success: true,
      message,
      status: targetStatus,
      cancelled_immediately: isImmediateCancel
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: createSafeErrorMessage(error)
      }, 
      { status: 500 }
    );
  }
}