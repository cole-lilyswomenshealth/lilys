// src/app/api/stripe/webhook/handlers/payments.ts
import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import { WebhookResponse } from "../utils/types";
import {
  updateSupabaseOrder,
  updateSanityOrder
} from "../utils/db-operations";

/**
 * Handle Stripe payment_intent.succeeded event
 */
export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<NextResponse> {
  
  try {
    // If we have the metadata with order ID, double-check it's marked as paid
    const orderId = paymentIntent.metadata?.orderId;
    const sanityId = paymentIntent.metadata?.sanityId;

    const now = new Date().toISOString();

    if (orderId) {
      // Update Supabase
      await updateSupabaseOrder(
        orderId, 
        {
          payment_status: 'paid',
          payment_method: 'stripe',
          stripe_payment_intent_id: paymentIntent.id,
          updated_at: now
        }
      );
    }
    
    if (sanityId) {
      // Update Sanity
      await updateSanityOrder(
        sanityId, 
        {
          paymentStatus: 'paid',
          paymentMethod: 'stripe',
          stripePaymentIntentId: paymentIntent.id
        }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Payment intent succeeded" 
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process successful payment intent"
      }, 
      { status: 500 }
    );
  }
}

/**
 * Handle Stripe payment_intent.payment_failed event
 */
export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<NextResponse> {
  
  try {
    // If we have the metadata with order ID, update the order status
    const orderId = paymentIntent.metadata?.orderId;
    const sanityId = paymentIntent.metadata?.sanityId;
    
    const now = new Date().toISOString();

    if (orderId) {
      // Update Supabase
      await updateSupabaseOrder(
        orderId, 
        {
          payment_status: 'failed',
          stripe_payment_intent_id: paymentIntent.id,
          updated_at: now
        }
      );
    }
    
    if (sanityId) {
      // Update Sanity
      await updateSanityOrder(
        sanityId, 
        {
          paymentStatus: 'failed',
          stripePaymentIntentId: paymentIntent.id
        }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Payment intent failure handled" 
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process failed payment intent"
      }, 
      { status: 500 }
    );
  }
}