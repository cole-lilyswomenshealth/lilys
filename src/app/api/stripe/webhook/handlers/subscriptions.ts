// src/app/api/stripe/webhook/handlers/subscriptions.ts
import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import stripe from "../utils/stripe-client";
import { supabase, sanityClient } from "../utils/db-clients";
import { WebhookResponse } from "../utils/types";
import {
  getSupabaseSubscription,
  updateSupabaseSubscription,
  updateSanitySubscription
} from "../utils/db-operations";

/**
 * Handle Stripe customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<NextResponse> {
  
  try {
    // Map Stripe status to our status
    const { status, isActive } = mapSubscriptionStatus(subscription.status);
    
    // Find the user subscription in Supabase
    const userSubscription = await getSupabaseSubscription(
      subscription.id, 
      'stripe_subscription_id'
    );
    
    if (!userSubscription) {
      return NextResponse.json({ 
        success: false, 
        error: "Subscription not found" 
      }, { status: 404 });
    }

    // Update Supabase user subscription
    await updateSupabaseSubscription(
      userSubscription.id, 
      {
        status,
        is_active: isActive,
        updated_at: new Date().toISOString()
      }
    );
    
    // Update Sanity if we have the ID
    if (userSubscription.sanity_id) {
      await updateSanitySubscription(
        userSubscription.sanity_id, 
        {
          status,
          isActive
        }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Subscription updated to status: ${status}` 
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process subscription update"
      }, 
      { status: 500 }
    );
  }
}

/**
 * Handle Stripe customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<NextResponse> {
  
  try {
    // Find the user subscription in Supabase
    const userSubscription = await getSupabaseSubscription(
      subscription.id, 
      'stripe_subscription_id'
    );
    
    if (!userSubscription) {
      return NextResponse.json({ 
        success: false, 
        error: "Subscription not found" 
      }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Update Supabase user subscription
    await updateSupabaseSubscription(
      userSubscription.id, 
      {
        status: 'cancelled',
        is_active: false,
        end_date: now,
        updated_at: now
      }
    );
    
    // Update Sanity if we have the ID
    if (userSubscription.sanity_id) {
      await updateSanitySubscription(
        userSubscription.sanity_id, 
        {
          status: 'cancelled',
          isActive: false,
          endDate: now
        }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Subscription cancelled successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process subscription deletion"
      }, 
      { status: 500 }
    );
  }
}

/**
 * Map Stripe subscription status to our internal status
 */
function mapSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): {
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