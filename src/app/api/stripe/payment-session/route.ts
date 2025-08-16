// src/app/api/stripe/payment-session/route.ts
import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import { createClient } from "@supabase/supabase-js";
import { client as sanityClient } from "@/sanity/lib/client";

// New default API version: 2025-02-24.acacia (because stripe has provided this new api version)
// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: undefined, // Use the required API version
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types
interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface PaymentSessionRequest {
  orderId: string;
  cart: CartItem[];
}

interface SupabaseOrder {
  id: string;
  email: string;
  sanity_id?: string;
  [key: string]: unknown;
}

// Define Stripe line item interface
interface LineItem {
  price_data: {
    currency: string;
    product_data: {
      name: string;
      images?: string[] | undefined;
    };
    unit_amount: number;
  };
  quantity: number;
}

// Define error response interface
interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

// Define Sanity document type
interface SanityDocument {
  _id: string;
  paymentMethod?: string;
  paymentStatus?: string;
  stripeSessionId?: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  try {
    const data: PaymentSessionRequest = await req.json();
    
    // Validate required fields
    if (!data.orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(data.cart) || data.cart.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is required and cannot be empty" },
        { status: 400 }
      );
    }
    
    // Determine if this is a Sanity ID or a Supabase ID
    const isSanityId = !data.orderId.includes('-'); // Sanity IDs don't have hyphens, UUID does
    
    let supabaseOrderData: SupabaseOrder;
    let sanityId: string | undefined;
    
    if (isSanityId) {
      // Store the Sanity ID
      sanityId = data.orderId;
      
      
      // Look up the order in Supabase by Sanity ID
      const { data: orderData, error: orderFetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('sanity_id', data.orderId)
        .single();
      
      if (orderFetchError || !orderData) {
        
        // Let's log the error details for debugging
        
        return NextResponse.json(
          { success: false, error: `Order not found by Sanity ID: ${data.orderId}` },
          { status: 404 }
        );
      }
      
      supabaseOrderData = orderData as SupabaseOrder;
    } else {
      // Direct lookup by Supabase ID
      
      const { data: orderData, error: orderFetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', data.orderId)
        .single();
      
      if (orderFetchError || !orderData) {
        return NextResponse.json(
          { success: false, error: `Order not found by Supabase ID: ${data.orderId}` },
          { status: 404 }
        );
      }
      
      supabaseOrderData = orderData as SupabaseOrder;
      sanityId = supabaseOrderData.sanity_id;
    }
    
    // Calculate totals
    const subtotal = data.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = 15; // Same as in checkout page
    const total = subtotal + shippingCost;
    
    // Format for Stripe (prices must be in cents)
    const lineItems: LineItem[] = data.cart.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));
    
    // Add shipping as a line item
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
            images: undefined, // Add this to match the type requirement
          },
          unit_amount: shippingCost * 100, // Convert to cents
        },
        quantity: 1,
      });
    }
    
    // Get customer email for pre-filling Stripe checkout
    const customerEmail = supabaseOrderData.email;
    
    // First, update the Supabase order with payment info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_method: 'stripe', // Ensure payment method is set to stripe
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', supabaseOrderData.id);
    
    if (updateError) {
      // Continue anyway as this is not critical
    } else {
    }
    
    // If we have a Sanity ID, update Sanity order too
    if (sanityId) {
      try {
        
        // Update payment method in Sanity
        await sanityClient
          .patch(sanityId)
          .set({
            paymentMethod: 'stripe', // Update payment method to stripe
            paymentStatus: 'awaiting' // Set to awaiting payment
          })
          .commit({visibility: 'sync'});
          
        
        // Verify the update
        const updatedDoc = await sanityClient.getDocument(sanityId) as SanityDocument;
      } catch (error) {
        const sanityError = error as ErrorResponse;
        // Continue anyway as this is not critical
      }
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/order-confirmation?orderId=${sanityId || supabaseOrderData.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
      customer_email: customerEmail, // Pre-fill customer email
      metadata: {
        orderId: supabaseOrderData.id, // Always include Supabase ID
        sanityId: sanityId || null,    // Include Sanity ID if available
        customer_email: customerEmail  // Store email in metadata
      },
    });
    
    if (!session || !session.id || !session.url) {
      throw new Error("Failed to create Stripe session");
    }
    
    // Update the order with the Stripe session ID
    const { error: sessionUpdateError } = await supabase
      .from('orders')
      .update({
        stripe_session_id: session.id
      })
      .eq('id', supabaseOrderData.id);
    
    if (sessionUpdateError) {
      // Continue anyway as this is not critical
    } else {
    }
    
    // Update Sanity with session ID
    if (sanityId) {
      try {
        
        await sanityClient
          .patch(sanityId)
          .set({
            stripeSessionId: session.id
          })
          .commit({visibility: 'sync'});
          
        
        // Verify the update
        const updatedDoc = await sanityClient.getDocument(sanityId) as SanityDocument;
      } catch (error) {
        const sanityError = error as ErrorResponse;
        // Continue anyway as this is not critical
      }
    }
    
    
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
    
  } catch (error) {
    const errorResponse: ErrorResponse = error instanceof Error 
      ? { message: error.message || "Failed to create payment session" }
      : { message: "Unknown error occurred" };
      
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorResponse.message
      }, 
      { status: 500 }
    );
  }
}