// src/app/api/stripe/webhook/handlers/invoices.ts
import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import stripe from "../utils/stripe-client";
import {
  getSupabaseSubscription,
  updateSupabaseSubscription,
  updateSanitySubscription
} from "../utils/db-operations";
import { supabase } from "../utils/db-clients";
import { ghlService } from "@/lib/gohighlevel";
import { formatPhoneToE164 } from "@/utils/phoneFormatter";
import type { GHLLead, GHLCustomField } from "@/types/gohighlevel";

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

    // Sync customer to GoHighLevel (non-blocking)
    syncCustomerToGHL(subscriptionId, endDate).catch(error => {
      console.error('[GHL] Customer sync failed:', error.message);
      // Continue - don't block payment processing
    });

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

/**
 * Sync customer to GoHighLevel after successful payment
 * Uses upsert to update existing lead or create new customer
 */
async function syncCustomerToGHL(
  stripeSubscriptionId: string,
  nextBillingDate: Date
): Promise<void> {
  // Fetch full subscription data
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select('user_email, plan_name, billing_amount, billing_period, status, start_date, stripe_subscription_id, stripe_customer_id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single();

  if (subError || !subscription) {
    throw new Error(`Subscription not found: ${subError?.message}`);
  }

  // Fetch user contact info
  const { data: userData, error: userError } = await supabase
    .from('user_data')
    .select('first_name, last_name, email, phone, state, dob, dose_level')
    .eq('email', subscription.user_email)
    .single();

  if (userError || !userData) {
    throw new Error(`User data not found: ${userError?.message}`);
  }

  // Extract medication type from plan name
  const medicationType = extractMedicationType(subscription.plan_name);

  // Build GHL custom fields
  const customFields = buildGHLCustomFields(
    subscription,
    medicationType,
    userData.dose_level || 1,
    nextBillingDate
  );

  // Create GHL lead payload
  const ghlLead: GHLLead = {
    firstName: userData.first_name,
    lastName: userData.last_name,
    email: userData.email,
    phone: formatPhoneToE164(userData.phone),
    locationId: process.env.GHL_LOCATION_ID!,
    tags: ['stripe', 'customer'],
    source: 'Stripe - Customer Purchase',
    customFields,
  };

  // Send to GHL (upsert: true is set automatically in service)
  await ghlService.upsertContact(ghlLead);
  console.log('[GHL] Customer synced:', userData.email);
}

/**
 * Extract medication type from subscription plan name
 */
function extractMedicationType(planName: string | null): string {
  const name = planName?.toLowerCase() || '';

  if (name.includes('tirzepatide')) return 'Tirzepatide';
  if (name.includes('semaglutide')) return 'Semaglutide';

  return 'Unknown';
}

/**
 * Build GHL custom fields array for subscription metadata
 */
function buildGHLCustomFields(
  subscription: {
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
    plan_name: string | null;
    billing_amount: number | null;
    billing_period: string | null;
    status: string | null;
    start_date: string | null;
  },
  medicationType: string,
  doseLevel: number,
  nextBillingDate: Date
): GHLCustomField[] {
  const fields: Record<string, string> = {
    stripe_subscription_id: subscription.stripe_subscription_id || '',
    stripe_customer_id: subscription.stripe_customer_id || '',
    stripe_plan_name: subscription.plan_name || '',
    stripe_medication_type: medicationType,
    stripe_billing_amount: subscription.billing_amount?.toString() || '0',
    stripe_billing_period: subscription.billing_period || '',
    stripe_subscription_status: subscription.status || '',
    stripe_start_date: subscription.start_date || '',
    stripe_next_billing_date: nextBillingDate.toISOString(),
    stripe_pharmacy_name: 'Akina Pharmacy',
    stripe_dose_level: doseLevel.toString(),
  };

  return Object.entries(fields)
    .filter(([_, value]) => value !== '')
    .map(([key, value]) => ({ key, value }));
}