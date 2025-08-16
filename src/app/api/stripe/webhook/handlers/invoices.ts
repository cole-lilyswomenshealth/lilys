// src/app/api/stripe/webhook/handlers/invoices.ts
import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import stripe from "../utils/stripe-client";
import { WebhookResponse } from "../utils/types";
import {
  getSupabaseSubscription,
  updateSupabaseSubscription,
  updateSanitySubscription
} from "../utils/db-operations";

/**
 * Handle Stripe invoice.payment_succeeded event
 */
export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<NextResponse> {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    return NextResponse.json({ 
      success: false, 
      error: "No subscription ID in invoice" 
    }, { status: 400 });
  }
  
  
  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Find the user subscription in Supabase
    const userSubscription = await getSupabaseSubscription(
      subscriptionId, 
      'stripe_subscription_id'
    );
    
    if (!userSubscription) {
      return NextResponse.json({ 
        success: false, 
        error: "Subscription not found" 
      }, { status: 404 });
    }
    
    // Calculate new end date
    const endDate = new Date(subscription.current_period_end * 1000);
    
    // Update Supabase user subscription
    await updateSupabaseSubscription(
      userSubscription.id, 
      {
        end_date: endDate.toISOString(),
        next_billing_date: endDate.toISOString(),
        status: 'active',
        is_active: true,
        updated_at: new Date().toISOString()
      }
    );
    
    // Update Sanity if we have the ID
    if (userSubscription.sanity_id) {
      await updateSanitySubscription(
        userSubscription.sanity_id, 
        {
          endDate: endDate.toISOString(),
          nextBillingDate: endDate.toISOString(),
          status: 'active',
          isActive: true
        }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Invoice payment processed successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process invoice payment"
      }, 
      { status: 500 }
    );
  }
}

/**
 * Handle Stripe invoice.payment_failed event
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<NextResponse> {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    return NextResponse.json({ 
      success: false, 
      error: "No subscription ID in invoice" 
    }, { status: 400 });
  }

  
  try {
    // Find the user subscription in Supabase
    const userSubscription = await getSupabaseSubscription(
      subscriptionId, 
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
        status: 'past_due',
        updated_at: new Date().toISOString()
      }
    );
    
    // Update Sanity if we have the ID
    if (userSubscription.sanity_id) {
      await updateSanitySubscription(
        userSubscription.sanity_id, 
        {
          status: 'past_due'
        }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Invoice payment failure handled"
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process payment failure"
      }, 
      { status: 500 }
    );
  }
}