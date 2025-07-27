import { NextResponse } from "next/server";
import Stripe from "stripe";
import { isAdminUser } from "@/utils/adminAuthServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: undefined,
});

export async function GET(req: Request) {
  try {
    const authResult = await isAdminUser(req);
    if (!authResult.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const subscriptions = await stripe.subscriptions.list({
      limit,
      expand: ['data.customer', 'data.items.data.price'],
    });

    // Filter out website-created subscriptions (those with sanityId in price metadata)
    const filteredSubscriptions = subscriptions.data.filter(sub => {
      const hasWebsiteMetadata = sub.items.data.some(item => 
        item.price?.metadata?.sanityId
      );
      return !hasWebsiteMetadata;
    });

    const manualSubscriptions = filteredSubscriptions.map(sub => {
      const firstItem = sub.items.data[0];
      const price = firstItem?.price;
      
      return {
        id: sub.id,
        customer_email: typeof sub.customer === 'object' && sub.customer && 'email' in sub.customer 
          ? sub.customer.email 
          : null,
        customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        created: new Date(sub.created * 1000).toISOString(),
        plan_amount: price?.unit_amount || 0,
        plan_currency: price?.currency || 'usd',
        plan_interval: price?.recurring?.interval || 'month',
        product_id: typeof price?.product === 'string' 
          ? price.product 
          : price?.product?.id || null
      };
    });

    return NextResponse.json({
      success: true,
      subscriptions: manualSubscriptions,
      total: filteredSubscriptions.length
    });

  } catch (error) {
    console.error('Error fetching manual subscriptions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch manual subscriptions"
      }, 
      { status: 500 }
    );
  }
}