// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Stripe } from "stripe";
import stripe from "./utils/stripe-client";

// Import handlers
import { 
  handleSubscriptionUpdated, 
  handleSubscriptionDeleted 
} from "./handlers/subscriptions";
import { 
  handleInvoicePaymentSucceeded, 
  handleInvoicePaymentFailed 
} from "./handlers/invoices";
import { 
  handlePaymentIntentSucceeded, 
  handlePaymentIntentFailed 
} from "./handlers/payments";

// This is needed to disable body parsing for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    
    // Await the headers() function to get the ReadonlyHeaders object
    const headerList = await headers();
    const signature = headerList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No Stripe signature found" }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Stripe webhook secret not configured" }, { status: 500 });
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`⚡ Received Stripe webhook event: ${event.type}`);

    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed':
        // Checkout sessions are no longer used after product removal
        console.log(`Ignoring checkout.session.completed event (products removed): ${event.data.object.id}`);
        return NextResponse.json({ received: true });
      
      case 'invoice.payment_succeeded':
        return await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      
      case 'invoice.payment_failed':
        return await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      
      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      
      default:
        // Handle unimplemented event types
        console.log(`Ignoring unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Error processing webhook: ${errorMessage}`);
    return NextResponse.json({ error: "Webhook error: " + errorMessage }, { status: 400 });
  }
}